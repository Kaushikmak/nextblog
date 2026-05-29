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
import { PostContent } from "@/components/web/Postcontent";
import { PostInteractions } from "@/components/web/PostInteractions";
import { TableOfContents } from "@/components/web/TableOfContents";

interface PostIdRouteProps {
    params: Promise<{ postId: Id<'posts'> }>;
}

export async function generateMetadata({ params }: PostIdRouteProps): Promise<Metadata> {
    const { postId } = await params;
    const post = await fetchQuery(api.posts.getPostById, { postId });

    if (!post) {
        return { 
            title: "Post Not Found", 
            description: "The requested technical discourse is unavailable.",
        };
    }

    const plainDescription = post.body.replace(/<[^>]*>/g, '').slice(0, 160).trim();
    
    // Modification: Prioritize headerImageUrl, fallback to imageURL, then default image
    const postImage = post.headerImageUrl || post.imageURL || "/og-image.png";

    const allAuthorNames = [post.authorName ?? "Anonymous", ...(post.resolvedCoAuthors?.map((a: any) => a.name) || [])];

    return {
        title: post.title, 
        description: post.summary || plainDescription,
        openGraph: {
            title: post.title,
            description: post.summary || plainDescription,
            type: "article",
            url: `https://nextblog-ov87.vercel.app/blog/${postId}`,
            publishedTime: new Date(post._creationTime).toISOString(),
            authors: allAuthorNames, 
            images: [
                {
                    url: postImage,
                    width: 1200,
                    height: 630,
                    alt: post.title,
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title: post.title,
            description: post.summary || plainDescription,
            creator: "@KmaK69837720", 
            images: [postImage],
        },
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
        <div className="max-w-7xl mx-auto py-8 px-4 flex gap-8 animate-in fade-in duration-500">
            {/* Left sidebar for ToC */}
            <aside className="hidden lg:block w-64 shrink-0">
                <div className="sticky top-24">
                    <TableOfContents html={post.body} />
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 max-w-3xl min-w-0 mx-auto">
                <Link href="/blog" className={buttonVariants({ variant: "ghost", size: "sm", className: "mb-4" })}>
                    <ArrowLeft className="mr-2 size-4" />
                    back to blog
                </Link>

                {/* Hero image */}
                <div className="relative w-full h-72 mb-8 rounded-xl overflow-hidden shadow-sm border">
                    <Image
                        fill
                        // Modification: Apply the same prioritization logic to the render tree
                        src={post.headerImageUrl ?? post.imageURL ?? "https://images.unsplash.com/photo-1609743522653-52354461eb27?q=80&w=687&auto=format&fit=crop"}
                        className="object-cover hover:scale-105 transition-transform duration-500"
                        alt={post.title}
                    />
                </div>

                {/* Title + meta */}
                <div className="space-y-6 mb-2">
                    <div className="space-y-4">
                        <h1 className="text-4xl font-bold tracking-tight text-foreground break-words">{post.title}</h1>
                        
                        {/* NEW: Render the summary blockquote just like the Live Preview */}
                        {post.summary && (
                            <p className="text-xl text-muted-foreground border-l-4 border-primary pl-4 italic break-words">
                                {post.summary}
                            </p>
                        )}
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="space-y-3">
                                <div className="flex flex-wrap items-center gap-4">
                                    
                                    {/* Segregated Author Display with Links */}
                                    <div className="text-sm text-foreground flex flex-wrap gap-2 items-center">
                                        <span className="font-semibold">Author:</span>
                                        <Link href={`/authors/${post.authorId}`} className="hover:underline hover:text-primary transition-colors">
                                            {post.authorName ?? "Anonymous"}
                                        </Link>

                                        {post.resolvedCoAuthors && post.resolvedCoAuthors.length > 0 && (
                                            <>
                                                <span className="text-muted-foreground">|</span>
                                                <span className="font-semibold">Co-author(s):</span>
                                                {post.resolvedCoAuthors.map((author: any, index: number) => (
                                                    <span key={author.id}>
                                                        <Link href={`/authors/${author.id}`} className="hover:underline hover:text-primary transition-colors">
                                                            {author.name}
                                                        </Link>
                                                        {index < post.resolvedCoAuthors!.length - 1 ? ", " : ""}
                                                    </span>
                                                ))}
                                            </>
                                        )}
                                    </div>
                                    
                                    <PostPresence roomId={post._id} userID={userID} />
                                </div>
                                
                                <p className="text-xs text-muted-foreground">
                                    Posted on {new Date(post._creationTime).toLocaleDateString()}
                                </p>
                            </div>
                            
                            <PostInteractions 
                                postId={post._id} 
                                initialViews={post.views ?? 0} 
                                initialLikes={post.likes ?? 0} 
                            />
                        </div>
                </div>

                <Separator className="my-8" />

                <PostContent html={post.body} />

                <Separator className="my-8" />

                <CommentSection preLoadedComments={preloadedComments} />
            </div>

            {/* Right sidebar (empty) for balance */}
            <aside className="hidden xl:block w-64 shrink-0">
            </aside>
        </div>
    );
}