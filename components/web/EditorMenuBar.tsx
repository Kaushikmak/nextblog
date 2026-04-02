"use client"

import { Editor } from '@tiptap/react'
import { 
    Bold, Italic, Code, Link as LinkIcon,
    AlignCenter, AlignLeft, AlignRight, Minus, Palette,
    Image as ImageIcon, Youtube, Loader2
} from 'lucide-react'
import { Button } from "@/components/ui/button"
import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from 'sonner'

export function EditorMenuBar({ editor }: { editor: Editor | null }) {
    const [isImageOpen, setIsImageOpen] = useState(false);
    const [isYoutubeOpen, setIsYoutubeOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [youtubeUrl, setYoutubeUrl] = useState("");
    const [imageUrl, setImageUrl] = useState("");

    const generateUploadUrl = useMutation(api.posts.getImageUploadURL);

    if (!editor) return null;

    const handleLocalImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setIsUploading(true);
            
            // 1. Get Convex Upload URL
            const postUrl = await generateUploadUrl();
            
            // 2. Upload file directly to Convex
            const result = await fetch(postUrl, {
                method: "POST",
                headers: { "Content-Type": file.type },
                body: file,
            });

            if (!result.ok) throw new Error("Upload failed");

            const { storageId } = await result.json();
            
            // 3. Construct public URL using the environment variable mapped to HTTP router
            const convexSiteUrl = process.env.NEXT_PUBLIC_CONVEX_SITE_URL;
            const finalImageUrl = `${convexSiteUrl}/getMedia?storageId=${storageId}`;

            // 4. Inject into Tiptap
            editor.chain().focus().setImage({ src: finalImageUrl }).run();
            setIsImageOpen(false);
        } catch (error) {
            toast.error("Failed to upload image");
            console.error(error);
        } finally {
            setIsUploading(false);
        }
    };

    const handleImageUrlSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (imageUrl) {
            editor.chain().focus().setImage({ src: imageUrl }).run();
            setImageUrl("");
            setIsImageOpen(false);
        }
    };

    const handleYoutubeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (youtubeUrl) {
            editor.chain().focus().setYoutubeVideo({ src: youtubeUrl }).run();
            setYoutubeUrl("");
            setIsYoutubeOpen(false);
        }
    };

    const setLink = () => {
        const url = window.prompt('Enter URL')
        if (url) editor.chain().focus().setLink({ href: url }).run()
    }

    return (
        <div className="flex flex-wrap gap-1 p-2 border-b bg-background sticky top-0 z-10">
            <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'bg-muted' : ''}>
                <Bold className="size-4" />
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'bg-muted' : ''}>
                <Italic className="size-4" />
            </Button>
            
            <select 
                className="bg-transparent text-sm border rounded px-1"
                onChange={(e) => editor.chain().focus().toggleHeading({ level: parseInt(e.target.value) as any }).run()}
            >
                <option value="0">Paragraph</option>
                <option value="1">H1</option>
                <option value="2">H2</option>
                <option value="3">H3</option>
            </select>

            <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().setTextAlign('left').run()}>
                <AlignLeft className="size-4" />
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().setTextAlign('center').run()}>
                <AlignCenter className="size-4" />
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().setTextAlign('right').run()}>
                <AlignRight className="size-4" />
            </Button>

            <div className="flex items-center gap-1 border-l pl-1">
                <Palette className="size-4" />
                <input 
                    type="color" 
                    onInput={(e) => editor.chain().focus().setColor((e.target as HTMLInputElement).value).run()}
                    className="w-6 h-6 p-0 border-none bg-transparent cursor-pointer"
                />
            </div>

            <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
                <Code className="size-4" />
            </Button>

            {/* --- CUSTOM IMAGE DIALOG --- */}
            <Dialog open={isImageOpen} onOpenChange={setIsImageOpen}>
                <DialogTrigger asChild>
                    <Button type="button" variant="ghost" size="sm">
                        <ImageIcon className="size-4" />
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Insert Image</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Upload from Computer</Label>
                            <Input 
                                type="file" 
                                accept="image/*" 
                                onChange={handleLocalImageUpload}
                                disabled={isUploading}
                            />
                            {isUploading && <p className="text-sm text-muted-foreground flex items-center mt-2"><Loader2 className="size-4 animate-spin mr-2"/> Uploading to server...</p>}
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">Or embed link</span>
                        </div>
                        <form onSubmit={handleImageUrlSubmit} className="space-y-2 flex gap-2">
                            <Input 
                                placeholder="Paste image URL..." 
                                value={imageUrl} 
                                onChange={(e) => setImageUrl(e.target.value)}
                            />
                            <Button type="submit">Insert</Button>
                        </form>
                    </div>
                </DialogContent>
            </Dialog>

            {/* --- CUSTOM YOUTUBE DIALOG --- */}
            <Dialog open={isYoutubeOpen} onOpenChange={setIsYoutubeOpen}>
                <DialogTrigger asChild>
                    <Button type="button" variant="ghost" size="sm">
                        <Youtube className="size-4" />
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Embed YouTube Video</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleYoutubeSubmit} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>YouTube URL</Label>
                            <Input 
                                placeholder="https://youtube.com/watch?v=..." 
                                value={youtubeUrl} 
                                onChange={(e) => setYoutubeUrl(e.target.value)}
                            />
                        </div>
                        <Button type="submit" className="w-full">Embed Video</Button>
                    </form>
                </DialogContent>
            </Dialog>

            <Button type="button" variant="ghost" size="sm" onClick={setLink}>
                <LinkIcon className="size-4" />
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
                <Minus className="size-4" />
            </Button>
        </div>
    )
}