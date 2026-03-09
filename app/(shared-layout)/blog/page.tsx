"use client";

import Image from "next/image";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { api } from "@/convex/_generated/api"
import { useQuery } from "convex/react"
import Link  from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function blogPage() {
    
    const data = useQuery(api.posts.getPosts);

    return (
        <div className="py-12">
            <div className="text-center pb-12">
                <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Our Blogs</h1>
                <p className="pt-4 max-w-2xl mx-auto text-xl text-muted-foreground">Insights, thoughts and ideas to embrace</p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {data?.map((item) => (
                    <Card key={item._id} className="pt-0">
                        <div className="relative h-48 w-full overflow-hidden">
                            <Image
                                src="https://images.unsplash.com/photo-1761839256951-10c4468c3621?q=80&w=1471&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDF8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                                fill
                                alt="Blog image"
                                className="rounded-t-lg"
                            />
                        </div>
                        <CardContent>
                            <Link href={`/blog/${item._id}`}>
                                <h1 className="text-2xl font-bold hover:text-primary wrap-break-word">
                                    {item.title}
                                </h1>
                            </Link>
                            <p className="text-muted-foreground line-clamp-4">
                                {item.body}...
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
        </div>
    )
}