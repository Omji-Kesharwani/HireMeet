import { Inngest } from "inngest";
import User from "../models/User.js";

export const inngest = new Inngest({ id: "hire-meet" });

const syncUser = inngest.createFunction(
  { id: "sync-user" },
  { event: "clerk/user.created" },
  async ({ event }) => {
    const { connectDB } = await import("./db.js"); // ✅ lazy import
    await connectDB();

    const { clerkId, email, first_name, last_name, image_url } = event.data;

    const existingUser = await User.findOne({ clerkId });
    if (existingUser) return;

    await User.create({
      clerkId,
      email,
      name: `${first_name} ${last_name}`,
      profileImage: image_url,
    });
  }
);

const deleteUserFromDB = inngest.createFunction(
  { id: "delete-user" },
  { event: "clerk/user.deleted" },
  async ({ event }) => {
    const { connectDB } = await import("./db.js"); // ✅ lazy import
    await connectDB();

    await User.deleteOne({ clerkId: event.data.clerkId });
  }
);

export const functions = [syncUser, deleteUserFromDB];
