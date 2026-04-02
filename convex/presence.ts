// next-log2/convex/presence.ts

import { mutation, query } from "./_generated/server";
import { components } from "./_generated/api";
import { ConvexError, v } from "convex/values";
import { Presence } from "@convex-dev/presence";
import { authComponent } from "./auth";

export const presence = new Presence(components.presence);

export const heartbeat = mutation({
  args: {
    roomId: v.string(),
    userId: v.string(),
    sessionId: v.string(),
    interval: v.number(),
  },
  handler: async (ctx, { roomId, userId, sessionId, interval }) => {
    // 1. Identify if this is a guest user (anon_ prefix)
    const isAnonymous = userId.startsWith("anon_");

    // 2. Auth check: Only enforce if the ID is NOT an anonymous one
    if (!isAnonymous) {
      const user = await authComponent.safeGetAuthUser(ctx);

      // Prevent users from spoofing other authenticated IDs
      if (!user || user._id !== userId) {
        throw new ConvexError("Unauthorized");
      }
    }

    // 3. Heartbeat allowed for both valid members and identified guests
    return await presence.heartbeat(ctx, roomId, userId, sessionId, interval);
  },
});

export const list = query({
  args: { roomToken: v.string() },
  handler: async (ctx, { roomToken }) => {
    const entries = await presence.list(ctx, roomToken);
    
    return await Promise.all(
        entries.map(async (item) => {
            // 4. FIX: Skip DB lookup if the ID is anonymous (prevents Server Error)
            const isAnonymous = item.userId.startsWith("anon_");
            
            if (isAnonymous) {
                return { ...item, name: "Guest" }; // Optionally assign a display name
            }

            // 5. Normal lookup for registered users
            const user = await authComponent.getAnyUserById(ctx, item.userId);
            if (!user) {
                return item;
            }
            return {
                ...item,
                name: user.name,
                picture: user.image // Added for FacePile compatibility
            }
        })
    );
  },
});

export const disconnect = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    return await presence.disconnect(ctx, sessionToken);
  },
});

export const getUserId = query({
    args: {},
    handler: async (ctx) => {
        const user = await authComponent.safeGetAuthUser(ctx);
        return user?._id;
    }
});