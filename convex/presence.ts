import { mutation, query } from "./_generated/server";
import { components } from "./_generated/api";
import { ConvexError, v } from "convex/values";
import { Presence } from "@convex-dev/presence";
import { authComponent } from "./auth";

export const presence = new Presence(components.presence);

// next-log2/convex/presence.ts

export const heartbeat = mutation({
  args: {
    roomId: v.string(),
    userId: v.string(),
    sessionId: v.string(),
    interval: v.number(),
  },
  handler: async (ctx, { roomId, userId, sessionId, interval }) => {
    // 1. Identify if this is a guest user based on the prefix you defined in PostPresence.tsx
    const isAnonymous = userId.startsWith("anon_");

    // 2. Perform auth check ONLY if it's not an anonymous user
    if (!isAnonymous) {
      const user = await authComponent.safeGetAuthUser(ctx);

      // If they claim to be a specific user ID but aren't logged in as them, block it.
      if (!user || user._id !== userId) {
        throw new ConvexError("Unauthorized");
      }
    }

    // 3. Allow both authenticated and valid anonymous heartbeats to proceed
    return await presence.heartbeat(ctx, roomId, userId, sessionId, interval);
  },
});

export const list = query({
  args: { roomToken: v.string() },
  handler: async (ctx, { roomToken }) => {
    // Avoid adding per-user reads so all subscriptions can share same cache.
    const entries =  await presence.list(ctx, roomToken);
    return await Promise.all(
        entries.map(async (item) => {
            const user = await authComponent.getAnyUserById(ctx, item.userId);
            if(!user){
                return item;
            }
            return {
                ...item,
                name: user.name
            }
        })
    );
  },
});

export const disconnect = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    // Can't check auth here because it's called over http from sendBeacon.
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