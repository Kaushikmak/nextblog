"use client"

import TiptapEditor from "@/components/web/TiptapEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, Loader2, Download, Copy, Check, ImageIcon, Link as LinkIcon, ArrowLeft } from "lucide-react";
import { useState, useRef, useEffect, Suspense } from "react";
import { toast } from "sonner";
import { PostContent } from "@/components/web/Postcontent";
import { buildStandaloneHtml } from "@/lib/Downloadhtml";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import Link from "next/link";
import { Navbar } from "@/components/web/navbar";
import { useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

// Isolate the main logic that uses useSearchParams
function CreatePostEditor() {
    const currentUserId = useQuery(api.presence.getUserId);

    

    const searchParams = useSearchParams();
    const editIdParam = searchParams.get("editId");
    const editIdToFetch = editIdParam as Id<"posts"> | null;

    // Fetch existing post if editId is provided
    const existingPost = useQuery(api.posts.getPostById, editIdToFetch ? { postId: editIdToFetch } : "skip");

    
    const [isPending, setIsPending] = useState(false);
    const [title, setTitle] = useState("");
    const [summary, setSummary] = useState("");
    const [content, setContent] = useState("");
    const [copied, setCopied] = useState(false);
    
    // States for Features 1, 2, and 5
    const [isPrivate, setIsPrivate] = useState(false); 
    const [coAuthorsStr, setCoAuthorsStr] = useState(""); 
    const [existingPostId, setExistingPostId] = useState<Id<"posts"> | null>(null);

    const isOriginalAuthor = existingPost?.authorId === currentUserId;
    const isCoAuthorRole = existingPost?.coAuthors?.includes(currentUserId || "") ?? false;

    const [coAuthors, setCoAuthors] = useState<Array<{id: string, name: string}>>([]);
    const [coAuthorSearchInput, setCoAuthorSearchInput] = useState("");
    const authorSearchResults = useQuery(api.authors.searchAuthorsForDropdown, { searchTerm: coAuthorSearchInput });
    const existingCoAuthorsData = useQuery(api.authors.getAuthorsByIds, existingPost?.coAuthors ? { userIds: existingPost.coAuthors } : "skip");
    
    // Media States
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [externalUrl, setExternalUrl] = useState("");
    const [activeMediaTab, setActiveMediaTab] = useState("upload");

    const generateUploadUrl = useMutation(api.posts.getImageUploadURL);
    const createPost = useMutation(api.posts.createPost);
    const updatePostMutation = useMutation(api.posts.updatePost);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const createProposalMutation = useMutation(api.proposals.createProposal);

    const DRAFT_KEY = "blog_editor_draft";

    const isReadOnlyMeta = !!existingPostId && !isOriginalAuthor && isCoAuthorRole;

    const router = useRouter();

    useEffect(() => {
        // If the post is loaded, and the user is neither author nor co-author, kick them out.
        if (existingPost && currentUserId) {
            const isAuthor = existingPost.authorId === currentUserId;
            const isCoAuth = existingPost.coAuthors?.includes(currentUserId) ?? false;
            
            if (!isAuthor && !isCoAuth) {
                toast.error("You do not have permission to edit this post.");
                router.push("/blog");
            }
        }
    }, [existingPost, currentUserId, router]);


    useEffect(() => {
        if (existingCoAuthorsData && existingCoAuthorsData.length > 0 && coAuthors.length === 0) {
            setCoAuthors(existingCoAuthorsData);
        }
    }, [existingCoAuthorsData]);

    // Populate state with existing post data for Feature 2
    useEffect(() => {
        if (existingPost) {
            setExistingPostId(existingPost._id);
            setTitle(existingPost.title);
            setContent(existingPost.body);
            setSummary(existingPost.summary || "");
            setIsPrivate(existingPost.isPrivate || false);
            setCoAuthorsStr(existingPost.coAuthors?.join(", ") || "");

            // Handle image previews for existing posts
            if (existingPost.headerImageUrl) {
                setActiveMediaTab("url");
                setExternalUrl(existingPost.headerImageUrl);
            } else if (existingPost.imageURL) {
                setActiveMediaTab("url");
                setExternalUrl(existingPost.imageURL); 
            }
        }
    }, [existingPost]);

    // Load draft from Local Storage on initial mount
    useEffect(() => {
        const savedDraft = localStorage.getItem(DRAFT_KEY);
        // Prevent loading local draft if we are explicitly editing an existing post
        if (savedDraft && !existingPostId && !editIdToFetch) {
            try {
                const parsed = JSON.parse(savedDraft);
                if (parsed.title) setTitle(parsed.title);
                if (parsed.content) setContent(parsed.content);
                if (parsed.summary) setSummary(parsed.summary);
                toast.info("Unsaved draft restored");
            } catch (e) {
                console.error("Failed to parse local draft", e);
            }
        }
    }, [existingPostId, editIdToFetch]);

    // Save draft synchronously every 5 seconds
    useEffect(() => {
        if (existingPostId) return; // Disable auto-save over existing published posts
        const interval = setInterval(() => {
            if (title || content || summary) {
                localStorage.setItem(DRAFT_KEY, JSON.stringify({ title, content, summary }));
            }
        }, 5000);
        return () => clearInterval(interval);
    }, [title, content, summary, existingPostId]);

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
            let storageId: Id<"_storage"> | undefined = existingPost?.imageStorageId;
            let finalExternalUrl: string | undefined = existingPost?.headerImageUrl;

            // Only process new media if the user actually uploaded a new file or changed the URL
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
                finalExternalUrl = undefined; // Clear external URL if using local storage
            } else if (activeMediaTab === "url" && externalUrl.trim()) {
                finalExternalUrl = externalUrl.trim();
                storageId = undefined; // Clear storage ID if using external URL
            }

            const wordCount = content.replace(/<[^>]*>?/gm, '').split(/\s+/).length;
            const readTime = Math.ceil(wordCount / 200);

            const postArgs = {
                title,
                body: content,
                imageStorageId: storageId,
                headerImageUrl: finalExternalUrl,
                summary: summary.trim() || undefined,
                wordCount,
                readTime,
                coAuthors: coAuthors.map(author => author.id),
                isPrivate
            };

            if (existingPostId) {
                if (!isOriginalAuthor && isCoAuthorRole) {
                    await createProposalMutation({
                        postId: existingPostId,
                        proposedTitle: title,
                        proposedBody: content,
                        proposedSummary: summary.trim() || undefined,
                    });
                    toast.success("Draft proposed successfully! Awaiting author review.");
                    
                    router.push("/dashboard"); 
                } else {
                    // Main Branch: Original Author updates the post directly
                    await updatePostMutation({ id: existingPostId, ...postArgs });
                    toast.success("Blog updated successfully!");
                }
            } else {
                await createPost(postArgs);
                localStorage.removeItem(DRAFT_KEY);
                toast.success("Blog published successfully!");
            }
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
        <div className="w-full min-h-screen flex flex-col bg-background">
            <div className="shrink-0">
                <Navbar />
            </div>

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
                        {existingPostId 
                            ? (!isOriginalAuthor && isCoAuthorRole ? "Propose Edit" : "Update Post") 
                            : "Publish Post"
                        }
                    </Button>
                </div>
            </div>

            <div className="shrink-0 border-b bg-background p-4 shadow-sm z-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-4">
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
                    
                    {!isReadOnlyMeta && (
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

                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full pt-4 border-t">
                    <div className="space-y-2 relative">
                            <Label className="text-sm font-semibold">Co-Authors</Label>
                            
                            {/* Pill Container */}
                            <div className="flex flex-wrap gap-2 mb-2">
                                {coAuthors.map((author) => (
                                    <div key={author.id} className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium border border-primary/20">
                                        {author.name}
                                        <button 
                                            type="button"
                                            onClick={() => setCoAuthors(prev => prev.filter(a => a.id !== author.id))} 
                                            className="hover:bg-primary/20 rounded-full p-0.5 ml-1 transition-colors"
                                        >
                                            <X className="size-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Validation Search Input */}
                            <Input
                                className="font-medium bg-muted/50 h-9 text-sm"
                                placeholder="Type name or @handle to search..."
                                value={coAuthorSearchInput}
                                onChange={(e) => setCoAuthorSearchInput(e.target.value)}
                            />

                            {/* Dropdown Results */}
                            {coAuthorSearchInput && authorSearchResults !== undefined && (
                                <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-48 overflow-y-auto">
                                    {authorSearchResults.length === 0 ? (
                                        <div className="p-3 text-sm text-muted-foreground text-center">No authors found.</div>
                                    ) : (
                                        authorSearchResults.map(result => (
                                            <div 
                                                key={result.id} 
                                                className="flex items-center justify-between p-2 hover:bg-muted cursor-pointer transition-colors"
                                                onClick={() => {
                                                    if (!coAuthors.find(a => a.id === result.id)) {
                                                        setCoAuthors(prev => [...prev, { id: result.id, name: result.name }]);
                                                    }
                                                    setCoAuthorSearchInput(""); // Clear input on selection
                                                }}
                                            >
                                                <span className="font-medium text-sm">{result.name}</span>
                                                <span className="text-xs font-mono text-muted-foreground">@{result.handle}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    <div className="flex items-center space-x-2 pt-6">
                        <input 
                            type="checkbox" 
                            id="isPrivate" 
                            checked={isPrivate} 
                            onChange={(e) => setIsPrivate(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                        />
                        <Label htmlFor="isPrivate" className="text-sm font-semibold cursor-pointer">
                            Mark as Private (Hidden from public feed)
                        </Label>
                    </div>
                </div>
            </div>

            <ResizablePanelGroup orientation="horizontal" className="flex-1 !overflow-visible">
                <ResizablePanel defaultSize={50} minSize={30} className="flex flex-col bg-background !overflow-visible border-r">
                    <div className="bg-muted/30 border-b px-4 py-2 shrink-0">
    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Editor</span>
</div>
                    <div className="flex-1 p-4">
                        <TiptapEditor content={content} onChange={setContent} />
                    </div>
                </ResizablePanel>

                <ResizableHandle withHandle />

                <ResizablePanel defaultSize={50} minSize={30} className="bg-[#f8f9fa] dark:bg-zinc-950 flex flex-col !overflow-visible hidden md:flex">
                    <div className="bg-background/80 backdrop-blur-sm border-b px-4 py-2 shrink-0 flex items-center gap-2">
    <Eye className="size-4 text-muted-foreground" />
    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Live Preview</span>
</div>
                    
                    <div className="flex-1 p-8">
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

// Wrap in Suspense because useSearchParams triggers de-opt during build in Next.js
export default function CreatePostClient() {
    return (
        <Suspense fallback={<div className="w-full h-screen flex items-center justify-center">Loading editor...</div>}>
            <CreatePostEditor />
        </Suspense>
    );
}