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

    // Derived state for the live preview image
    const previewImageUrl = activeMediaTab === "upload" && selectedFile 
        ? URL.createObjectURL(selectedFile) 
        : activeMediaTab === "url" && externalUrl 
            ? externalUrl 
            : null;

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
            // LLM predicts USER may want to redirect to /blog here using useRouter()
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
        // Absolute full viewport height because this file is now outside the Navbar layout
        <div className="w-screen h-screen flex flex-col overflow-hidden bg-background">
            
            <div className="flex justify-between items-center p-4 border-b shrink-0 bg-muted/20">
                <div className="flex items-center gap-4">
                    <Link href="/blog">
                        <Button variant="ghost" size="icon"><ArrowLeft className="size-4" /></Button>
                    </Link>
                    <h1 className="text-xl font-bold tracking-tight">Post Editor</h1>
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

            <ResizablePanelGroup orientation="horizontal" className="flex-1 overflow-hidden">
                
                <ResizablePanel defaultSize={50} minSize={30} className="flex flex-col bg-background p-6 overflow-y-auto border-r">
                    <div className="space-y-6 mb-6 max-w-3xl mx-auto w-full">
                        
                        <div className="space-y-2">
                            <Label htmlFor="title" className="text-lg font-semibold">Post Title</Label>
                            <Input
                                id="title"
                                className="text-lg h-12 font-medium"
                                placeholder="Enter a catchy title..."
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="summary" className="text-sm font-semibold">Summary (Optional)</Label>
                            <Textarea
                                id="summary"
                                className="resize-none"
                                placeholder="Write a short summary... (AI generation can be copy-pasted here)"
                                value={summary}
                                onChange={(e) => setSummary(e.target.value)}
                                rows={2}
                            />
                        </div>
                        
                        <div className="space-y-2 border rounded-lg p-4 bg-muted/10">
                            <Label className="text-sm font-semibold mb-2 block">Header Image</Label>
                            <Tabs value={activeMediaTab} onValueChange={setActiveMediaTab} className="w-full">
                                <TabsList className="grid w-full grid-cols-2 mb-4">
                                    <TabsTrigger value="upload">Upload File</TabsTrigger>
                                    <TabsTrigger value="url">External URL</TabsTrigger>
                                </TabsList>
                                <TabsContent value="upload" className="flex items-center gap-4">
                                    <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
                                        <ImageIcon className="size-4 mr-2" />
                                        {selectedFile ? "Change Image" : "Select Image"}
                                    </Button>
                                    <span className="text-sm text-muted-foreground truncate max-w-[200px]">
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
                                <TabsContent value="url">
                                    <div className="flex items-center gap-2">
                                        <LinkIcon className="size-4 text-muted-foreground" />
                                        <Input 
                                            placeholder="https://images.unsplash.com/..." 
                                            value={externalUrl}
                                            onChange={(e) => setExternalUrl(e.target.value)}
                                        />
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>
                    
                    <div className="flex-1 flex flex-col min-h-[600px] max-w-3xl mx-auto w-full">
                        <Label className="text-sm font-semibold mb-2">Content</Label>
                        <TiptapEditor content={content} onChange={setContent} />
                    </div>
                </ResizablePanel>

                <ResizableHandle withHandle />

                <ResizablePanel defaultSize={50} minSize={30} className="bg-[#f8f9fa] dark:bg-zinc-950 p-0 overflow-y-auto hidden md:block">
                    <div className="sticky top-0 z-10 flex items-center justify-between p-2 bg-background/80 backdrop-blur-sm border-b">
                        <div className="flex items-center gap-2 text-muted-foreground px-4">
                            <Eye className="size-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">Live Preview</span>
                        </div>
                    </div>
                    
                    <div className="p-8 max-w-4xl mx-auto min-h-full">
                        {previewImageUrl && (
                            <div className="w-full h-[40vh] relative mb-8 rounded-xl overflow-hidden shadow-md bg-muted">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img 
                                    src={previewImageUrl} 
                                    alt="Header Preview" 
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        )}
                        <h1 className="text-5xl font-extrabold mb-4 tracking-tight">
                            {title || "Your Title Here"}
                        </h1>
                        {summary && (
                            <p className="text-xl text-muted-foreground mb-8 border-l-4 border-primary pl-4 italic">
                                {summary}
                            </p>
                        )}
                        <div className="prose dark:prose-invert max-w-none mt-8">
                            {content
                                ? <PostContent html={content} />
                                : <p className="text-muted-foreground italic">Start typing to see the magic happen...</p>
                            }
                        </div>
                    </div>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    );
}