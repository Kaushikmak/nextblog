import { mutation, query } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { authComponent } from "./auth";
import { Doc } from "./_generated/dataModel";


export const createPost = mutation({
  args: { 
      title: v.string(), 
      body: v.string(), 
      imageStorageId: v.optional(v.id("_storage")),
      headerImageUrl: v.optional(v.string()),
      summary: v.optional(v.string()),
      wordCount: v.number(),
      readTime: v.number(),
      coAuthors: v.optional(v.array(v.string())),
      isPrivate: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if(!user) throw new ConvexError('User not authenticated');

    return await ctx.db.insert("posts",{
        body: args.body,
        title: args.title,
        authorId: user._id,
        authorName: user.name ?? "Anonymous Author",
        imageStorageId: args.imageStorageId,
        headerImageUrl: args.headerImageUrl, 
        summary: args.summary,               
        wordCount: args.wordCount,
        readTime: args.readTime,
        views: 0,
        likes: 0,
        coAuthors: args.coAuthors ?? [],
        isPrivate: args.isPrivate ?? false,
    });
  },
});

export const getPosts = query({
    args: {},
    handler: async (ctx) => {
        // Filter out records where isPrivate evaluates to true
        const posts = await ctx.db.query('posts')
            .filter(q => q.neq(q.field("isPrivate"), true))
            .order('desc')
            .collect();

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

export const getMediaUrl = mutation({
    args: { storageId: v.id("_storage") },
    handler: async (ctx, args) => {
        const url = await ctx.storage.getUrl(args.storageId);
        return url;
    }
});

export const incrementView = mutation({
    args: { postId: v.id("posts") },
    handler: async (ctx, args) => {
        const post = await ctx.db.get(args.postId);
        if (!post) return;
        await ctx.db.patch(args.postId, { views: (post.views ?? 0) + 1 });
    }
});

export const toggleLike = mutation({
    args: { postId: v.id("posts") },
    handler: async (ctx, args) => {
        const user = await authComponent.safeGetAuthUser(ctx);
        if (!user) throw new ConvexError('Authentication required to like posts.');

        const existingLike = await ctx.db
            .query("likes")
            .withIndex("by_post_user", (q) => q.eq("postId", args.postId).eq("userId", user._id))
            .unique();

        const post = await ctx.db.get(args.postId);
        const currentLikes = post?.likes ?? 0;

        if (existingLike) {
            await ctx.db.delete(existingLike._id);
            await ctx.db.patch(args.postId, { likes: Math.max(0, currentLikes - 1) });
        } else {
            await ctx.db.insert("likes", { postId: args.postId, userId: user._id });
            await ctx.db.patch(args.postId, { likes: currentLikes + 1 });
        }
    }
});

export const getLikeStatus = query({
    args: { postId: v.id("posts") },
    handler: async (ctx, args) => {
        const user = await authComponent.safeGetAuthUser(ctx);
        if (!user) return false;
        const existingLike = await ctx.db
            .query("likes")
            .withIndex("by_post_user", (q) => q.eq("postId", args.postId).eq("userId", user._id))
            .unique();
        return !!existingLike;
    }
});

export const getMyPosts = query({
    args: {},
    handler: async (ctx) => {
        const user = await authComponent.safeGetAuthUser(ctx);
        if (!user) return [];
        
        const posts = await ctx.db
            .query("posts")
            .withIndex("by_author", (q) => q.eq("authorId", user._id))
            .order("desc")
            .collect();

        return Promise.all(posts.map(async (post) => {
            const resolvedImageURL = post.imageStorageId !== undefined ? await ctx.storage.getUrl(post.imageStorageId) : null;
            return { ...post, imageURL: resolvedImageURL };
        }));
    }
});

export const updatePost = mutation({
    args: {
        id: v.id("posts"),
        title: v.string(),
        body: v.string(),
        imageStorageId: v.optional(v.id("_storage")),
        headerImageUrl: v.optional(v.string()),
        summary: v.optional(v.string()),
        wordCount: v.number(),
        readTime: v.number(),
        coAuthors: v.optional(v.array(v.string())),
        isPrivate: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const user = await authComponent.safeGetAuthUser(ctx);
        if (!user) throw new ConvexError('User not authenticated');

        const existingPost = await ctx.db.get(args.id);
        if (!existingPost) throw new ConvexError('Post not found');

        // Access Control Authorization: Only author or co-authors can edit
        const isAuthor = existingPost.authorId === user._id;
        const isCoAuthor = existingPost.coAuthors?.includes(user._id) ?? false;
        if (!isAuthor && !isCoAuthor) throw new ConvexError('Unauthorized to edit this post');

        const { id, ...updates } = args;
        await ctx.db.patch(id, {
            ...updates,
            updatedAt: Date.now() // Record post-publication mutation time
        });
        return id;
    }
});

// Feature 3: Delete post
export const deletePost = mutation({
    args: { id: v.id("posts") },
    handler: async (ctx, args) => {
        const user = await authComponent.safeGetAuthUser(ctx);
        if (!user) throw new ConvexError('User not authenticated');

        const existingPost = await ctx.db.get(args.id);
        if (!existingPost) throw new ConvexError('Post not found');

        // Strict Access Control: Only original author can delete
        if (existingPost.authorId !== user._id) throw new ConvexError('Only the original author can delete');

        await ctx.db.delete(args.id);
    }
});