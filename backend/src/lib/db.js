import mongoose from "mongoose";
import { ENV } from "../lib/env.js";

export const connectDB = async () => {
  try {
   const conn =  await mongoose.connect(ENV.DB_URL);
   console.log(`MongoDB connected: ${conn.connection.host}`);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB", error);
    process.exit(1);
  }     
};