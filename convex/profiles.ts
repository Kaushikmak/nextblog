// convex/profiles.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { authComponent } from "./auth";

export const getMyProfile = query({
    args: {},
    handler: async (ctx) => {
        const user = await authComponent.safeGetAuthUser(ctx);
        if (!user) return null;
        
        return await ctx.db
            .query("profiles")
            .withIndex("by_userId", (q) => q.eq("userId", user._id))
            .unique();
    }
});

export const upsertProfile = mutation({
    args: {
        phone: v.optional(v.string()),
        bio: v.optional(v.string()),
        website: v.optional(v.string()),
        location: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await authComponent.safeGetAuthUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const existing = await ctx.db
            .query("profiles")
            .withIndex("by_userId", (q) => q.eq("userId", user._id))
            .unique();

        if (existing) {
            await ctx.db.patch(existing._id, args);
        } else {
            await ctx.db.insert("profiles", {
                userId: user._id,
                ...args
            });
        }
    }
});