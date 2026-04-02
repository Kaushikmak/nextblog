// app/(shared-layout)/blog/page.tsx

// Opt out of static prerendering to prevent the Math.random() build error
export const dynamic = "force-dynamic";

import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import Image from "next/image";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default async function BlogIndexPage() {
    // Fetch all posts using the getPosts query from convex/posts.ts
    const posts = await fetchQuery(api.posts.getPosts);

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 animate-in fade-in duration-500">
            <h1 className="text-4xl font-bold mb-8 tracking-tight text-foreground">
                All Blog Posts
            </h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {posts.map((post) => (
                    <Link href={`/blog/${post._id}`} key={post._id}>
                        <Card className="hover:scale-[1.02] transition-transform duration-300 overflow-hidden shadow-sm h-full flex flex-col">
                            {post.imageURL ? (
                                <div className="relative w-full h-48">
                                    <Image
                                        src={post.imageURL}
                                        alt={post.title}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            ) : (
                                <div className="relative w-full h-48 bg-secondary flex items-center justify-center">
                                    <span className="text-muted-foreground">No image</span>
                                </div>
                            )}
                            <CardHeader>
                                <CardTitle className="line-clamp-2">{post.title}</CardTitle>
                            </CardHeader>
                            <CardContent className="mt-auto">
                                <p className="text-sm text-muted-foreground">
                                    Posted on: {new Date(post._creationTime).toLocaleDateString()}
                                </p>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}