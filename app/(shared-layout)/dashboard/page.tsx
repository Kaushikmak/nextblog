"use client"

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Eye, Heart, FileText, Loader2, Save, User, Trash2, Edit, Copy } from "lucide-react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function DashboardPage() {
    // Queries & Session
    const myPosts = useQuery(api.posts.getMyPosts);
    const myProfile = useQuery(api.profiles.getMyProfile);
    const upsertProfile = useMutation(api.profiles.upsertProfile);
    
    // Delete Mutation & State
    const deletePostMutation = useMutation(api.posts.deletePost);
    const [postToDelete, setPostToDelete] = useState<Id<"posts"> | null>(null);
    
    const { data: session, isPending: sessionLoading } = authClient.useSession();

    // Local State for Forms
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
    name: "",
    handle: "",
    phone: "",
    bio: "",
    website: "",
    location: "",
});

    // Hydrate form when data arrives
    useEffect(() => {
    if (session && myProfile !== undefined) {
            let currentHandle = myProfile?.handle;

            // Auto-generate cute handle fallback
            if (!currentHandle && session?.user?.name) {
                const cleanName = session.user.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
                const randomNum = Math.floor(Math.random() * 1000);
                currentHandle = `${cleanName}-${randomNum}`;
            }

            setFormData({
                name: session?.user?.name || "",
                handle: currentHandle || "",
                phone: myProfile?.phone || "",
                bio: myProfile?.bio || "",
                website: myProfile?.website || "",
                location: myProfile?.location || "",
            });
        }
    }, [session, myProfile]);

    if (myPosts === undefined || sessionLoading || myProfile === undefined) {
        return <div className="flex justify-center items-center h-[50vh]"><Loader2 className="size-8 animate-spin text-muted-foreground" /></div>;
    }

    const totalViews = myPosts.reduce((acc, post) => acc + (post.views ?? 0), 0);
    const totalLikes = myPosts.reduce((acc, post) => acc + (post.likes ?? 0), 0);

    const handleSaveProfile = async () => {
        setIsSaving(true);
        try {
            if (formData.name !== session?.user?.name) {
                await authClient.updateUser({ name: formData.name });
            }

            await upsertProfile({
            name: formData.name,
            handle: formData.handle.toLowerCase().trim(),
            phone: formData.phone.trim() || undefined,
            bio: formData.bio.trim() || undefined,
            website: formData.website.trim() || undefined,
            location: formData.location.trim() || undefined,
        });
        toast.success("Profile updated successfully!");
        } catch (error) {
            toast.error("Failed to update profile.");
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    // Modal Confirmation Execution
    const confirmDelete = async () => {
        if (!postToDelete) return;
        try {
            await deletePostMutation({ id: postToDelete });
            toast.success("Post deleted successfully");
        } catch (error) {
            toast.error("Failed to delete post");
            console.error("Deletion error:", error);
        } finally {
            setPostToDelete(null);
        }
    };

    return (
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Welcome, {session?.user?.name || "Author"}</h1>
                <div className="flex items-center gap-2 mt-2">
                    <div className="bg-muted px-3 py-1 rounded-md border font-mono text-sm text-muted-foreground">
                        @{formData.handle}
                    </div>
                    <Button variant="outline" size="icon" className="size-8" onClick={() => {
                        navigator.clipboard.writeText(formData.handle);
                        toast.success("Handle copied to clipboard!");
                    }}>
                        <Copy className="size-4" />
                    </Button>
                </div>
            </div>
            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="settings">Profile Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Total Posts</CardTitle>
                                <FileText className="size-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent><div className="text-2xl font-bold">{myPosts.length}</div></CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Total Views</CardTitle>
                                <Eye className="size-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent><div className="text-2xl font-bold">{totalViews}</div></CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Total Likes</CardTitle>
                                <Heart className="size-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent><div className="text-2xl font-bold">{totalLikes}</div></CardContent>
                        </Card>
                    </div>

                    <h2 className="text-xl font-bold mb-4">Your Content</h2>
                    {myPosts.length === 0 ? (
                        <div className="text-center py-12 border rounded-xl bg-muted/10 border-dashed">
                            <p className="text-muted-foreground mb-4">You haven't published any posts yet.</p>
                            <Link href="/create"><Button>Create Your First Post</Button></Link>
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
                                                {/* Modified Title Column to include Role Badge */}
                                                <td className="px-6 py-4 font-medium text-foreground truncate max-w-[200px] sm:max-w-[400px]">
                                                    <div className="flex flex-col gap-1.5">
                                                        <span className="truncate">{post.title}</span>
                                                        
                                                        {/* Visual Role Segregation */}
                                                        {(post as any).isMainAuthor ? (
                                                            <span className="w-max px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-primary/10 text-primary border border-primary/20">
                                                                Author
                                                            </span>
                                                        ) : (
                                                            <span className="w-max px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-muted text-muted-foreground border">
                                                                Co-Author
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                
                                                <td className="px-6 py-4 text-right">{post.views ?? 0}</td>
                                                <td className="px-6 py-4 text-right">{post.likes ?? 0}</td>
                                                <td className="px-6 py-4 flex items-center justify-end gap-2">
                                                    <Link href={`/blog/${post._id}`}>
                                                        <Button variant="outline" size="icon" title="View Post">
                                                            <Eye className="size-4" />
                                                        </Button>
                                                    </Link>
                                                    <Link href={`/create?editId=${post._id}`}>
                                                        <Button variant="outline" size="icon" title="Edit Post">
                                                            <Edit className="size-4" />
                                                        </Button>
                                                    </Link>
                                                    <Button 
                                                        variant="destructive" 
                                                        size="icon" 
                                                        title="Delete Post" 
                                                        onClick={() => setPostToDelete(post._id)}
                                                        // Optional: Disable delete button if user is only a co-author
                                                        disabled={!(post as any).isMainAuthor}
                                                    >
                                                        <Trash2 className="size-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="settings">
                    <Card className="max-w-2xl">
                        <CardHeader>
                            <CardTitle>Personal Information</CardTitle>
                            <CardDescription>Update your public profile and contact details.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address (Read-Only)</Label>
                                <Input id="email" value={session?.user?.email || ""} disabled className="bg-muted" />
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="name">Display Name</Label>
                                <Input 
                                    id="name" 
                                    value={formData.name} 
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input 
                                        id="phone" 
                                        placeholder="+1 (555) 000-0000"
                                        value={formData.phone} 
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="location">Location</Label>
                                    <Input 
                                        id="location" 
                                        placeholder="San Francisco, CA"
                                        value={formData.location} 
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })} 
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="website">Website / Portfolio</Label>
                                <Input 
                                    id="website" 
                                    placeholder="https://github.com/yourusername"
                                    value={formData.website} 
                                    onChange={(e) => setFormData({ ...formData, website: e.target.value })} 
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="bio">Author Bio</Label>
                                <Textarea 
                                    id="bio" 
                                    placeholder="Tell readers a little about yourself..."
                                    className="resize-none"
                                    rows={4}
                                    value={formData.bio} 
                                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })} 
                                />
                            </div>

                            <div className="pt-4 border-t flex justify-end">
                                <Button onClick={handleSaveProfile} disabled={isSaving}>
                                    {isSaving ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Save className="size-4 mr-2" />}
                                    Save Changes
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Custom Theme Confirmation Dialog */}
            <Dialog open={!!postToDelete} onOpenChange={(open) => !open && setPostToDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Post</DialogTitle>
                        <DialogDescription>
                            Are you absolutely sure you want to delete this post? This action is permanent and cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0 mt-4">
                        <Button variant="outline" onClick={() => setPostToDelete(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmDelete}>Delete Permanently</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}