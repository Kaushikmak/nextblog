"use client"

import { Editor } from '@tiptap/react'
import { FileText, Hash, Image as ImageIcon, Clock, Code } from 'lucide-react'

interface EditorStatsBarProps {
    editor: Editor | null;
}

export function EditorStatsBar({ editor }: EditorStatsBarProps) {
    if (!editor) return null;

    const json = editor.getJSON();
    const content = json.content || [];
    
    // Calculate word count
    const text = editor.getText();
    const words = text.split(/\s+/).filter(word => word.length > 0).length;
    
    // Calculate paragraph count
    const paragraphs = content.filter(node => node.type === 'paragraph').length;
    
    // Calculate media count (images, videos, youtube)
    const mediaCount = content.filter(node => 
        ['image', 'youtube', 'customVideo', 'customAudio'].includes(node.type || '')
    ).length;
    
    // Calculate code blocks
    const codeBlocks = content.filter(node => node.type === 'codeBlock').length;
    
    // Calculate read time (average 225 words per minute)
    const readTime = Math.max(1, Math.ceil(words / 225));

    return (
        <div className="flex flex-wrap items-center gap-4 p-3 border-b bg-muted/30 text-xs">
            <div className="flex items-center gap-1.5">
                <Hash className="size-3.5 text-muted-foreground" />
                <span className="font-medium">{words}</span>
                <span className="text-muted-foreground">words</span>
            </div>
            <div className="flex items-center gap-1.5">
                <FileText className="size-3.5 text-muted-foreground" />
                <span className="font-medium">{paragraphs}</span>
                <span className="text-muted-foreground">paragraphs</span>
            </div>
            <div className="flex items-center gap-1.5">
                <ImageIcon className="size-3.5 text-muted-foreground" />
                <span className="font-medium">{mediaCount}</span>
                <span className="text-muted-foreground">media</span>
            </div>
            <div className="flex items-center gap-1.5">
                <Code className="size-3.5 text-muted-foreground" />
                <span className="font-medium">{codeBlocks}</span>
                <span className="text-muted-foreground">code blocks</span>
            </div>
            <div className="flex items-center gap-1.5">
                <Clock className="size-3.5 text-muted-foreground" />
                <span className="font-medium">{readTime}</span>
                <span className="text-muted-foreground">min read</span>
            </div>
        </div>
    );
}
