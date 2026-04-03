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
    const isAnonymous = userId.startsWith("anon_");

    if (!isAnonymous) {
      const user = await authComponent.safeGetAuthUser(ctx);
      if (!user || user._id !== userId) {
        throw new ConvexError("Unauthorized");
      }
    }

    return await presence.heartbeat(ctx, roomId, userId, sessionId, interval);
  },
});

export const list = query({
  args: { roomToken: v.string() },
  handler: async (ctx, { roomToken }) => {
    const entries = await presence.list(ctx, roomToken);
    
    return await Promise.all(
        entries.map(async (item) => {
            // FIX: Reverted to 'userId' as per your TypeScript error
            const id = item.userId; 
            const isAnonymous = id.startsWith("anon_");
            
            if (isAnonymous) {
                return { ...item, name: "Guest" };
            }

            const user = await authComponent.getAnyUserById(ctx, id);
            if (!user) return item;

            return {
                ...item,
                name: user.name,
                picture: user.image 
            };
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