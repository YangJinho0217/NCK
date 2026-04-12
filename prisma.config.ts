import { config } from 'dotenv';
import { defineConfig, env } from 'prisma/config';

// 환경별 .env 파일 로드
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : process.env.NODE_ENV === 'test' ? '.env.test' : '.env.development';

config({ path: envFile });

export default defineConfig({
  schema: 'prisma/schema',
  datasource: {
    url: env('DATABASE_URL'),
  },
});
