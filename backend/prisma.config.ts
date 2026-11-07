import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';
import {
  resolveDatasourceUrl,
  validateTestDatabaseUrl,
  validateMigrationDatabaseUrl,
  validateDevelopmentDatabaseUrl,
} from './src/config/db-validation.js';

export {
  resolveDatasourceUrl,
  validateTestDatabaseUrl,
  validateMigrationDatabaseUrl,
  validateDevelopmentDatabaseUrl,
};

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    get url() {
      return resolveDatasourceUrl((key) => env(key));
    },
  },
});
