import dotenv from "dotenv";

dotenv.config({quiet: true});


export const ENV = {
  PORT: process.env.PORT ,
  NODE_ENV: process.env.NODE_ENV,
  VITE_API_BASE_URL: process.env.VITE_API_BASE_URL,
  CLIENT_URL: process.env.CLIENT_URL,
  DB_URL: process.env.DB_URL,
  INNGEST_EVENT_KEY: process.env.INNGEST_EVENT_KEY,
  INNGEST_SIGNING_KEY: process.env.INNGEST_SIGNING_KEY,
  STREAM_API_KEY: process.env.STREAM_API_KEY,
  STREAM_API_SECRET: process.env.STREAM_API_SECRET,
  CLERK_PUBLISHABLE_KEY: process.env.CLERK_PUBLISHABLE_KEY,
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY
}