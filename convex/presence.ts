// convex/presence.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { authComponent } from "./auth";

// Join a room — call this when the component mounts
export const join = mutation({
  args: {
    roomId: v.string(),
    sessionId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, { roomId, sessionId, userId }) => {
    const now = Date.now();

    const existing = await ctx.db
      .query("presenceSessions")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { lastSeen: now, active: true });
    } else {
      await ctx.db.insert("presenceSessions", {
        roomId,
        sessionId,
        userId,
        lastSeen: now,
        active: true,
      });
    }
  },
});

// Leave a room — call this when the component unmounts or tab hides
export const leave = mutation({
  args: { sessionId: v.string() },
  handler: async (ctx, { sessionId }) => {
    const existing = await ctx.db
      .query("presenceSessions")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { active: false });
    }
  },
});

// Real-time list of active viewers in a room
export const list = query({
  args: { roomId: v.string() },
  handler: async (ctx, { roomId }) => {
    const staleThreshold = Date.now() - 15_000; // 15s safety net

    const sessions = await ctx.db
      .query("presenceSessions")
      .withIndex("by_room", (q) => q.eq("roomId", roomId))
      .filter((q) =>
        q.and(
          q.eq(q.field("active"), true),
          q.gt(q.field("lastSeen"), staleThreshold)
        )
      )
      .collect();

    // Deduplicate by userId — one entry per user
    const seenIds = new Set<string>();
    const deduped = sessions.filter((s) => {
      if (seenIds.has(s.userId)) return false;
      seenIds.add(s.userId);
      return true;
    });

    return await Promise.all(
      deduped.map(async (s) => {
        if (s.userId.startsWith("anon_")) {
          return { userId: s.userId, name: "Guest", picture: null };
        }
        const user = await authComponent.getAnyUserById(ctx, s.userId);
        return {
          userId: s.userId,
          name: user?.name ?? "Unknown",
          picture: user?.image ?? null,
        };
      })
    );
  },
});

export const getUserId = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    return user?._id;
  },
});