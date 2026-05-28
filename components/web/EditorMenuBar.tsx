"use client"

import { Editor } from '@tiptap/react'
import { 
    Bold, Italic, Code, Link as LinkIcon, Strikethrough, Underline,
    AlignCenter, AlignLeft, AlignRight, AlignJustify, Minus, Palette,
    Image as ImageIcon, Youtube, Video as VideoIcon, Mic, Heading1,
    Heading2, Heading3, List, ListOrdered, Quote, Undo, Redo,
    Highlighter
} from 'lucide-react'
import { Button } from "@/components/ui/button"
import { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { toast } from 'sonner'
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"

interface EditorMenuBarProps {
    editor: Editor | null;
}

export function EditorMenuBar({ editor }: EditorMenuBarProps) {
    const [isLinkOpen, setIsLinkOpen] = useState(false);
    const [linkUrl, setLinkUrl] = useState("");
    
    const [isImageOpen, setIsImageOpen] = useState(false);
    const [isVideoOpen, setIsVideoOpen] = useState(false);
    const [isAudioOpen, setIsAudioOpen] = useState(false);
    const [isYoutubeOpen, setIsYoutubeOpen] = useState(false);
    
    const [mediaUrl, setMediaUrl] = useState("");
    const [isUploading, setIsUploading] = useState(false);

    const generateUploadUrl = useMutation(api.posts.getImageUploadURL);
    const getMediaUrl = useMutation(api.posts.getMediaUrl);

    if (!editor) return null;

    const handleLinkSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (linkUrl) {
            editor.chain().focus().setLink({ href: linkUrl }).run();
            setLinkUrl("");
            setIsLinkOpen(false);
        }
    };

    const handleFileUpload = async (
        e: React.ChangeEvent<HTMLInputElement>, 
        type: 'image' | 'video' | 'audio'
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setIsUploading(true);
            
            // 1. Get upload URL
            const postUrl = await generateUploadUrl();
            
            // 2. Upload file to Convex storage
            const result = await fetch(postUrl, {
                method: "POST",
                headers: { "Content-Type": file.type },
                body: file,
            });
            
            if (!result.ok) throw new Error("Failed to upload file");
            const { storageId } = await result.json();
            
            // 3. Get the public URL for the uploaded file
            const url = await getMediaUrl({ storageId });
            
            if (!url) throw new Error("Failed to get media URL");
            
            if (type === 'image') {
                editor.chain().focus().setImage({ src: url }).run();
                setIsImageOpen(false);
            } else if (type === 'video') {
                editor.chain().focus().insertContent({ 
                    type: 'customVideo', 
                    attrs: { src: url } 
                }).run();
                setIsVideoOpen(false);
            } else if (type === 'audio') {
                editor.chain().focus().insertContent({ 
                    type: 'customAudio', 
                    attrs: { src: url } 
                }).run();
                setIsAudioOpen(false);
            }
            
            toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} uploaded successfully`);
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
            editor.chain().focus().insertContent({ 
                type: 'customVideo', 
                attrs: { src: mediaUrl } 
            }).run();
            setIsVideoOpen(false);
        } else if (type === 'audio') {
            editor.chain().focus().insertContent({ 
                type: 'customAudio', 
                attrs: { src: mediaUrl } 
            }).run();
            setIsAudioOpen(false);
        }
        setMediaUrl("");
        toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} added successfully`);
    };

    const MenuButton = ({ 
        onClick, 
        isActive = false, 
        icon: Icon, 
        title,
        disabled = false
    }: { 
        onClick: () => void; 
        isActive?: boolean; 
        icon: React.ElementType;
        title: string;
        disabled?: boolean;
    }) => (
        <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClick}
            disabled={disabled}
            className={isActive ? 'bg-muted' : ''}
            title={title}
        >
            <Icon className="size-4" />
        </Button>
    );

    return (
        <div className="flex flex-wrap gap-1 p-2 border-b bg-background sticky top-0 z-40">
            {/* History */}
            <div className="flex items-center gap-0.5">
                <MenuButton 
                    onClick={() => editor.chain().focus().undo().run()} 
                    icon={Undo} 
                    title="Undo"
                    disabled={!editor.can().undo()}
                />
                <MenuButton 
                    onClick={() => editor.chain().focus().redo().run()} 
                    icon={Redo} 
                    title="Redo"
                    disabled={!editor.can().redo()}
                />
            </div>

            <div className="w-px h-8 bg-border mx-1" />

            {/* Text Formatting */}
            <div className="flex items-center gap-0.5">
                <MenuButton 
                    onClick={() => editor.chain().focus().toggleBold().run()} 
                    isActive={editor.isActive('bold')} 
                    icon={Bold} 
                    title="Bold"
                />
                <MenuButton 
                    onClick={() => editor.chain().focus().toggleItalic().run()} 
                    isActive={editor.isActive('italic')} 
                    icon={Italic} 
                    title="Italic"
                />
                <MenuButton 
                    onClick={() => editor.chain().focus().toggleUnderline().run()} 
                    isActive={editor.isActive('underline')} 
                    icon={Underline} 
                    title="Underline"
                />
                <MenuButton 
                    onClick={() => editor.chain().focus().toggleStrike().run()} 
                    isActive={editor.isActive('strike')} 
                    icon={Strikethrough} 
                    title="Strikethrough"
                />
                <MenuButton 
                    onClick={() => editor.chain().focus().toggleHighlight().run()} 
                    isActive={editor.isActive('highlight')} 
                    icon={Highlighter} 
                    title="Highlight"
                />
            </div>

            <div className="w-px h-8 bg-border mx-1" />

            {/* Headings */}
            <div className="flex items-center gap-0.5">
                <MenuButton 
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} 
                    isActive={editor.isActive('heading', { level: 1 })} 
                    icon={Heading1} 
                    title="Heading 1"
                />
                <MenuButton 
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} 
                    isActive={editor.isActive('heading', { level: 2 })} 
                    icon={Heading2} 
                    title="Heading 2"
                />
                <MenuButton 
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} 
                    isActive={editor.isActive('heading', { level: 3 })} 
                    icon={Heading3} 
                    title="Heading 3"
                />
            </div>

            <div className="w-px h-8 bg-border mx-1" />

            {/* Lists */}
            <div className="flex items-center gap-0.5">
                <MenuButton 
                    onClick={() => editor.chain().focus().toggleBulletList().run()} 
                    isActive={editor.isActive('bulletList')} 
                    icon={List} 
                    title="Bullet List"
                />
                <MenuButton 
                    onClick={() => editor.chain().focus().toggleOrderedList().run()} 
                    isActive={editor.isActive('orderedList')} 
                    icon={ListOrdered} 
                    title="Ordered List"
                />
                <MenuButton 
                    onClick={() => editor.chain().focus().toggleBlockquote().run()} 
                    isActive={editor.isActive('blockquote')} 
                    icon={Quote} 
                    title="Quote"
                />
            </div>

            <div className="w-px h-8 bg-border mx-1" />

            {/* Alignment */}
            <div className="flex items-center gap-0.5">
                <MenuButton 
                    onClick={() => editor.chain().focus().setTextAlign('left').run()} 
                    isActive={editor.isActive({ textAlign: 'left' })} 
                    icon={AlignLeft} 
                    title="Align Left"
                />
                <MenuButton 
                    onClick={() => editor.chain().focus().setTextAlign('center').run()} 
                    isActive={editor.isActive({ textAlign: 'center' })} 
                    icon={AlignCenter} 
                    title="Align Center"
                />
                <MenuButton 
                    onClick={() => editor.chain().focus().setTextAlign('right').run()} 
                    isActive={editor.isActive({ textAlign: 'right' })} 
                    icon={AlignRight} 
                    title="Align Right"
                />
                <MenuButton 
                    onClick={() => editor.chain().focus().setTextAlign('justify').run()} 
                    isActive={editor.isActive({ textAlign: 'justify' })} 
                    icon={AlignJustify} 
                    title="Align Justify"
                />
            </div>

            <div className="w-px h-8 bg-border mx-1" />

            {/* Code & Special */}
            <div className="flex items-center gap-0.5">
                {/* Inline Code Button */}
                <MenuButton 
                    onClick={() => editor.chain().focus().toggleCode().run()} 
                    isActive={editor.isActive('code')} 
                    icon={Code} 
                    title="Inline Code"
                />
                <MenuButton 
                    onClick={() => editor.chain().focus().toggleCodeBlock().run()} 
                    isActive={editor.isActive('codeBlock')} 
                    icon={Code} 
                    title="Code Block"
                />
                <MenuButton 
                    onClick={() => editor.chain().focus().setHorizontalRule().run()} 
                    icon={Minus} 
                    title="Divider"
                />
            </div>

            <div className="w-px h-8 bg-border mx-1" />

            {/* Color Picker */}
            <div className="flex items-center gap-1 px-2">
                <Palette className="size-4 text-muted-foreground" />
                <input 
                    type="color" 
                    onInput={(e) => editor.chain().focus().setColor((e.target as HTMLInputElement).value).run()}
                    value={editor.getAttributes('textStyle').color || '#000000'}
                    className="w-6 h-6 p-0 border-none bg-transparent cursor-pointer"
                    title="Text Color"
                />
            </div>

            <div className="w-px h-8 bg-border mx-1" />

            {/* Link */}
            <Dialog open={isLinkOpen} onOpenChange={setIsLinkOpen}>
                <DialogTrigger asChild>
                    <Button type="button" variant="ghost" size="sm" className={editor.isActive('link') ? 'bg-muted' : ''}>
                        <LinkIcon className="size-4" />
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Insert Hyperlink</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleLinkSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="url">URL</Label>
                            <Input 
                                id="url"
                                placeholder="https://example.com" 
                                value={linkUrl} 
                                onChange={(e) => setLinkUrl(e.target.value)} 
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setIsLinkOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit">Add Link</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <div className="w-px h-8 bg-border mx-1" />

            {/* Media */}
            <div className="flex items-center gap-0.5">
                {/* Image */}
                <Dialog open={isImageOpen} onOpenChange={setIsImageOpen}>
                    <DialogTrigger asChild>
                        <Button type="button" variant="ghost" size="sm">
                            <ImageIcon className="size-4" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Insert Image</DialogTitle>
                        </DialogHeader>
                        <Tabs defaultValue="upload" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="upload">Upload</TabsTrigger>
                                <TabsTrigger value="url">URL</TabsTrigger>
                            </TabsList>
                            <TabsContent value="upload" className="space-y-4">
                                <Input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={(e) => handleFileUpload(e, 'image')} 
                                    disabled={isUploading}
                                />
                                {isUploading && <p className="text-sm text-muted-foreground">Uploading...</p>}
                            </TabsContent>
                            <TabsContent value="url" className="space-y-4">
                                <form onSubmit={(e) => handleUrlSubmit(e, 'image')} className="space-y-4">
                                    <Input 
                                        placeholder="https://example.com/image.jpg" 
                                        value={mediaUrl} 
                                        onChange={(e) => setMediaUrl(e.target.value)} 
                                    />
                                    <Button type="submit" className="w-full">Add Image</Button>
                                </form>
                            </TabsContent>
                        </Tabs>
                    </DialogContent>
                </Dialog>

                {/* Video */}
                <Dialog open={isVideoOpen} onOpenChange={setIsVideoOpen}>
                    <DialogTrigger asChild>
                        <Button type="button" variant="ghost" size="sm">
                            <VideoIcon className="size-4" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Insert Video</DialogTitle>
                        </DialogHeader>
                        <Tabs defaultValue="upload" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="upload">Upload</TabsTrigger>
                                <TabsTrigger value="url">URL</TabsTrigger>
                            </TabsList>
                            <TabsContent value="upload" className="space-y-4">
                                <Input 
                                    type="file" 
                                    accept="video/mp4,video/webm,video/ogg" 
                                    onChange={(e) => handleFileUpload(e, 'video')} 
                                    disabled={isUploading}
                                />
                                {isUploading && <p className="text-sm text-muted-foreground">Uploading...</p>}
                            </TabsContent>
                            <TabsContent value="url" className="space-y-4">
                                <form onSubmit={(e) => handleUrlSubmit(e, 'video')} className="space-y-4">
                                    <Input 
                                        placeholder="https://example.com/video.mp4" 
                                        value={mediaUrl} 
                                        onChange={(e) => setMediaUrl(e.target.value)} 
                                    />
                                    <Button type="submit" className="w-full">Add Video</Button>
                                </form>
                            </TabsContent>
                        </Tabs>
                    </DialogContent>
                </Dialog>

                {/* Audio */}
                <Dialog open={isAudioOpen} onOpenChange={setIsAudioOpen}>
                    <DialogTrigger asChild>
                        <Button type="button" variant="ghost" size="sm">
                            <Mic className="size-4" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Insert Audio</DialogTitle>
                        </DialogHeader>
                        <Tabs defaultValue="upload" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="upload">Upload</TabsTrigger>
                                <TabsTrigger value="url">URL</TabsTrigger>
                            </TabsList>
                            <TabsContent value="upload" className="space-y-4">
                                <Input 
                                    type="file" 
                                    accept="audio/mpeg,audio/wav,audio/ogg,audio/mp3" 
                                    onChange={(e) => handleFileUpload(e, 'audio')} 
                                    disabled={isUploading}
                                />
                                {isUploading && <p className="text-sm text-muted-foreground">Uploading...</p>}
                            </TabsContent>
                            <TabsContent value="url" className="space-y-4">
                                <form onSubmit={(e) => handleUrlSubmit(e, 'audio')} className="space-y-4">
                                    <Input 
                                        placeholder="https://example.com/audio.mp3" 
                                        value={mediaUrl} 
                                        onChange={(e) => setMediaUrl(e.target.value)} 
                                    />
                                    <Button type="submit" className="w-full">Add Audio</Button>
                                </form>
                            </TabsContent>
                        </Tabs>
                    </DialogContent>
                </Dialog>

                {/* YouTube */}
                <Dialog open={isYoutubeOpen} onOpenChange={setIsYoutubeOpen}>
                    <DialogTrigger asChild>
                        <Button type="button" variant="ghost" size="sm">
                            <Youtube className="size-4" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Embed YouTube Video</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={(e) => handleUrlSubmit(e, 'youtube')} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="youtube-url">YouTube URL</Label>
                                <Input 
                                    id="youtube-url"
                                    placeholder="https://youtube.com/watch?v=..." 
                                    value={mediaUrl} 
                                    onChange={(e) => setMediaUrl(e.target.value)} 
                                />
                            </div>
                            <Button type="submit" className="w-full">Embed Video</Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
