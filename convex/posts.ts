import { mutation, query } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { authComponent } from "./auth";

export const createPost = mutation({
  args: { title: v.string(), body: v.string(), imageStorageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);

    if(!user){
        throw new ConvexError('User not authenticated')
    }

    const blogArticle = await ctx.db.insert("posts",{
        body: args.body,
        title: args.body,
        authorId: user._id,
        imageStorageId: args.imageStorageId,
    });
        return blogArticle;
    },

});

export const getPosts = query({
    args: {},
    handler: async (ctx) => {
        const posts = await ctx.db.query('posts').order('desc').collect();

        return Promise.all(posts.map(async (post) => {
            const resolvedImageURL = post.imageStorageId !== undefined ? await ctx.storage.getUrl(post.imageStorageId) : null;

            return {
                ...post,
                imageURL: resolvedImageURL
            }

        }));
        
    }
});


export const getImageUploadURL = mutation({
    args: {},
    handler: async (ctx) => {
        const user = await authComponent.safeGetAuthUser(ctx);

        if(!user){
        throw new ConvexError('User not authenticated')
    }

    return await ctx.storage.generateUploadUrl();

    }
})

export const getPostById = query({
    args: {postId: v.id("posts")},
    handler: async (ctx, args) => {
        const post = await ctx.db.get("posts", args.postId);

        if(!post){
            throw new ConvexError('Post not found')
        }

        const resolvedImageURL = post.imageStorageId !== undefined ? await ctx.storage.getUrl(post.imageStorageId) : null;

        return {
            ...post,
            imageURL: resolvedImageURL
        }
    }
});