"use server"

import z from "zod"
import { postSchema } from "./schemas/blog"
import { fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { redirect } from "next/navigation";
import { getToken } from "@/lib/auth-server";
import { updateTag } from "next/cache";

export async function createBlogAction(values: z.infer<typeof postSchema>) {
    try {
        const parsed = postSchema.safeParse(values);

        if (!parsed.success) {
            throw new Error("Validation failed");
        }

        const token = await getToken();
        let storageId = undefined;

        if (parsed.data.image) {
            const imageURL = await fetchMutation(api.posts.getImageUploadURL, {}, { token });
          
            const uploadResult = await fetch(imageURL, {
                method: "POST",
                headers: {
                    "Content-Type": parsed.data.image.type
                },
                body: parsed.data.image,
            });

            if (!uploadResult.ok) {
                return { error: 'Failed to upload cover image' };
            }

            const jsonResponse = await uploadResult.json();
            storageId = jsonResponse.storageId;
        }

        const plainText = parsed.data.content.replace(/<[^>]*>?/gm, '');
        const wordsArray = plainText.trim().split(/\s+/).filter(word => word.length > 0);
        const wordCount = wordsArray.length;

        const readTime = Math.ceil(wordCount / 225) || 1;

        await fetchMutation(
            api.posts.createPost, 
            {
                body: parsed.data.content,
                title: parsed.data.title,
                imageStorageId: storageId,
                wordCount: wordCount,
                readTime: readTime,
            }, 
            { token }
        );
        
    } catch (error) {
        console.error("Failed to create post:", error);
        return { error: 'Failed to create post' };
    }

    updateTag("blog");
    return redirect("/blog");
}