import {Inngest} from "inngest";
import {connectDB} from "./db.js";
import User from "../models/User.js";

export const inngest = new Inngest({ id: "hire-meet" });

const syncUser = inngest.createFunction(
  {id:"sync-user"},
  {event:"clerk/user.created"},
  async ({event}) => {
    await connectDB();
    const {clerkId, email,first_name,last_name, image_url} = event.data;
    const existingUser = await User.findOne({clerkId});
    if(existingUser){
      console.log("User already exists:", existingUser);
      return;
    }
    const user = new User({clerkId, email, name: `${first_name} ${last_name}`, profileImage: image_url});
    await User.create(user);
    console.log("User synced to DB:", user);
  }
)

const deleteUserFromDB = inngest.createFunction(
  {id:"delete-user"},
  {event:"clerk/user.deleted"},
  async ({event}) => {
    await connectDB();
    const {clerkId} = event.data;
    await User.deleteOne({clerkId});
   
  }
)


export const functions = [syncUser, deleteUserFromDB];