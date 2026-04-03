// convex/authors.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { authComponent } from "./auth";

export const getAuthorsList = query({
    args: {},
    handler: async (ctx) => {
        const posts = await ctx.db.query("posts").order("desc").collect();
        const profiles = await ctx.db.query("profiles").collect();
        const profileMap = new Map(profiles.map(p => [p.userId, p]));
        
        const authorMap = new Map();
        for (const post of posts) {
            if (!authorMap.has(post.authorId)) {
                authorMap.set(post.authorId, {
                    authorId: post.authorId,
                    name: post.authorName ?? "Anonymous Author",
                    handle: profileMap.get(post.authorId)?.handle || "No Handle", // Map handles to directory
                    postCount: 1,
                });
            } else {
                authorMap.get(post.authorId).postCount++;
            }
        }
        return Array.from(authorMap.values());
    }
});

export const getAuthorProfile = query({
    args: { authorId: v.string() },
    handler: async (ctx, args) => {
        const profile = await ctx.db.query("profiles")
            .withIndex("by_userId", (q) => q.eq("userId", args.authorId))
            .unique();
        
        const posts = await ctx.db.query("posts")
            .withIndex("by_author", (q) => q.eq("authorId", args.authorId))
            .order("desc")
            .collect();

        const resolvedPosts = await Promise.all(posts.map(async (post) => {
            const resolvedImageURL = post.imageStorageId !== undefined 
                ? await ctx.storage.getUrl(post.imageStorageId) 
                : null;
            return { ...post, imageURL: resolvedImageURL };
        }));

        const followers = await ctx.db.query("follows")
            .withIndex("by_following", (q) => q.eq("followingId", args.authorId))
            .collect();

        return { 
            profile, 
            posts: resolvedPosts, 
            followerCount: followers.length,
            // Extract author name from their most recent post for fallback
            fallbackName: posts.length > 0 ? posts[0].authorName : "Anonymous"
        };
    }
});

export const getFollowStatus = query({
    args: { authorId: v.string() },
    handler: async (ctx, args) => {
        const user = await authComponent.safeGetAuthUser(ctx);
        if (!user) return false;

        const follow = await ctx.db.query("follows")
            .withIndex("by_follower_following", (q) => 
                q.eq("followerId", user._id).eq("followingId", args.authorId)
            ).unique();
        
        return !!follow;
    }
});

export const toggleFollow = mutation({
    args: { authorId: v.string() },
    handler: async (ctx, args) => {
        const user = await authComponent.safeGetAuthUser(ctx);
        if (!user) throw new Error("Unauthorized");
        if (user._id === args.authorId) throw new Error("Cannot follow yourself");

        const existingFollow = await ctx.db.query("follows")
            .withIndex("by_follower_following", (q) => 
                q.eq("followerId", user._id).eq("followingId", args.authorId)
            ).unique();

        if (existingFollow) {
            await ctx.db.delete(existingFollow._id);
        } else {
            await ctx.db.insert("follows", {
                followerId: user._id,
                followingId: args.authorId,
            });
        }
    }
});

export const searchAuthorsForDropdown = query({
    args: { searchTerm: v.string() },
    handler: async (ctx, args) => {
        if (!args.searchTerm || args.searchTerm.trim() === "") return [];
        
        const term = args.searchTerm.toLowerCase().trim();
        const allProfiles = await ctx.db.query("profiles").collect();
        
        // Return top 5 matches based on handle or name
        return allProfiles
            .filter(p => 
                (p.handle && p.handle.toLowerCase().includes(term)) || 
                (p.name && p.name.toLowerCase().includes(term))
            )
            .map(p => ({ id: p.userId, name: p.name || "Author", handle: p.handle }))
            .slice(0, 5);
    }
});

export const getAuthorsByIds = query({
    args: { userIds: v.array(v.string()) },
    handler: async (ctx, args) => {
        const profiles = await Promise.all(
            args.userIds.map(id => ctx.db.query("profiles").withIndex("by_userId", q => q.eq("userId", id)).unique())
        );
        return profiles
            .filter(p => p !== null)
            .map(p => ({ id: p!.userId, name: p!.name || "Author", handle: p!.handle }));
    }
});