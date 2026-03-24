import dotenv from 'dotenv';

dotenv.config();

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing required env variable: ${name}`);
  }
  return value;
}

const origins = (process.env.FRONTEND_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT || 4000),
  MONGODB_URI: required('MONGODB_URI', 'mongodb+srv://dummy:dummy@cluster0.example.mongodb.net/goldsmith'),
  JWT_SECRET: required('JWT_SECRET', 'dummy_jwt_secret_change_me'),
  ACCESS_TOKEN_TTL: process.env.ACCESS_TOKEN_TTL || '15m',
  REFRESH_TOKEN_TTL_DAYS: Number(process.env.REFRESH_TOKEN_TTL_DAYS || 7),
  FRONTEND_ORIGINS: origins,
  COOKIE_SECURE: process.env.COOKIE_SECURE === 'true',
  CLOUDINARY_CLOUD_NAME: required('CLOUDINARY_CLOUD_NAME', 'dummy_cloud_name'),
  CLOUDINARY_API_KEY: required('CLOUDINARY_API_KEY', 'dummy_cloud_key'),
  CLOUDINARY_API_SECRET: required('CLOUDINARY_API_SECRET', 'dummy_cloud_secret')
};
