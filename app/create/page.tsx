"use client"

import TiptapEditor from "@/components/web/TiptapEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, Loader2, Download, Copy, Check, ImageIcon, Link as LinkIcon, ArrowLeft } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { PostContent } from "@/components/web/Postcontent";
import { buildStandaloneHtml } from "@/lib/Downloadhtml";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import Link from "next/link";
import { Navbar } from "@/components/web/navbar";

export default function CreatePostPage() {
    const [isPending, setIsPending] = useState(false);
    const [title, setTitle] = useState("");
    const [summary, setSummary] = useState("");
    const [content, setContent] = useState("");
    const [copied, setCopied] = useState(false);
    
    // Media States
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [externalUrl, setExternalUrl] = useState("");
    const [activeMediaTab, setActiveMediaTab] = useState("upload");

    const generateUploadUrl = useMutation(api.posts.getImageUploadURL);
    const createPost = useMutation(api.posts.createPost);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fallback image logic
    const defaultImage = "https://images.unsplash.com/photo-1609743522653-52354461eb27?q=80&w=687&auto=format&fit=crop";
    const previewImageUrl = activeMediaTab === "upload" && selectedFile 
        ? URL.createObjectURL(selectedFile) 
        : activeMediaTab === "url" && externalUrl.trim() !== ""
            ? externalUrl 
            : defaultImage;

    async function onSubmit() {
        if (!title.trim()) { toast.error("Please enter a title"); return; }
        if (!content.trim()) { toast.error("Please enter some content"); return; }
        
        setIsPending(true);
        try {
            let storageId: Id<"_storage"> | undefined = undefined;
            let finalExternalUrl: string | undefined = undefined;

            if (activeMediaTab === "upload" && selectedFile) {
                const postUrl = await generateUploadUrl();
                const result = await fetch(postUrl, {
                    method: "POST",
                    headers: { "Content-Type": selectedFile.type },
                    body: selectedFile,
                });
                
                if (!result.ok) throw new Error("Failed to upload image");
                const { storageId: returnedStorageId } = await result.json();
                storageId = returnedStorageId;
            } else if (activeMediaTab === "url" && externalUrl.trim()) {
                finalExternalUrl = externalUrl.trim();
            }

            const wordCount = content.replace(/<[^>]*>?/gm, '').split(/\s+/).length;
            const readTime = Math.ceil(wordCount / 200);

            await createPost({
                title,
                body: content,
                imageStorageId: storageId,
                headerImageUrl: finalExternalUrl,
                summary: summary.trim() || undefined,
                wordCount,
                readTime
            });

            toast.success("Blog published successfully!");
        } catch (error) {
            toast.error("Failed to publish post.");
            console.error(error);
        } finally {
            setIsPending(false);
        }
    }

    const handleCopyHtml = () => {
        navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success("HTML copied to clipboard");
    };

    const handleDownloadHtml = () => {
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
        // Changed to w-full to prevent horizontal scrollbars
        <div className="w-full h-screen flex flex-col overflow-hidden bg-background">
            
            {/* Navbar explicitly imported to avoid layout constraints */}
            <div className="shrink-0">
                <Navbar />
            </div>

            {/* Toolbar */}
            <div className="flex justify-between items-center p-4 border-b shrink-0 bg-muted/20">
                <div className="flex items-center gap-4">
                    <Link href="/blog">
                        <Button variant="ghost" size="icon"><ArrowLeft className="size-4" /></Button>
                    </Link>
                    <h1 className="text-xl font-bold tracking-tight"></h1>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleCopyHtml}>
                        {copied ? <Check className="size-4 mr-2" /> : <Copy className="size-4 mr-2" />}
                        Copy HTML
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDownloadHtml}>
                        <Download className="size-4 mr-2" />
                        Download
                    </Button>
                    <Button onClick={onSubmit} disabled={isPending} size="sm">
                        {isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                        Publish Post
                    </Button>
                </div>
            </div>

            {/* Top Metadata Section (Full Width) */}
            <div className="shrink-0 border-b bg-background p-4 shadow-sm z-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                    <div className="space-y-2">
                        <Label htmlFor="title" className="text-sm font-semibold">Post Title</Label>
                        <Input
                            id="title"
                            className="font-medium bg-muted/50"
                            placeholder="Enter a catchy title..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="summary" className="text-sm font-semibold">Summary (Optional)</Label>
                        <Textarea
                            id="summary"
                            className="resize-none h-[40px] min-h-[40px] bg-muted/50"
                            placeholder="Write a short summary..."
                            value={summary}
                            onChange={(e) => setSummary(e.target.value)}
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <Label className="text-sm font-semibold">Header Image</Label>
                        <Tabs value={activeMediaTab} onValueChange={setActiveMediaTab} className="w-full">
                            <TabsList className="grid w-full grid-cols-2 mb-2 h-9">
                                <TabsTrigger value="upload" className="text-xs">Upload File</TabsTrigger>
                                <TabsTrigger value="url" className="text-xs">External URL</TabsTrigger>
                            </TabsList>
                            <TabsContent value="upload" className="flex items-center gap-3 mt-0">
                                <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                                    <ImageIcon className="size-3 mr-2" />
                                    {selectedFile ? "Change" : "Select"}
                                </Button>
                                <span className="text-xs text-muted-foreground truncate flex-1">
                                    {selectedFile ? selectedFile.name : "No file chosen"}
                                </span>
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    className="hidden" 
                                    ref={fileInputRef}
                                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                />
                            </TabsContent>
                            <TabsContent value="url" className="mt-0">
                                <div className="flex items-center gap-2">
                                    <LinkIcon className="size-4 text-muted-foreground" />
                                    <Input 
                                        className="h-9 text-sm bg-muted/50"
                                        placeholder="https://images.unsplash.com/..." 
                                        value={externalUrl}
                                        onChange={(e) => setExternalUrl(e.target.value)}
                                    />
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>

            {/* Resizable Editor & Preview */}
            <ResizablePanelGroup orientation="horizontal" className="flex-1 overflow-hidden">
                
                <ResizablePanel defaultSize={50} minSize={30} className="flex flex-col bg-background overflow-hidden border-r">
                    <div className="bg-muted/30 border-b px-4 py-2 shrink-0">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Editor</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4">
                        <TiptapEditor content={content} onChange={setContent} />
                    </div>
                </ResizablePanel>

                <ResizableHandle withHandle />

                <ResizablePanel defaultSize={50} minSize={30} className="bg-[#f8f9fa] dark:bg-zinc-950 flex flex-col overflow-hidden hidden md:flex">
                    <div className="bg-background/80 backdrop-blur-sm border-b px-4 py-2 shrink-0 flex items-center gap-2">
                        <Eye className="size-4 text-muted-foreground" />
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Live Preview</span>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-8">
                        <div className="max-w-4xl mx-auto">
                            <div className="w-full h-[35vh] relative mb-8 rounded-xl overflow-hidden shadow-md bg-muted border">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img 
                                    src={previewImageUrl} 
                                    alt="Header Preview" 
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            
                            <h1 className="text-5xl font-extrabold mb-4 tracking-tight break-words">
                                {title || "Your Title Here"}
                            </h1>
                            
                            {summary && (
                                <p className="text-xl text-muted-foreground mb-8 border-l-4 border-primary pl-4 italic break-words">
                                    {summary}
                                </p>
                            )}
                            
                            <div className="prose dark:prose-invert max-w-none mt-8 break-words">
                                {content
                                    ? <PostContent html={content} />
                                    : <p className="text-muted-foreground italic">Start typing to see the magic happen...</p>
                                }
                            </div>
                        </div>
                    </div>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    );
}