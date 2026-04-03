import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { components, internal } from "./_generated/api";
import { DataModel } from "./_generated/dataModel";
import { query, internalMutation } from "./_generated/server";
import { betterAuth } from "better-auth/minimal";
import { v } from "convex/values";
import authConfig from "./auth.config";

const siteUrl = process.env.SITE_URL!;

// The component client has methods needed for integrating Convex with Better Auth,
// as well as helper methods for general use.
export const authComponent = createClient<DataModel>(components.betterAuth);

export const createAuth = (ctx: GenericCtx<DataModel>) => {
  return betterAuth({
    baseURL: siteUrl,
    database: authComponent.adapter(ctx),
    // Configure simple, non-verified email/password to get started
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    plugins: [
      // The Convex plugin is required for Convex compatibility
      convex({ authConfig }),
    ],
    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            // Better Auth executes within a Convex Action context, so we must 
            // trigger an internal mutation to write to the database tables.
            if ("runMutation" in ctx) {
              await ctx.runMutation(internal.auth.createInitialProfile, {
                userId: user.id,
                name: user.name || "Author"
              });
            }
          }
        }
      }
    }
  })
}

// Internal mutation to safely write to the profiles table during the signup process
export const createInitialProfile = internalMutation({
    args: {
        userId: v.string(),
        name: v.string(),
    },
    handler: async (ctx, args) => {
        // Generate a clean alphanumeric handle with a 4-digit numeric suffix
        const cleanName = args.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const handle = `${cleanName}-${randomNum}`;

        // Ensure idempotency: verify a profile doesn't already exist for this user
        const existing = await ctx.db.query("profiles")
            .withIndex("by_userId", q => q.eq("userId", args.userId))
            .unique();

        if (!existing) {
            await ctx.db.insert("profiles", {
                userId: args.userId,
                name: args.name,
                handle: handle,
            });
        }
    }
});

// Example function for getting the current user
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    return authComponent.getAuthUser(ctx);
  },
});