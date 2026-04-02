"use client"

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Eye, Heart, FileText, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
    const myPosts = useQuery(api.posts.getMyPosts);

    if (myPosts === undefined) {
        return <div className="flex justify-center py-20"><Loader2 className="size-8 animate-spin text-muted-foreground" /></div>;
    }

    const totalViews = myPosts.reduce((acc, post) => acc + (post.views ?? 0), 0);
    const totalLikes = myPosts.reduce((acc, post) => acc + (post.likes ?? 0), 0);

    return (
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-500">
            <h1 className="text-3xl font-bold tracking-tight mb-8">Author Dashboard</h1>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Posts</CardTitle>
                        <FileText className="size-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{myPosts.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Views</CardTitle>
                        <Eye className="size-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalViews}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Likes</CardTitle>
                        <Heart className="size-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalLikes}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Posts List */}
            <h2 className="text-xl font-bold mb-4">Your Content</h2>
            {myPosts.length === 0 ? (
                <div className="text-center py-12 border rounded-xl bg-muted/10 border-dashed">
                    <p className="text-muted-foreground mb-4">You haven't published any posts yet.</p>
                    <Link href="/create">
                        <Button>Create Your First Post</Button>
                    </Link>
                </div>
            ) : (
                <div className="bg-background border rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 text-muted-foreground uppercase">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Title</th>
                                    <th className="px-6 py-4 font-medium text-right">Views</th>
                                    <th className="px-6 py-4 font-medium text-right">Likes</th>
                                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {myPosts.map((post) => (
                                    <tr key={post._id} className="hover:bg-muted/20 transition-colors">
                                        <td className="px-6 py-4 font-medium text-foreground truncate max-w-[200px] sm:max-w-[400px]">
                                            {post.title}
                                        </td>
                                        <td className="px-6 py-4 text-right">{post.views ?? 0}</td>
                                        <td className="px-6 py-4 text-right">{post.likes ?? 0}</td>
                                        <td className="px-6 py-4 text-right">
                                            <Link href={`/blog/${post._id}`}>
                                                <Button variant="outline" size="sm">View</Button>
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}