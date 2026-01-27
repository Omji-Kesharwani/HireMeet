import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import { createSession, endSession, getActiveSession, getMyRecentSessions, getSessionById, joinSession } from "../controllers/sessionController.js";
const router = express.Router();


router.post("/",protectRoute,createSession);
router.get("/active",protectRoute,getActiveSession);
router.get("/my-recent",protectRoute,getMyRecentSessions);

router.get("/:id",protectRoute,getSessionById);
router.post("/:id/join",protectRoute,joinSession);
router.post("/:id/end",protectRoute,endSession);


export default router;