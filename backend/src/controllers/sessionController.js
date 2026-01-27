import { chatClient, streamClient } from "../lib/stream.js";
import Session from "../models/Session.js";

export async function createSession(req, res) {
  try{
  const {problem,difficulty} = req.body;
  const userId = req.user._id;
  const clerkId = req.user.clerkId;

  if(!problem || !difficulty)
  {
    return res.status(400).json({message:"Problem and difficulty are required"});
  }
  // generate a unique call id for the stream video 
  const callId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  //create session in db
  const session = await Session.create({problem,difficulty,host:userId,callId});

  // create stream video call 
  await streamClient.video.call("default",callId).getOrCreate({
    data:{
      created_by_id : clerkId,
      custom : {problem,difficulty,sessionId:session._id.toString()},
    }
  });

  //chat messaging
  chatClient.channel("messaging",callId,{
    name:`${problem} Session`,
    created_by_id: clerkId,
    members:[clerkId]
  });

   await channel.create();
   // todo : send the join notification to the user through email
   res.status(200).json({message:"Session created successfully",session});
}
  catch(err)
  {
    console.error("Error creating session",err.message);
    res.status(500).json({message:"Internal server error"});
  }
}

export async function getActiveSession(_, res) {
  try{
    const sessions = await Session.find({status:"active"})
    .populate("host","name profileImage email clerkId")
    .sort({createdAt:-1})
    .limit(20);
    res.status(200).json({sessions});
  }
  catch(err)
  {
    console.error("Error getting active sessions",err.message);
    res.status(500).json({message:"Internal server error"});
  }
}

export async function getMyRecentSessions(req, res) {
  try {
    const userId = req.user._id;
    // get Session where user is the host or participant
   const sessions =  await Session.find(
      {
        status:"completed",
        $or:[{host:userId},{participants:userId}]
      }
    ).sort({createdAt:-1}).limit(20);

    res.status(200).json({sessions});
  } catch (error) {
    console.error("Error getting my recent sessions",error.message);
    res.status(500).json({message:"Internal server error"});
  }
}

export async function getSessionById(req, res) {
   const {id} = req.params ;
   try{
    const session = await Session.findById(id)
    .populate("host","name profileImage email clerkId")
    .populate("participants","name profileImage email clerkId");

    if(!session)
    {
     return res.status(404).json({message:"Session not found"});
    }
    else{
      res.status(200).json({session});
   }
  }
   catch(err)
   {
     console.error("Error getting session by id",err.message);
     res.status(500).json({message:"Internal server error"});
   }
}

export async function joinSession(req, res) {
  try {
  const {id} = req.params;
  const userId = req.user._id;
  const clerkId = req.user.clerkId;
  const session = await Session.findById(id);

  if(!session)
  {
   return res.status(404).json({message:"Session not found"});
  }
   if(session.participant)
   {
     return res.status(400).json({message:"Session already has a participant"});
   }
  session.participant = userId;
  await session.save();
  const channel = chatClient.channel("messaging",session.callId)
  await channel.addMembers([clerkId]);
  res.status(200).json({message:"Session joined successfully"});

  } catch (error) {
    console.error("Error joining session",error.message);
    res.status(500).json({message:"Internal server error"});
  }
}

export async function endSession(req, res) {
  try{
    const {id} = req.params;
  const userId = req.user._id;
  const session = await Session.findById(id);
  if(!session)
  {
    return res.status(404).json({message:"Session not found"});
  }
  if(session.host.toString() !== userId.toString())
  {
    return res.status(403).json({message:"You are not authorized to end this session"});
  }

  if(session.status === "completed")
  {
    return res.status(400).json({message:"Session is already completed"});
  }

 
  // delete the stream video call
  const call = await streamClient.video.call("default",session.callId);
  call.delete({hard:true});

  // delete the chat channel
  const channel = chatClient.channel("messaging",session.callId);
  await channel.delete();

  session.status = "completed";
  await session.save();

  res.status(200).json({message:"Session ended successfully"});
  }
  catch(err)
  {
    console.error("Error ending session",err.message);
    res.status(500).json({message:"Internal server error"});
  }


}
