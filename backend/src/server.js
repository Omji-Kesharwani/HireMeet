import express from "express";
import dotenv from "dotenv";
import { ENV } from "./lib/env.js";
import cors from "cors";
import { connectDB } from "./lib/db.js";
import {serve} from "inngest/express";
import {inngest, functions} from "./lib/inngest.js";
import { clerkMiddleware } from '@clerk/express'
import { protectRoute } from "./middleware/protectRoute.js";
import chatRoutes from "./routes/chatRoutes.js";
const app = express();
dotenv.config();
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      ENV.CLIENT_URL
    ],
    credentials: true
  })
);

app.use(express.json());
app.use(clerkMiddleware())

app.use("/api/inngest",serve({client:inngest,functions}))
app.use("/api/chat",chatRoutes)
app.get("/health", (req, res) => {
  res.status(200).json({msg:"Server is running and up!"});
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