import { requireAuth } from "@clerk/express";
import { createClerkClient } from "@clerk/backend";
import User from "../models/User.js";

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

export const protectRoute = [
  requireAuth(),
  async (req, res, next) => {
    try {
      const clerkId = req.auth().userId;

      if (!clerkId) return res.status(401).json({ message: "Unauthorized - invalid token" });

      // find user in db by clerk ID
      let user = await User.findOne({ clerkId });

      // if user not in db (e.g. webhook didn't run), create from Clerk
      if (!user) {
        const clerkUser = await clerkClient.users.getUser(clerkId);
        if (!clerkUser) return res.status(401).json({ message: "Unauthorized - invalid token" });

        const primaryEmail = clerkUser.emailAddresses?.find((e) => e.id === clerkUser.primaryEmailAddressId);
        const email = primaryEmail?.emailAddress ?? clerkUser.emailAddresses?.[0]?.emailAddress ?? "";
        if (!email) return res.status(400).json({ message: "User has no email - complete your Clerk profile" });
        try {
          user = await User.create({
            clerkId: clerkUser.id,
            email,
            name: [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || "User",
            profileImage: clerkUser.imageUrl ?? "",
          });
        } catch (createErr) {
          // E11000 = duplicate key (user already exists with this email, e.g. from webhook)
          if (createErr.code === 11000 && createErr.keyPattern?.email) {
            user = await User.findOneAndUpdate(
              { email },
              { clerkId: clerkUser.id, name: [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || "User", profileImage: clerkUser.imageUrl ?? "" },
              { new: true }
            );
            if (!user) return res.status(500).json({ message: "Internal Server Error" });
          } else {
            throw createErr;
          }
        }
      }

      // attach user to req
      req.user = user;

      next();
    } catch (error) {
      console.error("Error in protectRoute middleware", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
];
