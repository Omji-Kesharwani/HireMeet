import { requireAuth } from '@clerk/express';

export const protectRoute = [
  requireAuth(),
  async(req, res, next) => {
    try{
       const clerkId = req.auth.userId;
       if(!clerkId){
         return res.status(401).json({msg:"Unauthorized"});
       }

       const user = await User.findOne({clerkId});
       if(!user){
         return res.status(404).json({msg:"User not found"});
       }
       req.user = user;
       next();
    }
    catch(err){
       console.error("Error in protectRoute middleware:", err);
       return res.status(500).json({msg:"Internal server error"});
    }
  }];