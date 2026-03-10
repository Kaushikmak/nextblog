"use server"

import z from "zod"
import { postSchema } from "./schemas/blog"
import { fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { redirect } from "next/navigation";
import { getToken } from "@/lib/auth-server";


// server functions are used to perform server side logic and can be called from client components
// server function internally uses POST method
// so we use it only for mutation of data not fetching
export async function createBlogAction(values: z.infer<typeof postSchema>) {
    

    try{
        const parsed  = postSchema.safeParse(values);

        if(!parsed.success){
            throw new Error("Something went wrong");
        }

        const token = await getToken();

        const imageURL = await fetchMutation(api.posts.getImageUploadURL, {},{token});
      
        const uploadResult  = await fetch(imageURL,{
            method: "POST",
            headers: {
                "Content-Type": parsed.data.image.type
            },

            body: parsed.data.image,
        })

        if(!uploadResult.ok){
            return {
                    error: 'Failed to upload image'
                };
            
        }

        const {storageId} = await uploadResult.json();

        await fetchMutation(
        api.posts.createPost, {
            body: parsed.data.content,
            title: parsed.data.title,
            imageStorageId: storageId,
        },{
            token
        }
    );
    
    }catch{
        return {
                    error: 'Failed to create post'
                };
    }

    

    //redirect from server side
    // userouter only works on client component
    
    return redirect("/blog");

}
