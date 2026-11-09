/**
 * CODE TO KNOW (碼上學)
 * PG17 Dedicated Read-Only Test Runner & Connection Hard Isolation Guard
 * 
 * Implements Four-Layer Guard Architecture:
 * - Guard 1: Entry Environment Hard-Locking
 * - Guard 2: Pre-connection Target Whitelist Validation
 * - Guard 3: Post-connection SQL Identity Handshake
 * - Guard 4: Prisma Instance Identity Assertion
 */

const fs = require('fs');
const http = require('http');

// =============================================================================
// GUARD 1: ENTRY ENVIRONMENT HARD-LOCKING
// Enforce strict test mode and remove ambient dev connection strings
// =============================================================================
process.env.NODE_ENV = 'test';
delete process.env.DATABASE_URL;
delete process.env.DIRECT_URL;
delete process.env.MIGRATION_DATABASE_URL;

// Approved Whitelist Coordinates
const APPROVED_TARGET = {
  host: '127.0.0.1',
  port: 5433,
  database: 'code_to_know_cloud_restore_test',
  user: 'codetoknow_restore',
};

// =============================================================================
// GUARD 2: PRE-CONNECTION TARGET WHITELIST VALIDATOR
// Reject any non-PG17 target BEFORE attempting network connection
// =============================================================================
function validateTargetAgainstWhitelist(options) {
  if (!options) {
    throw new Error('[GUARD 2 REJECTED] Connection options missing.');
  }
  if (options.host !== APPROVED_TARGET.host) {
    throw new Error(`[GUARD 2 REJECTED] Disallowed host: '${options.host}'. Approved: '${APPROVED_TARGET.host}'.`);
  }
  if (Number(options.port) !== APPROVED_TARGET.port) {
    throw new Error(`[GUARD 2 REJECTED] Disallowed port: '${options.port}'. Refusing connection to prevent PG16 or Cloud write. Approved port: ${APPROVED_TARGET.port}.`);
  }
  if (options.database !== APPROVED_TARGET.database) {
    throw new Error(`[GUARD 2 REJECTED] Disallowed database: '${options.database}'. Approved: '${APPROVED_TARGET.database}'.`);
  }
  if (options.user !== APPROVED_TARGET.user) {
    throw new Error(`[GUARD 2 REJECTED] Disallowed user: '${options.user}'. Approved: '${APPROVED_TARGET.user}'.`);
  }
  if (!options.password || !options.password.trim()) {
    throw new Error('[GUARD 2 REJECTED] Missing database authentication password.');
  }
  return true;
}

// =============================================================================
// GUARD 3: POST-CONNECTION SQL IDENTITY HANDSHAKE
// Verify engine version, server port, current user, and database via SQL probe
// =============================================================================
async function assertPostConnectIdentity(pool) {
  const probe = await pool.query('SELECT version(), current_database(), current_user, inet_server_port();');
  const row = probe.rows[0];

  const clientPort = pool.options.port;
  const dbName = row.current_database;
  const dbUser = row.current_user;
  const isPg17 = row.version.includes('PostgreSQL 17');

  if (clientPort !== APPROVED_TARGET.port || dbName !== APPROVED_TARGET.database || dbUser !== APPROVED_TARGET.user || !isPg17) {
    throw new Error('[GUARD 3 REJECTED] Connected target identity verification failed! Target is NOT confirmed PG17 restore sandbox.');
  }

  return {
    verified: true,
    database: dbName,
    user: dbUser,
    clientPort,
    version: row.version.split(',')[0],
  };
}

// =============================================================================
// RUNNER FACTORY: Initialize Isolated Test Environment
// =============================================================================
async function createIsolatedPg17Environment(customOptions = {}) {
  const targetOptions = {
    host: customOptions.host !== undefined ? customOptions.host : APPROVED_TARGET.host,
    port: customOptions.port !== undefined ? customOptions.port : APPROVED_TARGET.port,
    database: customOptions.database !== undefined ? customOptions.database : APPROVED_TARGET.database,
    user: customOptions.user !== undefined ? customOptions.user : APPROVED_TARGET.user,
    password: customOptions.password !== undefined ? customOptions.password : (
      fs.existsSync('C:/Users/user/Documents/CODE-TO-KNOW_SECRETS/pg17_restore_user_password.txt')
        ? fs.readFileSync('C:/Users/user/Documents/CODE-TO-KNOW_SECRETS/pg17_restore_user_password.txt', 'utf8').trim()
        : ''
    ),
  };

  // Run Guard 2 Whitelist Validation
  validateTargetAgainstWhitelist(targetOptions);

  const pg = require('c:/Users/user/Documents/CODE-TO-KNOW/backend/node_modules/pg');
  const { PrismaClient } = require('c:/Users/user/Documents/CODE-TO-KNOW/backend/node_modules/@prisma/client');
  const { PrismaPg } = require('c:/Users/user/Documents/CODE-TO-KNOW/backend/node_modules/@prisma/adapter-pg');

  const pool = new pg.Pool({
    host: targetOptions.host,
    port: targetOptions.port,
    user: targetOptions.user,
    password: targetOptions.password,
    database: targetOptions.database,
    ssl: false,
    connectionTimeoutMillis: 5000,
  });

  // Run Guard 3 Post-Connect Verification
  const idInfo = await assertPostConnectIdentity(pool);

  // Initialize Isolated Prisma Instance
  const adapter = new PrismaPg(pool);
  const testPrisma = new PrismaClient({
    adapter,
    log: ['error'],
  });

  // Inject into global.__prisma BEFORE loading app modules
  global.__prisma = testPrisma;

  // Load app modules
  const { createApp } = require('c:/Users/user/Documents/CODE-TO-KNOW/backend/dist/app.js');
  const { prisma: appPrisma } = require('c:/Users/user/Documents/CODE-TO-KNOW/backend/dist/config/database.js');

  // ===========================================================================
  // GUARD 4: PRISMA INSTANCE IDENTITY ASSERTION
  // ===========================================================================
  if (appPrisma !== testPrisma) {
    await testPrisma.$disconnect();
    await pool.end();
    throw new Error('[GUARD 4 REJECTED] Prisma instance identity mismatch! appPrisma !== testPrisma.');
  }

  return {
    pool,
    prisma: testPrisma,
    createApp,
    identity: idInfo,
    async shutdown() {
      await testPrisma.$disconnect();
      await pool.end();
    },
  };
}

module.exports = {
  APPROVED_TARGET,
  validateTargetAgainstWhitelist,
  assertPostConnectIdentity,
  createIsolatedPg17Environment,
};
