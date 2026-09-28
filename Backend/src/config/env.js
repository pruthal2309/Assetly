import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(8000),
  MONGODB_URI: z.string().default('mongodb://127.0.0.1:27017/assetly'),
  USE_TRANSACTIONS: z.coerce.boolean().default(false),
  JWT_ACCESS_SECRET: z.string().default('change_me_access_secret_key_assetly_2026'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  REFRESH_TTL_DAYS: z.coerce.number().default(7),
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
  UPLOAD_DIR: z.string().default('uploads'),
  PUBLIC_BASE_URL: z.string().default('http://localhost:8000'),
  SEED_CENTER_LAT: z.coerce.number().default(12.9141),
  SEED_CENTER_LNG: z.coerce.number().default(74.8560),
  VISION_API_KEY: z.string().optional().default(''),
  EMAIL_HOST: z.string().optional().default(''),
  EMAIL_PORT: z.coerce.number().optional().default(587),
  EMAIL_USER: z.string().optional().default(''),
  EMAIL_PASSWORD: z.string().optional().default(''),
  EMAIL_FROM: z.string().optional().default('no-reply@assetly.com'),
  APP_URL: z.string().optional().default('http://localhost:5173')
});

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ Environment validation error:', JSON.stringify(result.error.format(), null, 2));
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
  }
  return result.data || envSchema.parse({});
};

export const env = parseEnv();
