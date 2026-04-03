import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    posts: defineTable({
        title: v.string(),
        body: v.string(),
        authorId: v.string(),
        authorName: v.optional(v.string()), 
        imageStorageId: v.optional(v.id("_storage")),
        headerImageUrl: v.optional(v.string()), 
        summary: v.optional(v.string()),        
        wordCount: v.optional(v.number()), 
        readTime: v.optional(v.number()),
        views: v.optional(v.number()), 
        likes: v.optional(v.number()), 
        coAuthors: v.optional(v.array(v.string())), 
        updatedAt: v.optional(v.number()),          
        isPrivate: v.optional(v.boolean()),         
        isDraft: v.optional(v.boolean()),
    }).searchIndex('search_title',{
        searchField: 'title',
    }).searchIndex('search_body',{
        searchField: 'body',
    }).index('by_author', ['authorId']),

    likes: defineTable({
        postId: v.id('posts'),
        userId: v.string(),
    }).index('by_post_user', ['postId', 'userId']),

    comments: defineTable({
        postId: v.id('posts'),
        authorId: v.string(),
        authorName: v.string(),
        body: v.string(),
    }),

    profiles: defineTable({
        userId: v.string(),
        name: v.optional(v.string()),  
        handle: v.optional(v.string()),
        phone: v.optional(v.string()),
        bio: v.optional(v.string()),
        website: v.optional(v.string()),
        location: v.optional(v.string()),
    }).index("by_userId", ["userId"])
    .index("by_handle", ["handle"]),

    follows: defineTable({
        followerId: v.string(),
        followingId: v.string(),
    }).index("by_follower", ["followerId"])
      .index("by_following", ["followingId"])
      .index("by_follower_following", ["followerId", "followingId"]),

    presenceSessions: defineTable({
  roomId: v.string(),
  sessionId: v.string(),
  userId: v.string(),
  lastSeen: v.number(),
  active: v.boolean(),
})
  .index("by_room", ["roomId", "active"])
  .index("by_session", ["sessionId"]),
});