// app/(shared-layout)/blog/page.tsx
export const dynamic = "force-dynamic";

import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import Image from "next/image";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default async function BlogIndexPage() {
    const posts = await fetchQuery(api.posts.getPosts);

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 animate-in fade-in duration-500">
            <h1 className="text-4xl font-bold mb-8 tracking-tight text-foreground">
                All Blog Posts
            </h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {posts.map((post) => {
                    // Strip HTML tags and limit to 150 characters for the summary
                    const plainTextSummary = post.body 
                        ? post.body.replace(/<[^>]*>?/gm, '').substring(0, 150) + "..." 
                        : "No content available.";

                    const fallbackImage = "https://images.unsplash.com/photo-1609743522653-52354461eb27?q=80&w=687&auto=format&fit=crop";
                    const displayImage = post.imageURL || post.headerImageUrl || fallbackImage;

                    return (
                        <Link href={`/blog/${post._id}`} key={post._id}>
                            <Card className="hover:scale-[1.02] transition-transform duration-300 overflow-hidden shadow-sm h-full flex flex-col">
                                <div className="relative w-full h-48 border-b">
                                    <Image
                                        src={displayImage} // Use the computed image here
                                        alt={post.title}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <CardHeader>
                                    <CardTitle className="line-clamp-2">{post.title}</CardTitle>
                                </CardHeader>
                                <CardContent className="mt-auto space-y-4">
                                    <p className="text-sm text-muted-foreground line-clamp-3">
                                        {plainTextSummary}
                                    </p>
                                    <div className="flex justify-between items-center text-xs text-muted-foreground font-medium">
                                        <span>By {post.authorName ?? "Anonymous"}</span>
                                        <span>{new Date(post._creationTime).toLocaleDateString()}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    )
                })}
            </div>
        </div>
    );
}