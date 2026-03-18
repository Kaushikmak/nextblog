import { mutation, query } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { authComponent } from "./auth";
import { Doc } from "./_generated/dataModel";

export const createPost = mutation({
  args: { title: v.string(), body: v.string(), imageStorageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);

    if(!user){
        throw new ConvexError('User not authenticated')
    }

    const blogArticle = await ctx.db.insert("posts",{
        body: args.body,
        title: args.title,
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

interface searchResultType{
    _id: string,
    title: string,
    body: string
};

export const searchPost = query({
    args: {
        term: v.string(),
        limit: v.number(),
    },
    handler: async (ctx, args) => {
        const limit = args.limit;
        const results: Array<searchResultType> = [];
        // we search againt body and title so to avoid duplicate
        const seen = new Set();

        const pushDocs = async (docs: Array<Doc<'posts'>>) => {
            for(const doc of docs){
                if(seen.has(doc._id)){
                    continue;
                }
                seen.add(doc._id);
                results.push({
                    _id: doc._id,
                    title: doc.title,
                    body: doc.body,
                });
                if(results.length >= limit){
                    break;
                }
            }
        };

        const titleMatches = await ctx.db.query('posts').withSearchIndex('search_title',(q) => q.search('title',args.term)).take(limit);

        await pushDocs(titleMatches);

        if(results.length < limit){
            const bodyMatches = await ctx.db.query('posts').withSearchIndex('search_body',(q) => q.search('body',args.term)).take(limit);

            await pushDocs(bodyMatches);

        }

        return results;

    },
});