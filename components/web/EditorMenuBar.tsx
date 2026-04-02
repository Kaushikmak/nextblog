"use client"

import { Editor } from '@tiptap/react'
import { 
    Bold, Italic, Code, List, ListOrdered, Quote, 
    Type, Image as ImageIcon, Youtube, Link as LinkIcon,
    AlignCenter, AlignLeft, AlignRight, Minus, Palette
} from 'lucide-react'
import { Button } from "@/components/ui/button"

export function EditorMenuBar({ editor }: { editor: Editor | null }) {
    if (!editor) return null;

    const addImage = () => {
        const url = window.prompt('Enter Image URL (or GIF URL)')
        if (url) editor.chain().focus().setImage({ src: url }).run()
    }

    const addYoutube = () => {
        const url = window.prompt('Enter YouTube URL')
        if (url) editor.chain().focus().setYoutubeVideo({ src: url }).run()
    }

    const setLink = () => {
        const url = window.prompt('Enter URL')
        if (url) editor.chain().focus().setLink({ href: url }).run()
    }

    return (
        <div className="flex flex-wrap gap-1 p-2 border-b bg-background sticky top-0 z-10">
            {/* ADDED type="button" TO ALL BUTTONS */}
            
            {/* Text Formatting */}
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

            {/* Special Features */}
            <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
                <Code className="size-4" />
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={addImage}>
                <ImageIcon className="size-4" />
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={addYoutube}>
                <Youtube className="size-4" />
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={setLink}>
                <LinkIcon className="size-4" />
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
                <Minus className="size-4" />
            </Button>
        </div>
    )
}