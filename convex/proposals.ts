import { mutation, query } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { authComponent } from "./auth";

// Action: The "Push" 
export const createProposal = mutation({
    args: {
        postId: v.id("posts"),
        proposedTitle: v.string(),
        proposedBody: v.string(),
        proposedSummary: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await authComponent.safeGetAuthUser(ctx);
        if (!user) throw new ConvexError('User not authenticated');

        const post = await ctx.db.get(args.postId);
        if (!post) throw new ConvexError('Post not found');

        // Validation: Only designated co-authors can push proposals
        const isCoAuthor = post.coAuthors?.includes(user._id) ?? false;
        if (!isCoAuthor) throw new ConvexError('Only authorized co-authors can propose edits');

        return await ctx.db.insert("proposals", {
            postId: args.postId,
            coAuthorId: user._id,
            coAuthorName: user.name ?? "Anonymous Co-Author",
            proposedTitle: args.proposedTitle,
            proposedBody: args.proposedBody,
            proposedSummary: args.proposedSummary,
            status: "pending",
            createdAt: Date.now(),
        });
    }
});

// Action: The "Pull Request" View
export const getPendingProposals = query({
    args: { postId: v.id("posts") },
    handler: async (ctx, args) => {
        const user = await authComponent.safeGetAuthUser(ctx);
        if (!user) return [];

        const post = await ctx.db.get(args.postId);
        if (!post) return [];

        // Validation: Only the primary author can view pending proposals for their post
        if (post.authorId !== user._id) {
            return [];
        }

        return await ctx.db
            .query("proposals")
            .withIndex("by_post_and_status", (q) => 
                q.eq("postId", args.postId).eq("status", "pending")
            )
            .order("desc")
            .collect();
    }
});

// Action: The "Merge"
export const mergeProposal = mutation({
    args: { proposalId: v.id("proposals") },
    handler: async (ctx, args) => {
        const user = await authComponent.safeGetAuthUser(ctx);
        if (!user) throw new ConvexError('User not authenticated');

        const proposal = await ctx.db.get(args.proposalId);
        if (!proposal) throw new ConvexError('Proposal not found');
        if (proposal.status !== "pending") throw new ConvexError('Proposal is no longer pending');

        const post = await ctx.db.get(proposal.postId);
        if (!post) throw new ConvexError('Original post not found');

        // Strict Authorization: Only the main author can execute the merge
        if (post.authorId !== user._id) {
            throw new ConvexError('Only the primary author can merge proposals');
        }

        // 1. Update the Main Post (The Merge)
        await ctx.db.patch(post._id, {
            title: proposal.proposedTitle,
            body: proposal.proposedBody,
            summary: proposal.proposedSummary,
            updatedAt: Date.now(),
        });

        // 2. Update the Proposal State
        await ctx.db.patch(proposal._id, {
            status: "merged"
        });

        return post._id;
    }
});

// Action: The "Close PR" without merging
export const rejectProposal = mutation({
    args: { proposalId: v.id("proposals") },
    handler: async (ctx, args) => {
        const user = await authComponent.safeGetAuthUser(ctx);
        if (!user) throw new ConvexError('User not authenticated');

        const proposal = await ctx.db.get(args.proposalId);
        if (!proposal) throw new ConvexError('Proposal not found');

        const post = await ctx.db.get(proposal.postId);
        if (!post || post.authorId !== user._id) {
            throw new ConvexError('Unauthorized action');
        }

        await ctx.db.patch(proposal._id, {
            status: "rejected"
        });
    }
});

export const getMyPendingReviews = query({
    args: {},
    handler: async (ctx) => {
        const user = await authComponent.safeGetAuthUser(ctx);
        if (!user) return [];

        const myPosts = await ctx.db
            .query("posts")
            .withIndex("by_author", (q) => q.eq("authorId", user._id))
            .collect();

        if (myPosts.length === 0) return [];
        const myPostIds = myPosts.map(p => p._id);

        const proposalsArrays = await Promise.all(
            myPostIds.map(postId => 
                ctx.db.query("proposals")
                    .withIndex("by_post_and_status", (q) => 
                        q.eq("postId", postId).eq("status", "pending")
                    )
                    .collect()
            )
        );

        const pendingProposals = proposalsArrays.flat();

        return pendingProposals.map(proposal => {
            const originalPost = myPosts.find(p => p._id === proposal.postId);
            return {
                ...proposal,
                originalPostTitle: originalPost?.title || "Unknown Post",
                originalPostBody: originalPost?.body || "",
                originalPostSummary: originalPost?.summary || "",
            };
        });
    }
});