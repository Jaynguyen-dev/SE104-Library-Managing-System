import dotenv from "dotenv";
dotenv.config();

function required(key) {
  const val = process.env[key];
  if (!val) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return val;
}

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT, 10) || 3001,
  JWT_SECRET: process.env.NODE_ENV === "production" ? required("JWT_SECRET") : (process.env.JWT_SECRET || "dev_secret_change_me"),
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",
  DATABASE_URL: process.env.NODE_ENV === "production" ? required("DATABASE_URL") : process.env.DATABASE_URL,
  GOOGLE_BOOKS_API_KEY: process.env.GOOGLE_BOOKS_API_KEY || "",
  CRAWL_CONCURRENCY: parseInt(process.env.CRAWL_CONCURRENCY, 10) || 3,
  CRAWL_DELAY_MS: parseInt(process.env.CRAWL_DELAY_MS, 10) || 500,
};
