"use client"

import { Editor } from '@tiptap/react'
import { 
    Bold, Italic, Code, Link as LinkIcon,
    AlignCenter, AlignLeft, AlignRight, Minus, Palette,
    Image as ImageIcon, Youtube, Loader2, Video as VideoIcon, Mic
} from 'lucide-react'
import { Button } from "@/components/ui/button"
import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { toast } from 'sonner'
import { Id } from '@/convex/_generated/dataModel'

export function EditorMenuBar({ editor }: { editor: Editor | null }) {
    const [isImageOpen, setIsImageOpen] = useState(false);
    const [isYoutubeOpen, setIsYoutubeOpen] = useState(false);
    const [isVideoOpen, setIsVideoOpen] = useState(false);
    const [isAudioOpen, setIsAudioOpen] = useState(false);
    
    const [isUploading, setIsUploading] = useState(false);
    const [mediaUrl, setMediaUrl] = useState("");

    const generateUploadUrl = useMutation(api.posts.getImageUploadURL);
    const resolveMediaUrl = useMutation(api.posts.getMediaUrl);

    if (!editor) return null;

    const setLink = () => {
        const url = window.prompt('Enter URL');
        if (url) {
            editor.chain().focus().setLink({ href: url }).run();
        }
    };

    // Generic upload handler for Image, Video, and Audio
    const handleConvexUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video' | 'audio') => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setIsUploading(true);
            
            // Request an upload URL from Convex
            const postUrl = await generateUploadUrl();
            
            // Upload the binary file to the URL
            const result = await fetch(postUrl, {
                method: "POST",
                headers: { "Content-Type": file.type },
                body: file,
            });

            if (!result.ok) throw new Error("Upload failed");

            // Extract the internal storage ID
            const { storageId } = await result.json();
            
            // Bypass HTTP routing and resolve the permanent public CDN URL directly
            const finalUrl = await resolveMediaUrl({ storageId: storageId as Id<"_storage"> });

            if (!finalUrl) {
                throw new Error("Unable to resolve media URL");
            }

            // Inject into Tiptap based on media type
            if (type === 'image') {
                editor.chain().focus().setImage({ src: finalUrl }).run();
                setIsImageOpen(false);
            } else if (type === 'video') {
                editor.chain().focus().insertContent({ type: 'customVideo', attrs: { src: finalUrl } }).run();
                setIsVideoOpen(false);
            } else if (type === 'audio') {
                editor.chain().focus().insertContent({ type: 'customAudio', attrs: { src: finalUrl } }).run();
                setIsAudioOpen(false);
            }

        } catch (error) {
            toast.error(`Failed to upload ${type}`);
            console.error(error);
        } finally {
            setIsUploading(false);
        }
    };

    const handleUrlSubmit = (e: React.FormEvent, type: 'image' | 'youtube' | 'video' | 'audio') => {
        e.preventDefault();
        if (!mediaUrl) return;

        if (type === 'image') {
            editor.chain().focus().setImage({ src: mediaUrl }).run();
            setIsImageOpen(false);
        } else if (type === 'youtube') {
            editor.chain().focus().setYoutubeVideo({ src: mediaUrl }).run();
            setIsYoutubeOpen(false);
        } else if (type === 'video') {
            editor.chain().focus().insertContent({ type: 'customVideo', attrs: { src: mediaUrl } }).run();
            setIsVideoOpen(false);
        } else if (type === 'audio') {
            editor.chain().focus().insertContent({ type: 'customAudio', attrs: { src: mediaUrl } }).run();
            setIsAudioOpen(false);
        }
        setMediaUrl("");
    };

    return (
        <div className="flex flex-wrap gap-1 p-2 border-b bg-background sticky top-0 z-10">
            {/* Standard Text Formatting */}
            <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'bg-muted' : ''}>
                <Bold className="size-4" />
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'bg-muted' : ''}>
                <Italic className="size-4" />
            </Button>
            
            {/* Font & Headings */}
            <select 
                className="bg-transparent text-sm border rounded px-1"
                onChange={(e) => editor.chain().focus().toggleHeading({ level: parseInt(e.target.value) as any }).run()}
            >
                <option value="0">Paragraph</option>
                <option value="1">H1</option>
                <option value="2">H2</option>
                <option value="3">H3</option>
            </select>

            {/* Alignment */}
            <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().setTextAlign('left').run()}>
                <AlignLeft className="size-4" />
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().setTextAlign('center').run()}>
                <AlignCenter className="size-4" />
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().setTextAlign('right').run()}>
                <AlignRight className="size-4" />
            </Button>

            {/* Color Picker */}
            <div className="flex items-center gap-1 border-l pl-1">
                <Palette className="size-4" />
                <input 
                    type="color" 
                    onInput={(e) => editor.chain().focus().setColor((e.target as HTMLInputElement).value).run()}
                    className="w-6 h-6 p-0 border-none bg-transparent cursor-pointer"
                />
            </div>

            {/* Special Text Features */}
            <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
                <Code className="size-4" />
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={setLink}>
                <LinkIcon className="size-4" />
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
                <Minus className="size-4" />
            </Button>

            {/* --- MEDIA MODALS --- */}
            
            {/* Image Modal */}
            <Dialog open={isImageOpen} onOpenChange={setIsImageOpen}>
                <DialogTrigger asChild>
                    <Button type="button" variant="ghost" size="sm" title="Insert Image">
                        <ImageIcon className="size-4" />
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader><DialogTitle>Insert Image</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        <Input type="file" accept="image/*" onChange={(e) => handleConvexUpload(e, 'image')} disabled={isUploading} />
                        {isUploading && <p className="text-sm text-muted-foreground flex items-center"><Loader2 className="size-4 animate-spin mr-2"/> Uploading...</p>}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Video Modal (Local Upload) */}
            <Dialog open={isVideoOpen} onOpenChange={setIsVideoOpen}>
                <DialogTrigger asChild>
                    <Button type="button" variant="ghost" size="sm" title="Upload Video">
                        <VideoIcon className="size-4" />
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader><DialogTitle>Upload Local Video</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        <Input type="file" accept="video/mp4,video/webm" onChange={(e) => handleConvexUpload(e, 'video')} disabled={isUploading} />
                        {isUploading && <p className="text-sm text-muted-foreground flex items-center"><Loader2 className="size-4 animate-spin mr-2"/> Uploading large file...</p>}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Audio Modal (Voice Insert) */}
            <Dialog open={isAudioOpen} onOpenChange={setIsAudioOpen}>
                <DialogTrigger asChild>
                    <Button type="button" variant="ghost" size="sm" title="Upload Audio/Voice">
                        <Mic className="size-4" />
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader><DialogTitle>Insert Audio Track</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        <Input type="file" accept="audio/mpeg,audio/wav,audio/ogg" onChange={(e) => handleConvexUpload(e, 'audio')} disabled={isUploading} />
                        {isUploading && <p className="text-sm text-muted-foreground flex items-center"><Loader2 className="size-4 animate-spin mr-2"/> Processing audio...</p>}
                    </div>
                </DialogContent>
            </Dialog>

            {/* YouTube Modal */}
            <Dialog open={isYoutubeOpen} onOpenChange={setIsYoutubeOpen}>
                <DialogTrigger asChild>
                    <Button type="button" variant="ghost" size="sm" title="Embed YouTube">
                        <Youtube className="size-4" />
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader><DialogTitle>Embed YouTube Video</DialogTitle></DialogHeader>
                    <form onSubmit={(e) => handleUrlSubmit(e, 'youtube')} className="space-y-4 py-4 flex gap-2">
                        <Input placeholder="https://youtube.com/watch?v=..." value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} />
                        <Button type="submit">Embed</Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}