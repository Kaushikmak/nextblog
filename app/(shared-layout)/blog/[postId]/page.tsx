import { buttonVariants } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { fetchQuery } from "convex/nextjs";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Separator } from "@/components/ui/separator"

interface PostIdRouteProps{
    params: Promise<{
        postId: Id<'posts'>;
    }>;
}


export default async function BlogPostPage({params}: PostIdRouteProps){
    const {postId} = await params;

    const post = await fetchQuery(api.posts.getPostById,{postId: postId})

    if(!post){
        return (
            <div>
                <h1 className="text-6xl font-extrabold p-20">
                    NO posts found
                </h1>
            </div>
        )
    }

    return (
        <div className="max-w-3xl mx-auto py-8 px-4 animate-in fade-in duration-500 relative">
            <Link href="/blog" className={buttonVariants({variant: "ghost", size: "sm", className: "mb-4"})}>
                <ArrowLeft/>
                back to blog page
            </Link>
            <div className="relative w-full h-[400px] mv-8 rounded-xl overflow-hidden shodow-sm">
                <Image 
                fill
                src={post.imageURL ?? "https://images.unsplash.com/photo-1609743522653-52354461eb27?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D/*  */"
                } 
                className="object-cover hover:scale-105 transition-transform"
                alt={post.title}/>
            </div>

            <div className="space-y-4 flex flex-col">
                <h1 className="text-4xl font-bold tracking-tight pt-10 text-foreground">
                    {post.title}
                </h1>
                <p className="text-sm text-muted-foreground">
                    Posted on: {new Date(post._creationTime).toLocaleDateString()}
                </p>
            </div>

                <Separator className="my-8"/>

                <p className="text-lg leading-relaxed text-foreground/90 whitespace-pre-wrap">
                    {post.body}
                </p>

                <Separator className="my-8" />

                

        </div>
    )
}