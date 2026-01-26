import dotenv from "dotenv";

dotenv.config({quiet: true});


export const ENV = {
  PORT: process.env.PORT ,
  NODE_ENV: process.env.NODE_ENV,
  VITE_API_BASE_URL: process.env.VITE_API_BASE_URL,
  CLIENT_URL: process.env.CLIENT_URL,
  DB_URL: process.env.DB_URL,

}