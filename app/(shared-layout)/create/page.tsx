"use client"

import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, Loader2, Download, Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PostContent } from "@/components/web/Postcontent";
import { buildStandaloneHtml } from "@/lib/Downloadhtml";

const TiptapEditor = dynamic(() => import("@/components/web/TiptapEditor"), {
    ssr: false,
    loading: () => (
        <div className="flex flex-col w-full min-h-[500px] border rounded-xl bg-muted/10 animate-pulse p-4">
            <div className="h-10 bg-muted rounded-md mb-4 w-full" />
            <div className="flex-1 bg-muted rounded-md w-full" />
        </div>
    ),
});

export default function CreatePostPage() {
    const [isPending, setIsPending] = useState(false);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [copied, setCopied] = useState(false);

    async function onSubmit() {
        if (!title.trim()) { toast.error("Please enter a title"); return; }
        if (!content.trim()) { toast.error("Please enter some content"); return; }
        setIsPending(true);
        setTimeout(() => { toast.success("Blog published successfully!"); setIsPending(false); }, 1500);
    }

    const handleCopyHtml = () => {
        navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success("HTML copied to clipboard");
    };

    const handleDownloadHtml = () => {
        // Build a full standalone HTML document with styles + hljs CDN
        const fullHtml = buildStandaloneHtml(title, content);
        const blob = new Blob([fullHtml], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title || 'document'}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("HTML downloaded");
    };

    return (
        <div className="max-w-7xl mx-auto py-8 px-4">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Create New Post</h1>
                    <p className="text-muted-foreground">Draft your masterpiece with rich text and media.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleCopyHtml} className="gap-2">
                        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                        Copy HTML
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDownloadHtml} className="gap-2">
                        <Download className="size-4" />
                        Download
                    </Button>
                    <Button onClick={onSubmit} disabled={isPending} size="lg">
                        {isPending
                            ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Publishing...</>
                            : "Publish Post"}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <Card>
                        <CardContent className="pt-6 space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="title">Post Title</Label>
                                <Input
                                    id="title"
                                    placeholder="Enter a catchy title..."
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Content</Label>
                                <TiptapEditor content={content} onChange={setContent} />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Live Preview — same PostContent component as the blog page */}
                <div className="hidden lg:block">
                    <div className="sticky top-8 space-y-4">
                        <div className="flex items-center gap-2 text-muted-foreground mb-2">
                            <Eye className="size-4" />
                            <span className="text-sm font-medium uppercase tracking-wider">Live Preview</span>
                        </div>
                        <Card className="min-h-[500px] bg-muted/10 overflow-hidden">
                            <CardContent className="p-8">
                                <h1 className="text-4xl font-extrabold mb-8">
                                    {title || "Your Title Here"}
                                </h1>
                                {content
                                    ? <PostContent html={content} />
                                    : <p className="text-muted-foreground italic">Start typing to see the magic happen...</p>
                                }
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}