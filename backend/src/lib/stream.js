import {StreamChat} from "stream-chat";
import {StreamClient} from "@stream-io/node-sdk"
const apiKey = process.env.STREAM_API_KEY;
const apiSecret = process.env.STREAM_API_SECRET;

if(!apiKey || !apiSecret){
  throw new Error("Stream API key or secret is missing");
}
export const streamClient = StreamChat.getInstance(apiKey, apiSecret);
 export const chatClient = StreamChat.getInstance(apiKey, apiSecret);

 export const upsertStreamUser = async (userData) => {
   try{
     await chatClient.upsertUser(userData);
     console.log("Stream user upserted successfully", userData);
   }
   catch(error){
     console.error("Error upserting Stream user:", error);
   }
 }

 export const deleteStreamUser = async (userId) => {
   try{
     await chatClient.deleteUser(userId);
     console.log("Stream user deleted successfully", userId);
   }
   catch(error){
     console.error("Error deleting Stream user:", error);
   }
 }