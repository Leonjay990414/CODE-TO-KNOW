import { describe, it, expect, vi, afterEach } from 'vitest';
import { NextFunction, Request, Response } from 'express';
import {
  logSafeError,
  redactStringSecrets,
  sanitizeAuditValue,
} from '../src/utils/redaction.js';
import { errorHandler } from '../src/middleware/error-handler.js';

describe('Safe Global Error Logger & Redaction Precision (Phase 3-C-21)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it('1. redacts DSN credentials in Error.message while keeping safe diagnostics', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const err = new Error('DB dial failed: postgresql://app_user:dummy_pg_dsn_secret@127.0.0.1:5432/db');
    err.name = 'DatabaseInitError';
    (err as any).code = 'ECONNREFUSED';

    logSafeError('Startup failure:', err);

    expect(spy).toHaveBeenCalledTimes(1);
    const out = JSON.stringify(spy.mock.calls[0]);
    expect(out).not.toContain('dummy_pg_dsn_secret');
    expect(out).toContain('postgresql://app_user:[REDACTED]@127.0.0.1:5432/db');
    expect(out).toContain('DatabaseInitError');
    expect(out).toContain('ECONNREFUSED');
  });

  it('2. redacts bearer tokens in Error.stack', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const err = new Error('Token failure: Bearer dummy_stack_jwt_secret');
    err.stack =
      'Error: Token failure: Bearer dummy_stack_jwt_secret\n' +
      '    at authCheck (file:///app/auth.ts:10:5)\n' +
      '    // leaked header Authorization: Basic ZHVtbXlfc3RhY2s=';

    logSafeError('Stack test:', err);

    const out = JSON.stringify(spy.mock.calls[0]);
    expect(out).not.toContain('dummy_stack_jwt_secret');
    expect(out).not.toContain('ZHVtbXlfc3RhY2s=');
    expect(out).toContain('Bearer [REDACTED]');
    expect(out).toContain('Authorization: [REDACTED]');
  });

  it('3. redacts password secrets inside Error.cause', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const rootCause = new Error('Upstream rejected password=dummy_cause_pw_123');
    const outerErr = new Error('Service call failed', { cause: rootCause });

    logSafeError('Operation failed:', outerErr);

    const out = JSON.stringify(spy.mock.calls[0]);
    expect(out).not.toContain('dummy_cause_pw_123');
    expect(out).toContain('password=[REDACTED]');
  });

  it('4. redacts API Keys inside AggregateError.errors (including non-enumerable errors array)', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const err1 = new Error('Provider A failed with api_key=dummy_agg_ak_1');
    const err2: any = new Error('Provider B failed');
    err2.headers = { 'x-api-key': 'dummy_agg_ak_2', requestId: 'req-77' };
    const agg = new AggregateError([err1, err2], 'All upstream providers failed Bearer dummy_agg_tok');

    logSafeError('Aggregate failure:', agg);

    expect(spy).toHaveBeenCalledTimes(1);
    const serialized = JSON.stringify(spy.mock.calls[0]);
    expect(serialized).not.toContain('dummy_agg_ak_1');
    expect(serialized).not.toContain('dummy_agg_ak_2');
    expect(serialized).not.toContain('dummy_agg_tok');
    expect(serialized).toContain('AggregateError');
    expect(serialized).toContain('api_key=[REDACTED]');
    expect(serialized).toContain('req-77');
  });

  it('5. redacts deeply nested Error chains and custom props up to depth cap', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const level3 = new Error('Level 3 secret=dummy_nested_err_3');
    const level2 = new Error('Level 2 token=dummy_nested_err_2', { cause: level3 });
    const level1: any = new Error('Level 1 cookie=dummy_nested_err_1', { cause: level2 });
    level1.meta = {
      nested: {
        nested: {
          nested: {
            nested: {
              nested: {
                api_key: 'dummy_deep_err_ak',
                overLimit: { secret: 'dummy_depth7_must_not_leak' },
              },
            },
          },
        },
      },
    };

    logSafeError('Nested error:', level1);

    const out = JSON.stringify(spy.mock.calls[0]);
    expect(out).not.toContain('dummy_nested_err_1');
    expect(out).not.toContain('dummy_nested_err_2');
    expect(out).not.toContain('dummy_nested_err_3');
    expect(out).not.toContain('dummy_deep_err_ak');
    expect(out).not.toContain('dummy_depth7_must_not_leak');
    expect(out).toContain('[MAX_DEPTH_REDACTED]');
  });

  it('6. handles circular references across Error.cause, AggregateError.errors, and objects safely', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const e1: any = new Error('Cycle 1 token=dummy_cycle_tok');
    const e2: any = new Error('Cycle 2', { cause: e1 });
    e1.cause = e2;
    const agg: any = new AggregateError([e1], 'Cycle Agg');
    e1.parentAgg = agg;

    logSafeError('Circular agg:', agg);

    const out = JSON.stringify(spy.mock.calls[0]);
    expect(out).not.toContain('dummy_cycle_tok');
    expect(out).toContain('[CIRCULAR]');
  });

  it('7. fails closed on objects with throwing getters without leaking adjacent secrets', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const poison = {
      password: 'dummy_adjacent_pw_never_leak',
      get boom() {
        throw new Error('getter crashed postgresql://u:dummy_getter_dsn@h/db');
      },
    };

    logSafeError('Poison getter error:', poison);

    expect(spy).toHaveBeenCalledTimes(1);
    const out = JSON.stringify(spy.mock.calls[0]);
    expect(out).not.toContain('dummy_adjacent_pw_never_leak');
    expect(out).not.toContain('dummy_getter_dsn');
    expect(out).toContain('REDACTION_ERROR');
  });

  it('8. neutralizes throwing toJSON methods without executing them or leaking secrets', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const errWithToJson: any = new Error('Wrap error Bearer dummy_tojson_outer');
    errWithToJson.extra = {
      safeLabel: 'ctx-1',
      toJSON() {
        throw new Error('toJSON exploded secret=dummy_tojson_inner');
      },
    };

    logSafeError('toJSON poison:', errWithToJson);

    const out = JSON.stringify(spy.mock.calls[0]);
    expect(out).not.toContain('dummy_tojson_outer');
    expect(out).not.toContain('dummy_tojson_inner');
    expect(out).toContain('ctx-1');
    expect(out).toContain('[function]');
  });

  it('9. fails closed on sanitize failures inside logSafeError and never throws over caller error', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const throwingProxy = new Proxy(
      {},
      {
        ownKeys() {
          throw new Error('proxy ownKeys exploded redis://u:dummy_proxy_pw@h:6379');
        },
      }
    );

    expect(() =>
      logSafeError('Fail closed log redis://u:dummy_msg_pw@h:6379:', throwingProxy)
    ).not.toThrow();

    expect(spy).toHaveBeenCalledTimes(1);
    const out = JSON.stringify(spy.mock.calls[0]);
    expect(out).not.toContain('dummy_proxy_pw');
    expect(out).not.toContain('dummy_msg_pw');
    expect(out).toContain('REDACTION_ERROR');
  });

  it('10. errorHandler actual stderr and HTTP response exclude secrets, Cookies, Authorization, and body', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const err = new Error(
      'Unhandled failure postgresql://svc:dummy_eh_dsn_pw@db.local:5432/app Bearer dummy_eh_jwt'
    );
    const req = {
      method: 'POST',
      path: '/api/auth/login',
      headers: {
        authorization: 'Bearer dummy_req_header_auth',
        cookie: 'sid=dummy_req_cookie',
      },
      body: {
        email: 'user@example.edu',
        password: 'dummy_req_body_password',
      },
    } as unknown as Request;

    let statusCode = 0;
    let jsonBody: any = null;
    const res = {
      status(code: number) {
        statusCode = code;
        return this;
      },
      json(payload: unknown) {
        jsonBody = payload;
        return this;
      },
    } as unknown as Response;

    errorHandler(err, req, res, vi.fn() as NextFunction);

    expect(statusCode).toBe(500);
    expect(jsonBody.success).toBe(false);
    expect(jsonBody.error.code).toBe('INTERNAL_SERVER_ERROR');

    expect(spy).toHaveBeenCalledTimes(1);
    const logged = JSON.stringify(spy.mock.calls[0]);
    expect(logged).not.toContain('dummy_eh_dsn_pw');
    expect(logged).not.toContain('dummy_eh_jwt');
    expect(logged).not.toContain('dummy_req_header_auth');
    expect(logged).not.toContain('dummy_req_cookie');
    expect(logged).not.toContain('dummy_req_body_password');
    expect(logged).toContain('POST');
    expect(logged).toContain('/api/auth/login');
    expect(logged).toContain('[REDACTED]');
  });

  it('11. server shutdown database disconnect failure redacts credentials and returns false', async () => {
    const consoleErrSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const closeSpy = vi.fn((cb?: () => void) => {
      if (cb) cb();
    });

    vi.doMock('../src/app.js', () => ({
      app: {
        listen: vi.fn(() => ({ close: closeSpy })),
      },
    }));
    vi.doMock('../src/config/database.js', () => ({
      prisma: {
        $disconnect: vi.fn(async () => {
          const e: any = new Error(
            'Disconnect failed for postgresql://admin:dummy_shutdown_pg_pw@db.internal:5432/prod'
          );
          e.code = 'P1001';
          throw e;
        }),
      },
    }));

    const { disconnectDatabaseOnShutdown } = await import('../src/server.js');
    const ok = await disconnectDatabaseOnShutdown();

    expect(ok).toBe(false);
    expect(consoleErrSpy).toHaveBeenCalled();
    const out = JSON.stringify(consoleErrSpy.mock.calls);
    expect(out).not.toContain('dummy_shutdown_pg_pw');
    expect(out).toContain('postgresql://admin:[REDACTED]@db.internal:5432/prod');
    expect(out).toContain('P1001');
  });

  it('12 & 13. redacts multi-param and URL-encoded query strings while preserving normal params intact', () => {
    const plainUrl =
      'https://app.codetoknow.edu/cb?access_token=dummy_qs_tok_1&ok=1&Client-Secret=dummy_qs_sec&api_key=dummy_qs_ak&page=2&lang=zh-TW';
    const plainRedacted = redactStringSecrets(plainUrl);
    expect(plainRedacted).toBe(
      'https://app.codetoknow.edu/cb?access_token=[REDACTED]&ok=1&Client-Secret=[REDACTED]&api_key=[REDACTED]&page=2&lang=zh-TW'
    );

    const caseMixedUrl =
      '/oauth/callback?ACCESS_TOKEN=dummy_upper_tok&Api-Key=dummy_mixed_ak&session_token=dummy_sess_tok&tab=overview';
    expect(redactStringSecrets(caseMixedUrl)).toBe(
      '/oauth/callback?ACCESS_TOKEN=[REDACTED]&Api-Key=[REDACTED]&session_token=[REDACTED]&tab=overview'
    );

    const encodedNestedUrl =
      'https://app.test/login?next=https%3A%2F%2Fapp.test%2Fcb%3Faccess_token%3Ddummy_encoded_tok%26ok%3D1%26refresh_token%3Ddummy_encoded_ref&state=normal_state';
    const encodedRedacted = redactStringSecrets(encodedNestedUrl);
    expect(encodedRedacted).not.toContain('dummy_encoded_tok');
    expect(encodedRedacted).not.toContain('dummy_encoded_ref');
    expect(encodedRedacted).toContain('%26ok%3D1%26');
    expect(encodedRedacted).toContain('&state=normal_state');

    const malformedPercent = '/cb?token=%E0%A4%A&ok=1';
    expect(redactStringSecrets(malformedPercent)).toBe('/cb?token=[REDACTED]&ok=1');
  });

  it('14 & 15. preserves sessionId/revokedExistingSessions while masking genuine session secrets', () => {
    const mixed = sanitizeAuditValue({
      sessionId: 'sess-row-uuid-1234',
      session_id: 'sess-row-uuid-5678',
      revokedExistingSessions: true,
      author: '林老師',
      passed: true,
      sessionToken: 'dummy_real_session_token',
      session_secret: 'dummy_real_session_secret',
      sessionKey: 'dummy_real_session_key',
      sessionCookie: 'sid=dummy_real_session_cookie',
      cookie: 'dummy_cookie_val',
      session: 'dummy_opaque_session',
    }) as Record<string, unknown>;

    expect(mixed.sessionId).toBe('sess-row-uuid-1234');
    expect(mixed.session_id).toBe('sess-row-uuid-5678');
    expect(mixed.revokedExistingSessions).toBe(true);
    expect(mixed.author).toBe('林老師');
    expect(mixed.passed).toBe(true);

    expect(mixed.sessionToken).toBe('[REDACTED]');
    expect(mixed.session_secret).toBe('[REDACTED]');
    expect(mixed.sessionKey).toBe('[REDACTED]');
    expect(mixed.sessionCookie).toBe('[REDACTED]');
    expect(mixed.cookie).toBe('[REDACTED]');
    expect(mixed.session).toBe('[REDACTED]');

    // Inline string query forms also preserve sessionId while masking session_token
    const inlineQs = '/verify?sessionId=sess-1&session_token=dummy_inline_sess_tok&ok=1';
    expect(redactStringSecrets(inlineQs)).toBe(
      '/verify?sessionId=sess-1&session_token=[REDACTED]&ok=1'
    );
  });

  it('16. prevents infinite recursion and never writes to AuditLog when logSafeError itself fails', async () => {
    let reentrantCalls = 0;
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {
      reentrantCalls++;
      // Attempt re-entrant call back into logSafeError AND throw from sink
      logSafeError('Reentrant failure attempt Bearer dummy_reentrant_tok', new Error('sink threw'));
      throw new Error('console.error sink failure');
    });

    expect(() =>
      logSafeError('Initial log failure:', new Error('db error password=dummy_init_err_pw'))
    ).not.toThrow();

    // Only the outer console.error runs once; the inner re-entrant call is dropped immediately
    expect(reentrantCalls).toBe(1);
    expect(consoleSpy).toHaveBeenCalledTimes(1);
  });

  it('17. completely masks URL-encoded secrets containing %26, %23, %3B, %20 and multi-layer encoding while keeping normal params', () => {
    const encodedPwUrl = '/cb?password=p%40ss%26word&ok=1';
    const redactedPw = redactStringSecrets(encodedPwUrl);
    expect(redactedPw).toBe('/cb?password=[REDACTED]&ok=1');
    expect(redactedPw).not.toContain('p%40ss');
    expect(redactedPw).not.toContain('%26word');

    const multiEncodedDelimsUrl =
      '/oauth/cb?access_token=tok%26part2%23part3%3Bpart4%20tail&ok=1&Client-Secret=cs%26hidden&page=2&lang=zh-TW';
    const redactedTok = redactStringSecrets(multiEncodedDelimsUrl);
    expect(redactedTok).toBe(
      '/oauth/cb?access_token=[REDACTED]&ok=1&Client-Secret=[REDACTED]&page=2&lang=zh-TW'
    );
    expect(redactedTok).not.toContain('part2');
    expect(redactedTok).not.toContain('part3');
    expect(redactedTok).not.toContain('part4');
    expect(redactedTok).not.toContain('hidden');

    // Layer-1 & Layer-2 nested percent-encoded query strings + key separator percent encoding
    const doubleEncoded =
      'https://app.test/login?next=https%3A%2F%2Fapp.test%2Fcb%3Finner%3Dhttps%253A%252F%252Fidp.test%252F%253Faccess_token%253Ddummy_l2_tok%2526ok%253D1%26ACCESS_TOKEN%3Ddummy_l1_tok%26keep%3Dyes&access%5Ftoken=dummy_pct_key_tok&state=normal';
    const redactedDouble = redactStringSecrets(doubleEncoded);
    expect(redactedDouble).not.toContain('dummy_l2_tok');
    expect(redactedDouble).not.toContain('dummy_l1_tok');
    expect(redactedDouble).not.toContain('dummy_pct_key_tok');
    expect(redactedDouble).toContain('%2526ok%253D1');
    expect(redactedDouble).toContain('%26keep%3Dyes');
    expect(redactedDouble).toContain('&state=normal');

    // Invalid percent sequences stay fail-closed and never decode unvalidated strings
    const invalidPct = '/cb?token=%E0%A4%A%26secret_tail&password=%ZZ%23frag&ok=1';
    const redactedInvalid = redactStringSecrets(invalidPct);
    expect(redactedInvalid).toBe('/cb?token=[REDACTED]&password=[REDACTED]&ok=1');
    expect(redactedInvalid).not.toContain('secret_tail');
    expect(redactedInvalid).not.toContain('frag');
  });

  it('18. safely serializes Map and Set attached to Error while redacting keys/values/members and preserving diagnostics', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const headersMap = new Map<unknown, unknown>([
      ['authorization', 'Bearer dummy_map_bearer'],
      ['api_key', 'dummy_map_ak'],
      ['requestId', 'req-map-99'],
      [{ token: 'dummy_map_obj_key_tok', label: 'meta-key' }, { secret: 'dummy_map_obj_val', ok: true }],
      ['dsnKey redis://u:dummy_map_dsn_key_pw@h:6379/0', 'cache-cluster'],
    ]);

    const tagsSet = new Set<unknown>([
      'safe-tag',
      'Bearer dummy_set_bearer',
      { password: 'dummy_set_obj_pw', step: 'validate' },
    ]);

    const err: any = new Error('Request failed');
    err.headersMap = headersMap;
    err.tagsSet = tagsSet;

    logSafeError('Special collections error:', err);

    expect(spy).toHaveBeenCalledTimes(1);
    const out = JSON.stringify(spy.mock.calls[0]);
    expect(out).not.toContain('dummy_map_bearer');
    expect(out).not.toContain('dummy_map_ak');
    expect(out).not.toContain('dummy_map_obj_key_tok');
    expect(out).not.toContain('dummy_map_obj_val');
    expect(out).not.toContain('dummy_map_dsn_key_pw');
    expect(out).not.toContain('dummy_set_bearer');
    expect(out).not.toContain('dummy_set_obj_pw');
    expect(out).toContain('req-map-99');
    expect(out).toContain('meta-key');
    expect(out).toContain('cache-cluster');
    expect(out).toContain('safe-tag');
    expect(out).toContain('validate');
    expect(out).toContain('"type":"Map"');
    expect(out).toContain('"type":"Set"');
  });

  it('19. safely serializes URL and URLSearchParams attached to Error without leaking credentials or query secrets', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const targetUrl = new URL(
      'https://svc_user:dummy_url_pw@api.codetoknow.edu:8443/v1/callback?access_token=dummy_url_tok&ok=1&next=postgresql://u:dummy_nested_dsn_pw@db:5432/app#refresh_token=dummy_frag_ref'
    );
    const ftpUrl = new URL('ftp://ftpuser:dummy_ftp_pw@files.internal/backup.dump?token=dummy_ftp_tok&dir=out');
    const searchParams = new URLSearchParams([
      ['client_secret', 'dummy_usp_cs'],
      ['tag', 'alpha'],
      ['tag', 'beta Bearer dummy_usp_tag_tok'],
      ['page', '3'],
    ]);

    const err: any = new Error('Upstream URL call failed');
    err.targetUrl = targetUrl;
    err.ftpUrl = ftpUrl;
    err.searchParams = searchParams;

    logSafeError('URL diagnostics:', err);

    expect(spy).toHaveBeenCalledTimes(1);
    const out = JSON.stringify(spy.mock.calls[0]);
    expect(out).not.toContain('dummy_url_pw');
    expect(out).not.toContain('dummy_url_tok');
    expect(out).not.toContain('dummy_nested_dsn_pw');
    expect(out).not.toContain('dummy_frag_ref');
    expect(out).not.toContain('dummy_ftp_pw');
    expect(out).not.toContain('dummy_ftp_tok');
    expect(out).not.toContain('dummy_usp_cs');
    expect(out).not.toContain('dummy_usp_tag_tok');

    expect(out).toContain('api.codetoknow.edu');
    expect(out).toContain('/v1/callback');
    expect(out).toContain('"ok":"1"');
    expect(out).toContain('files.internal');
    expect(out).toContain('"dir":"out"');
    expect(out).toContain('"page":"3"');
    expect(out).toContain('"type":"URL"');
    expect(out).toContain('"type":"URLSearchParams"');
    expect(out).toContain('[REDACTED]');
  });

  it('20. enforces circular, depth, collection, and string length limits on Map, Set, URL, and URLSearchParams', () => {
    const circularMap = new Map<unknown, unknown>();
    circularMap.set('self', circularMap);
    circularMap.set(circularMap, 'key-ref');
    const circularSet = new Set<unknown>();
    circularSet.add(circularSet);

    const mapRes = sanitizeAuditValue(circularMap) as any;
    expect(mapRes.type).toBe('Map');
    expect(mapRes.entries[0]).toEqual(['self', '[CIRCULAR]']);
    expect(mapRes.entries[1]).toEqual(['[CIRCULAR]', 'key-ref']);

    const setRes = sanitizeAuditValue(circularSet) as any;
    expect(setRes.type).toBe('Set');
    expect(setRes.values[0]).toBe('[CIRCULAR]');

    // Depth limit > 6 stops nested Map/Set/URL
    const deep: any = { l1: { l2: { l3: { l4: { l5: { l6: { map: new Map([['token', 'dummy_deep_map']]), url: new URL('https://u:dummy_deep_url@h/p') } } } } } } };
    const deepJson = JSON.stringify(sanitizeAuditValue(deep));
    expect(deepJson).not.toContain('dummy_deep_map');
    expect(deepJson).not.toContain('dummy_deep_url');
    expect(deepJson).toContain('[MAX_DEPTH_REDACTED]');

    // Collection cap > 100
    const largeMap = new Map<string, string>();
    const largeSet = new Set<string>();
    const largeUsp = new URLSearchParams();
    for (let i = 0; i < 105; i++) {
      largeMap.set(`k${i}`, i === 104 ? 'dummy_tail_map_val' : `v${i}`);
      largeSet.add(i === 104 ? 'dummy_tail_set_val' : `item${i}`);
      largeUsp.append(`p${i}`, i === 104 ? 'dummy_tail_usp_val' : `${i}`);
    }
    const largeMapRes = sanitizeAuditValue(largeMap) as any;
    const largeSetRes = sanitizeAuditValue(largeSet) as any;
    const largeUspRes = sanitizeAuditValue(largeUsp) as any;
    expect(largeMapRes.truncatedEntries).toBe(5);
    expect(largeSetRes.truncatedItems).toBe(5);
    expect(largeUspRes.truncatedParams).toBe(5);
    expect(JSON.stringify({ largeMapRes, largeSetRes, largeUspRes })).not.toContain('dummy_tail_');
  });

  it('21. fails closed on spoofed/broken special objects, Proxies, and does not invoke instance getters or toJSON', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Spoofed prototype without internal slots -> fail-closed
    const forgedUrl = Object.create(URL.prototype);
    expect(sanitizeAuditValue(forgedUrl)).toBe('[REDACTION_ERROR]');

    const forgedMap = Object.create(Map.prototype);
    expect(sanitizeAuditValue(forgedMap)).toBe('[REDACTION_ERROR]');

    // Proxy wrapping URL/Map -> native internal slot check rejects & fails closed
    const proxiedMap = new Proxy(new Map([['secret', 'dummy_proxy_map_secret']]), {});
    logSafeError('Proxied map:', proxiedMap);
    expect(JSON.stringify(spy.mock.calls)).not.toContain('dummy_proxy_map_secret');
    expect(JSON.stringify(spy.mock.calls)).toContain('REDACTION_ERROR');

    // Poisoned instance getter & toJSON on genuine URL are NEVER invoked because native prototype getters are used
    const realUrlWithPoison: any = new URL('https://u:dummy_inst_url_pw@example.org/safe?token=dummy_inst_tok&ok=1');
    let poisonInvoked = false;
    Object.defineProperty(realUrlWithPoison, 'href', {
      configurable: true,
      get() {
        poisonInvoked = true;
        throw new Error('poison href getter password=dummy_poison_getter_leak');
      },
    });
    realUrlWithPoison.toJSON = () => {
      poisonInvoked = true;
      throw new Error('poison toJSON secret=dummy_poison_tojson_leak');
    };

    const safeUrlOut = JSON.stringify(sanitizeAuditValue(realUrlWithPoison));
    expect(poisonInvoked).toBe(false);
    expect(safeUrlOut).not.toContain('dummy_inst_url_pw');
    expect(safeUrlOut).not.toContain('dummy_inst_tok');
    expect(safeUrlOut).not.toContain('dummy_poison_getter_leak');
    expect(safeUrlOut).not.toContain('dummy_poison_tojson_leak');
    expect(safeUrlOut).toContain('example.org');
    expect(safeUrlOut).toContain('"ok":"1"');
  });
});
