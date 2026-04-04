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

    const newPostId = await ctx.db.insert("posts",{
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

    // NEW: Sync the Edge Table
    await ctx.db.insert("postAuthors", { postId: newPostId, userId: user._id, isMainAuthor: true });

    if (args.coAuthors && args.coAuthors.length > 0) {
        for (const coAuthorId of args.coAuthors) {
            await ctx.db.insert("postAuthors", { postId: newPostId, userId: coAuthorId, isMainAuthor: false });
        }
    }

    return newPostId;
  },
});

export const getPosts = query({
    args: {},
    handler: async (ctx) => {
        const posts = await ctx.db.query('posts')
            .filter(q => q.neq(q.field("isPrivate"), true))
            .order('desc')
            .collect();

        return Promise.all(posts.map(async (post) => {
            const resolvedImageURL = post.imageStorageId !== undefined ? await ctx.storage.getUrl(post.imageStorageId) : null;
            
            // NEW: Resolve co-author profiles
            let resolvedCoAuthors: Array<{ id: string, name: string }> = [];
            if (post.coAuthors && post.coAuthors.length > 0) {
                const profiles = await Promise.all(
                    post.coAuthors.map(id => ctx.db.query("profiles").withIndex("by_userId", q => q.eq("userId", id)).unique())
                );
                resolvedCoAuthors = profiles
                    .filter(p => p !== null)
                    .map(p => ({ id: p!.userId, name: p!.name || "Author" }));
            }

            return {
                ...post,
                imageURL: resolvedImageURL,
                resolvedCoAuthors // Included for the frontend
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
        const post = await ctx.db.get(args.postId);

        if(!post){
            throw new ConvexError('Post not found')
        }

        const resolvedImageURL = post.imageStorageId !== undefined ? await ctx.storage.getUrl(post.imageStorageId) : null;

        let resolvedCoAuthors: Array<{ id: string, name: string }> = [];
        if (post.coAuthors && post.coAuthors.length > 0) {
            const profiles = await Promise.all(
                post.coAuthors.map(id => ctx.db.query("profiles").withIndex("by_userId", q => q.eq("userId", id)).unique())
            );
            resolvedCoAuthors = profiles
                .filter(p => p !== null)
                .map(p => ({ id: p!.userId, name: p!.name || "Author" }));
        }

        return {
            ...post,
            imageURL: resolvedImageURL,
            resolvedCoAuthors // Return the resolved array to the frontend
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

        // Step 1: O(1) Index Lookup to find user's post IDs
        const myPostLinks = await ctx.db.query("postAuthors")
            .withIndex("by_user", q => q.eq("userId", user._id))
            .collect();

        if (myPostLinks.length === 0) return [];

        // Step 2: Fetch the actual post documents concurrently
        const rawPosts = await Promise.all(
            myPostLinks.map(link => ctx.db.get(link.postId))
        );

        // Filter out any nulls (in case of referential integrity issues) and map
        const userPosts = rawPosts.filter(p => p !== null);

        // Sort descending by creation time in memory 
        // (Since we bypass the 'posts' index, we must sort the result array)
        userPosts.sort((a, b) => b!._creationTime - a!._creationTime);

        // Step 3: Resolve hydration properties (Images & CoAuthor Profiles)
        return Promise.all(userPosts.map(async (post) => {
            const resolvedImageURL = post!.imageStorageId !== undefined 
                ? await ctx.storage.getUrl(post!.imageStorageId) 
                : null;
            
            let resolvedCoAuthors: Array<{ id: string, name: string }> = [];
            if (post!.coAuthors && post!.coAuthors.length > 0) {
                const profiles = await Promise.all(
                    post!.coAuthors.map(id => ctx.db.query("profiles")
                        .withIndex("by_userId", q => q.eq("userId", id)).unique())
                );
                resolvedCoAuthors = profiles
                    .filter(p => p !== null)
                    .map(p => ({ id: p!.userId, name: p!.name || "Author" }));
            }

            // Utilize the edge table's boolean to define main author status natively
            const edgeLink = myPostLinks.find(link => link.postId === post!._id);

            return { 
                ...post, 
                imageURL: resolvedImageURL, 
                resolvedCoAuthors,
                isMainAuthor: edgeLink?.isMainAuthor ?? false 
            };
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

        const isAuthor = existingPost.authorId === user._id;
        const isCoAuthor = existingPost.coAuthors?.includes(user._id) ?? false;
        if (!isAuthor && !isCoAuthor) throw new ConvexError('Unauthorized to edit this post');

        const { id, ...updates } = args;
        await ctx.db.patch(id, {
            ...updates,
            updatedAt: Date.now() 
        });

        // NEW: Resync Edge Table if coAuthors are updated
        if (updates.coAuthors !== undefined) {
            // 1. Wipe existing edge relationships
            const existingLinks = await ctx.db.query("postAuthors")
                .withIndex("by_post", q => q.eq("postId", id)).collect();

            for (const link of existingLinks) {
                await ctx.db.delete(link._id);
            }

            // 2. Re-insert main author
            await ctx.db.insert("postAuthors", { postId: id, userId: existingPost.authorId, isMainAuthor: true });

            // 3. Re-insert new co-authors
            for (const coAuthorId of updates.coAuthors) {
                await ctx.db.insert("postAuthors", { postId: id, userId: coAuthorId, isMainAuthor: false });
            }
        }

        return id;
    }
});

export const deletePost = mutation({
    args: { id: v.id("posts") },
    handler: async (ctx, args) => {
        const user = await authComponent.safeGetAuthUser(ctx);
        if (!user) throw new ConvexError('User not authenticated');

        const existingPost = await ctx.db.get(args.id);
        if (!existingPost) throw new ConvexError('Post not found');
        if (existingPost.authorId !== user._id) throw new ConvexError('Only the original author can delete');

        // NEW: Delete edge relationships
        const existingLinks = await ctx.db.query("postAuthors")
            .withIndex("by_post", q => q.eq("postId", args.id)).collect();

        for (const link of existingLinks) {
            await ctx.db.delete(link._id);
        }

        await ctx.db.delete(args.id);
    }
});

export const migrateOldPosts = mutation({
    args: {},
    handler: async (ctx) => {
        // Fetch all legacy posts
        const allPosts = await ctx.db.query("posts").collect();
        
        for (const post of allPosts) {
            // Check if an edge relationship already exists
            const existingLink = await ctx.db.query("postAuthors")
                .withIndex("by_post", q => q.eq("postId", post._id))
                .first();

            if (!existingLink) {
                // 1. Sync the original author
                await ctx.db.insert("postAuthors", {
                    postId: post._id,
                    userId: post.authorId,
                    isMainAuthor: true
                });

                // 2. Sync any existing co-authors
                if (post.coAuthors && post.coAuthors.length > 0) {
                    for (const coId of post.coAuthors) {
                        await ctx.db.insert("postAuthors", {
                            postId: post._id,
                            userId: coId,
                            isMainAuthor: false
                        });
                    }
                }
            }
        }
        return "Migration Complete";
    }
});