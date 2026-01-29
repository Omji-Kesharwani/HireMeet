import { chatClient, streamClient } from "../lib/stream.js";
import Session from "../models/Session.js";

import { chatClient, streamClient } from "../lib/stream.js";
import Session from "../models/Session.js";

export async function createSession(req, res) {
  try {
    const { problem, difficulty } = req.body;
    const userId = req.user._id;
    const clerkId = req.user.clerkId;

    if (!problem || !difficulty) {
      return res.status(400).json({ message: "Problem and difficulty are required" });
    }

    // 🔒 HARD LOCK: one active session per host
    const existingSession = await Session.findOne({
      host: userId,
      status: "active",
    });

    if (existingSession) {
      return res.status(409).json({
        message: "You already have an active session",
        session: existingSession,
      });
    }

    // generate unique call id
    const callId = `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    /* ===============================
       1️⃣ CREATE STREAM VIDEO FIRST
       =============================== */
    await streamClient.video.call("default", callId).getOrCreate({
      data: {
        created_by_id: clerkId,
        custom: { problem, difficulty },
      },
    });

    /* ===============================
       2️⃣ CREATE STREAM CHAT CHANNEL
       =============================== */
    const channel = chatClient.channel("messaging", callId, {
      name: `${problem} Session`,
      created_by_id: clerkId,
      members: [clerkId],
    });

    await channel.create();

    /* ===============================
       3️⃣ CREATE DB SESSION (LAST)
       =============================== */
    const session = await Session.create({
      problem,
      difficulty,
      host: userId,
      callId,
      status: "active",
    });

    res.status(201).json({ session });
  } catch (error) {
    console.error("Error in createSession:", error);

    res.status(500).json({
      message: "Failed to create room. Please try again.",
    });
  }
}

export async function getActiveSessions(_, res) {
  try {
    const sessions = await Session.find({ status: "active" })
      .populate("host", "name profileImage email clerkId")
      .populate("participant", "name profileImage email clerkId")
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({ sessions });
  } catch (error) {
    console.log("Error in getActiveSessions controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getMyRecentSessions(req, res) {
  try {
    const userId = req.user._id;

    // get sessions where user is either host or participant
    const sessions = await Session.find({
      status: "completed",
      $or: [{ host: userId }, { participant: userId }],
    })
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({ sessions });
  } catch (error) {
    console.log("Error in getMyRecentSessions controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getSessionById(req, res) {
  try {
    const { id } = req.params;

    const session = await Session.findById(id)
      .populate("host", "name email profileImage clerkId")
      .populate("participant", "name email profileImage clerkId");

    if (!session) return res.status(404).json({ message: "Session not found" });

    res.status(200).json({ session });
  } catch (error) {
    console.log("Error in getSessionById controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function joinSession(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const clerkId = req.user.clerkId;

    const session = await Session.findById(id).populate("host", "clerkId");

    if (!session) return res.status(404).json({ message: "Session not found" });

    if (session.status !== "active") {
      return res.status(400).json({ message: "Cannot join a completed session" });
    }

    const hostId = session.host._id ? session.host._id.toString() : session.host.toString();
    if (hostId === userId.toString()) {
      return res.status(400).json({ message: "Host cannot join their own session as participant" });
    }

    // check if session is already full - has a participant
    if (session.participant) return res.status(409).json({ message: "Session is full" });

    session.participant = userId;
    await session.save();

    const channel = chatClient.channel("messaging", session.callId);
    try {
      await channel.addMembers([clerkId]);
    } catch (channelErr) {
      // Channel may not exist if session was created before chat was set up
      const msg = channelErr.message ?? String(channelErr);
      if (msg.includes("Can't find channel") || channelErr.code === 16) {
        const hostClerkId = session.host.clerkId?.toString?.() ?? session.host.clerkId;
        const newChannel = chatClient.channel("messaging", session.callId, {
          name: `Session ${session.callId}`,
          created_by_id: hostClerkId,
          members: [hostClerkId, clerkId],
        });
        await newChannel.create();
      } else {
        throw channelErr;
      }
    }

    res.status(200).json({ session });
  } catch (error) {
    console.log("Error in joinSession controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function endSession(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const session = await Session.findById(id);

    if (!session) return res.status(404).json({ message: "Session not found" });

    // check if user is the host
    if (session.host.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Only the host can end the session" });
    }

    // check if session is already completed
    if (session.status === "completed") {
      return res.status(400).json({ message: "Session is already completed" });
    }

    // delete stream video call
    const call = streamClient.video.call("default", session.callId);
    await call.delete({ hard: true });

    // delete stream chat channel
    const channel = chatClient.channel("messaging", session.callId);
    await channel.delete();

    session.status = "completed";
    await session.save();

    res.status(200).json({ session, message: "Session ended successfully" });
  } catch (error) {
    console.log("Error in endSession controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
