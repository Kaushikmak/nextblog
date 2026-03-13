// "use client";

import Image from "next/image";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import Link  from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

// This page is rendered as static, so it can be cached by the CDN and served faster to users.
export const dynamic = "force-static";

// revalidate the page every 30 seconds, so that the content is updated without needing to redeploy the app.
export const revalidate = 30;


export default function blogPage() {
    
    // const data = useQuery(api.posts.getPosts);

    

    return (
        <div className="py-12">
            <div className="text-center pb-12">
                <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Our Blogs</h1>
                <p className="pt-4 max-w-2xl mx-auto text-xl text-muted-foreground">Insights, thoughts and ideas to embrace</p>
            </div>
            <Suspense fallback={<SkeletonCard/>}>
                <LoadBlogList/>
            </Suspense>
        </div>
    )
}


export function SkeletonCard() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, index) => (
            <div className="flex flex-col space-y-3" key={index}>
                <Skeleton className="h-48 w-full rounded-xl" />
                <div className="space-y-2 flex flex-col">
                    <Skeleton className="h-6 w-3/4"/>
                    <Skeleton className="h-4 w-full"/>
                    <Skeleton className="h-4 w-2/4"/>
                </div>
            </div>
        ))}
    </div>
  )
}



async function LoadBlogList(){
    const data = await fetchQuery(api.posts.getPosts);

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {data?.map((item) => (
                    <Card key={item._id} className="pt-0">
                        <div className="relative h-48 w-full overflow-hidden">
                            <Image
                                src={item.imageURL ?? "https://images.unsplash.com/photo-1609743522653-52354461eb27?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D/*  */"}
                                fill
                                alt="Blog image"
                                className="rounded-t-lg object-cover"
                            />
                        </div>
                        <CardContent>
                            <Link href={`/blog/${item._id}`}>
                                <h1 className="text-2xl font-bold hover:text-primary wrap-break-word">
                                    {item.title}
                                </h1>
                            </Link>
                            <p className="text-muted-foreground line-clamp-4">
                                {item.body}
                            </p>
                        </CardContent>
                        <CardFooter>
                            <Link className={buttonVariants({className: "w-full",})}
                            href={`/blog/${item._id}`}>
                                Read more...
                            </Link>
                        </CardFooter>
                    </Card>
                ))}
            </div>
    )
} 