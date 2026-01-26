import express from "express";
import dotenv from "dotenv";
import { ENV } from "./lib/env.js";
import cors from "cors";
import { connectDB } from "./lib/db.js";
const app = express();
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      ENV.CLIENT_URL
    ],
    credentials: true
  })
);
dotenv.config();

app.get("/health", (req, res) => {
  res.status(200).json({msg:"Server is running and up!"});
})
app.get("/book", (req, res) => {
  res.status(200).json({msg:"Hello books"});
})


const startServer = async () => {
  try{
    await connectDB();
    app.listen(ENV.PORT, () => {
      console.log(`Server is running on port ${ENV.PORT}`);
    });
  }
  catch(error){
    console.error("Failed to start server", error);
  }
};
startServer();