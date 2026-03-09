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
    const parsed  = postSchema.safeParse(values);

    if(!parsed.success){
        throw new Error("Something went wrong");
    }

    const token = await getToken();

    await fetchMutation(
        api.posts.createPost, {
            body: parsed.data.content,
            title: parsed.data.title
        },{
            token
        }
    );

    //redirect from server side
    // userouter only works on client component
    
    return redirect("/");

}
