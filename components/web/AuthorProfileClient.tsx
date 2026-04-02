"use client"

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Loader2, MapPin, Link as LinkIcon, UserPlus, UserCheck, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface AuthorProfileClientProps {
    authorId: string;
}

export function AuthorProfileClient({ authorId }: AuthorProfileClientProps) {
    const authorData = useQuery(api.authors.getAuthorProfile, { authorId });
    const isFollowing = useQuery(api.authors.getFollowStatus, { authorId });
    const toggleFollow = useMutation(api.authors.toggleFollow);

    if (authorData === undefined || isFollowing === undefined) {
        return <div className="flex justify-center py-20"><Loader2 className="size-8 animate-spin text-muted-foreground" /></div>;
    }

    const { profile, posts, followerCount, fallbackName } = authorData;

    const handleFollow = async () => {
        try {
            await toggleFollow({ authorId });
            toast.success(isFollowing ? "Unfollowed author" : "Following author");
        } catch (error: any) {
            toast.error(error.message || "Failed to update follow status.");
        }
    };

    return (
        <div className="max-w-5xl mx-auto py-8 px-4 animate-in fade-in duration-500">
            {/* Profile Header */}
            <div className="bg-muted/30 border rounded-2xl p-8 mb-12 flex flex-col md:flex-row items-center md:items-start gap-8">
                <div className="size-32 bg-primary/10 rounded-full flex items-center justify-center border-4 border-background shrink-0 shadow-sm">
                    <User className="size-16 text-primary" />
                </div>
                
                <div className="flex-1 text-center md:text-left space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">{fallbackName}</h1>
                            <p className="text-muted-foreground font-medium mt-1">
                                {followerCount} Follower{followerCount !== 1 ? 's' : ''}
                            </p>
                        </div>
                        <Button 
                            onClick={handleFollow} 
                            variant={isFollowing ? "secondary" : "default"}
                            className="w-full md:w-auto"
                        >
                            {isFollowing ? <><UserCheck className="size-4 mr-2" /> Following</> : <><UserPlus className="size-4 mr-2" /> Follow</>}
                        </Button>
                    </div>

                    {profile?.bio && (
                        <p className="text-foreground/80 max-w-2xl leading-relaxed">
                            {profile.bio}
                        </p>
                    )}

                    <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2 text-sm text-muted-foreground">
                        {profile?.location && (
                            <div className="flex items-center">
                                <MapPin className="size-4 mr-1.5" /> {profile.location}
                            </div>
                        )}
                        {profile?.website && (
                            <a href={profile.website} target="_blank" rel="noreferrer" className="flex items-center hover:text-primary transition-colors">
                                <LinkIcon className="size-4 mr-1.5" /> Website
                            </a>
                        )}
                    </div>
                </div>
            </div>

            {/* Author's Posts Grid */}
            <h2 className="text-2xl font-bold mb-6 border-b pb-2">Published Works</h2>
            
            {posts.length === 0 ? (
                <p className="text-muted-foreground italic">This author has not published any posts yet.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {posts.map((post) => {
                        const plainTextSummary = post.body 
                            ? post.body.replace(/<[^>]*>?/gm, '').substring(0, 150) + "..." 
                            : "No content available.";
                        const fallbackImage = "https://images.unsplash.com/photo-1609743522653-52354461eb27?q=80&w=687&auto=format&fit=crop";
                        const displayImage = post.imageURL || post.headerImageUrl || fallbackImage;

                        return (
                            <Link href={`/blog/${post._id}`} key={post._id}>
                                <Card className="hover:scale-[1.02] transition-transform duration-300 overflow-hidden shadow-sm h-full flex flex-col">
                                    <div className="relative w-full h-48 border-b">
                                        <Image src={displayImage} alt={post.title} fill className="object-cover" />
                                    </div>
                                    <CardHeader>
                                        <CardTitle className="line-clamp-2">{post.title}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="mt-auto space-y-4">
                                        <p className="text-sm text-muted-foreground line-clamp-3">
                                            {plainTextSummary}
                                        </p>
                                        <div className="flex justify-between items-center text-xs text-muted-foreground font-medium">
                                            <span>{new Date(post._creationTime).toLocaleDateString()}</span>
                                            <span className="flex gap-3">
                                                <span>{post.views ?? 0} views</span>
                                                <span>{post.likes ?? 0} likes</span>
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        )
                    })}
                </div>
            )}
        </div>
    );
}