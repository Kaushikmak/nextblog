// convex/authors.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { authComponent } from "./auth";

export const getAuthorsList = query({
    args: {},
    handler: async (ctx) => {
        const profiles = await ctx.db.query("profiles").collect();
        const posts = await ctx.db.query("posts").collect();
        
        const authorMap = new Map();

        // 1. Initialize map with all registered profiles (postCount defaults to 0)
        for (const p of profiles) {
            authorMap.set(p.userId, {
                authorId: p.userId,
                name: p.name || "Anonymous Author",
                handle: p.handle || `author-${p.userId.slice(-4)}`,
                postCount: 0,
            });
        }
        
        // 2. Process all posts to increment counts and catch missing/ghost profiles
        for (const post of posts) {
            if (authorMap.has(post.authorId)) {
                authorMap.get(post.authorId).postCount++;
            } else {
                // Fallback for posts authored by users without an explicit profile entry
                const authorName = post.authorName ?? "Anonymous Author";
                const fallbackHandle = authorName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + post.authorId.slice(-4);
                
                authorMap.set(post.authorId, {
                    authorId: post.authorId,
                    name: authorName, 
                    handle: fallbackHandle,
                    postCount: 1,
                });
            }
        }

        // Return array sorted by post count (descending)
        return Array.from(authorMap.values()).sort((a, b) => b.postCount - a.postCount);
    }
});

export const searchAuthorsForDropdown = query({
    args: { searchTerm: v.string() },
    handler: async (ctx, args) => {
        if (!args.searchTerm || args.searchTerm.trim() === "") return [];
        
        const term = args.searchTerm.toLowerCase().trim().replace(/^@/, '');
        const results = new Map();

        // 1. Search existing profiles
        const allProfiles = await ctx.db.query("profiles").collect();
        for (const p of allProfiles) {
            if ((p.handle && p.handle.toLowerCase().includes(term)) || 
                (p.name && p.name.toLowerCase().includes(term))) {
                results.set(p.userId, { 
                    id: p.userId, 
                    name: p.name || "Author", 
                    handle: p.handle || "unknown" 
                });
            }
        }

        // 2. Search posts for authors who haven't set up a profile yet
        if (results.size < 5) {
            const allPosts = await ctx.db.query("posts").collect();
            for (const post of allPosts) {
                if (!results.has(post.authorId) && post.authorName && post.authorName.toLowerCase().includes(term)) {
                    const fallbackHandle = post.authorName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + post.authorId.slice(-4);
                    results.set(post.authorId, {
                        id: post.authorId,
                        name: post.authorName,
                        handle: fallbackHandle
                    });
                }
            }
        }

        return Array.from(results.values()).slice(0, 5);
    }
});

export const getAuthorsByIds = query({
    args: { userIds: v.array(v.string()) },
    handler: async (ctx, args) => {
        const results = [];
        for (const id of args.userIds) {
            const profile = await ctx.db.query("profiles").withIndex("by_userId", q => q.eq("userId", id)).unique();
            if (profile) {
                results.push({ id: profile.userId, name: profile.name || "Author", handle: profile.handle || "unknown" });
            } else {
                // Fallback: look for a post by this user to grab their name
                const post = await ctx.db.query("posts").withIndex("by_author", q => q.eq("authorId", id)).first();
                results.push({
                    id: id,
                    name: post?.authorName || "Anonymous Author",
                    handle: "author-" + id.slice(-4)
                });
            }
        }
        return results;
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

        // FIX: Compute a robust fallback name
        let fallbackName = "Anonymous Author";
        if (profile?.name) {
            fallbackName = profile.name;
        } else if (posts.length > 0 && posts[0].authorName) {
            fallbackName = posts[0].authorName;
        }

        return { 
            profile, 
            posts: resolvedPosts, 
            followerCount: followers.length,
            fallbackName
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