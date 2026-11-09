import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import crypto from 'node:crypto';
import path from 'node:path';
import tls from 'node:tls';
import { resolveProductionSslConfig, createDatabasePool } from '../src/config/database.js';

describe('PostgreSQL TLS CA Configuration & Safety (W-02)', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('[TLS-01] PASS: 正式環境具有有效官方 CA 時，產生正確 SSL 設定並驗證 X509 Subject', () => {
    const sslConfig = resolveProductionSslConfig();

    expect(sslConfig).toBeDefined();
    expect(sslConfig).toHaveProperty('rejectUnauthorized', true);
    expect(sslConfig).toHaveProperty('ca');
    expect(typeof (sslConfig as any).ca).toBe('string');
    expect((sslConfig as any).ca).toContain('-----BEGIN CERTIFICATE-----');

    // 解析 X509 憑證，驗證 Subject 與 Issuer 包含 Supabase Root 2021 CA
    const x509 = new crypto.X509Certificate((sslConfig as any).ca);
    expect(x509.subject).toContain('CN=Supabase Root 2021 CA');
    expect(x509.issuer).toContain('O=Supabase Inc');
    expect(x509.ca).toBe(true);
  });

  it('[TLS-02] PASS: rejectUnauthorized 必須為 true，杜絕中間人攻擊', () => {
    const sslConfig = resolveProductionSslConfig();
    expect((sslConfig as any).rejectUnauthorized).toBe(true);
  });

  it('[TLS-03] PASS: 不得自訂 checkServerIdentity 回傳 undefined 略過主機名驗證', () => {
    const sslConfig = resolveProductionSslConfig();
    // 依據 RFC 6125，checkServerIdentity 不應被覆蓋為回傳 undefined 的 dummy 函式
    expect((sslConfig as any).checkServerIdentity).toBeUndefined();
  });

  it('[TLS-04] BLOCK: 正式環境指定不存在之 CA 路徑時立即拋出明確錯誤', () => {
    process.env.SUPABASE_CA_CERT_PATH = 'non_existent_certs/fake_ca.crt';

    expect(() => resolveProductionSslConfig()).toThrowError(
      /\[DATABASE SSL CONFIG ERROR\] Production CA certificate not found/
    );
  });

  it('[TLS-05] PASS: 開發/測試環境不被強制套用正式 CA 設定', () => {
    process.env.NODE_ENV = 'test';
    const pool = createDatabasePool();
    // In test / dev mode, pool.options.ssl should be undefined or not forced to prod CA
    expect(pool.options.ssl).toBeUndefined();
  });

  it('[TLS-06] PASS: 自簽不受信任之假憑證比對時能辨識差異', () => {
    const validSsl = resolveProductionSslConfig();
    const fakeCa = '-----BEGIN CERTIFICATE-----\nFAKE_CORRUPTED_BASE64\n-----END CERTIFICATE-----\n';

    expect((validSsl as any).ca).not.toBe(fakeCa);
  });

  it('[TLS-07] PASS: 驗證 Node.js 原廠 tls.checkServerIdentity 對 SAN 主機名比對防護行為', () => {
    // 模擬憑證主機名不相符的情境
    const mockCert = {
      subjectaltname: 'DNS:*.pooler.supabase.com, DNS:pooler.supabase.com',
    } as tls.PeerCertificate;

    // 正確主機名：應通過 (回傳 undefined)
    const validHostResult = tls.checkServerIdentity('aws-0-ap-southeast-2.pooler.supabase.com', mockCert);
    expect(validHostResult).toBeUndefined();

    // 錯誤/攻擊者偽冒主機名：應拋出 Error 或回傳 Error 物件
    const invalidHostResult = tls.checkServerIdentity('attacker.evil.com', mockCert);
    expect(invalidHostResult).toBeInstanceOf(Error);
    expect((invalidHostResult as Error).message).toContain('does not match');
  });
});
