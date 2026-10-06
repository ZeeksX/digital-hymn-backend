import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).pipe(z.number().positive()).default(5000),
  MONGODB_URI: z.string().default('mongodb://127.0.0.1:27017/digital-hymn-book'),
  FRONTEND_ORIGIN: z.string().default('http://localhost:4200,http://127.0.0.1:4200'),
  COOKIE_SECRET: z.string().min(16).default('dhb_cookie_secret_super_secure_key_123'),
  JWT_ACCESS_SECRET: z.string().min(16).default('dhb_jwt_access_secret_production_key_456'),
  JWT_REFRESH_SECRET: z.string().min(16).default('dhb_jwt_refresh_secret_production_key_789'),
  GOOGLE_CLIENT_ID: z.string().default(''),
});

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Invalid environment configuration:');
    for (const issue of result.error.issues) {
      console.error(` - ${issue.path.join('.')}: ${issue.message}`);
    }
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    // Return with defaults in non-production if invalid
    return envSchema.parse({
      NODE_ENV: process.env.NODE_ENV || 'development',
      PORT: process.env.PORT || '5000',
      MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/digital-hymn-book',
      FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN || 'http://localhost:4200,http://127.0.0.1:4200',
      COOKIE_SECRET: process.env.COOKIE_SECRET || 'dhb_cookie_secret_super_secure_key_123',
      JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'dhb_jwt_access_secret_production_key_456',
      JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'dhb_jwt_refresh_secret_production_key_789',
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
    });
  }
  return result.data;
};

export const env = parseEnv();
export type Environment = z.infer<typeof envSchema>;
