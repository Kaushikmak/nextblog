import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";
import { use } from "react";

export const getCommentsByPostId = query({
    args: {
        postId: v.id("posts"),
    },
    handler: async (ctx, args) => {
        const data = await ctx.db
                            .query("comments")
                            .filter((q) => q.eq(q.field('postId'),args.postId))
                            .order("desc").collect();

        return data;
    }
});


export const createComment = mutation({
    args: {
        body: v.string(),
        postId: v.id("posts"),
    },
    handler: async (ctx,args) => {

        const user = await authComponent.safeGetAuthUser(ctx);

        if(!user){
            throw new ConvexError("User not authenticated");
        }

        return await ctx.db.insert("comments",{
            postId: args.postId,
            body: args.postId,
            authorId: user._id,
            authorName: user.name
        });
    }
});