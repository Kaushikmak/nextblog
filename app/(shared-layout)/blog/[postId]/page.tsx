// app/blog/[postId]/page.tsx  — Server Component
import { buttonVariants } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { fetchQuery, preloadQuery } from "convex/nextjs";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { CommentSection } from "@/components/web/commentSection";
import { Metadata } from "next";
import { PostPresence } from "@/components/web/PostPresence";
import { getToken } from "@/lib/auth-server";
import { PostContent } from "@/components/web/Postcontent";   // ← Client Component

interface PostIdRouteProps {
    params: Promise<{ postId: Id<'posts'> }>;
}

export async function generateMetadata({ params }: PostIdRouteProps): Promise<Metadata> {
    const { postId } = await params;
    const post = await fetchQuery(api.posts.getPostById, { postId });

    if (!post) return { title: "Post not found", description: "The post you are looking for does not exist." };

    // Strip HTML tags for plain-text meta description
    const plain = post.body.replace(/<[^>]*>/g, '').slice(0, 160);

    return {
        title: `Next-Blog | ${post.title}`,
        description: plain,
    };
}

export default async function BlogPostPage({ params }: PostIdRouteProps) {
    const { postId } = await params;
    const token = await getToken();

    const [post, preloadedComments, userID] = await Promise.all([
        fetchQuery(api.posts.getPostById, { postId }),
        preloadQuery(api.comments.getCommentsByPostId, { postId }),
        fetchQuery(api.presence.getUserId, {}, { token }),
    ]);

    if (!post) {
        return (
            <div>
                <h1 className="text-6xl font-extrabold p-20">No post found</h1>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 animate-in fade-in duration-500">
            <Link href="/blog" className={buttonVariants({ variant: "ghost", size: "sm", className: "mb-4" })}>
                <ArrowLeft />
                back to blog
            </Link>

            {/* Hero image */}
            <div className="relative w-full h-72 mb-8 rounded-xl overflow-hidden shadow-sm">
                <Image
                    fill
                    src={post.imageURL ?? "https://images.unsplash.com/photo-1609743522653-52354461eb27?q=80&w=687&auto=format&fit=crop"}
                    className="object-cover hover:scale-105 transition-transform duration-500"
                    alt={post.title}
                />
            </div>

            {/* Title + meta */}
            <div className="space-y-2 mb-2">
                <h1 className="text-4xl font-bold tracking-tight text-foreground">{post.title}</h1>
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Posted on: {new Date(post._creationTime).toLocaleDateString()}
                    </p>
                    {userID && <PostPresence roomId={post._id} userID={userID} />}
                </div>
            </div>

            <Separator className="my-8" />

            {/*
                PostContent is a Client Component — it needs the DOM to run hljs.
                It renders the saved HTML with:
                  - Styled headings, paragraphs, lists, blockquotes
                  - Syntax-highlighted code blocks (same look as the editor)
                  - Styled inline code pills
            */}
            <PostContent html={post.body} />

            <Separator className="my-8" />

            <CommentSection preLoadedComments={preloadedComments} />
        </div>
    );
}