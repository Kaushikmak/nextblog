"use client"

import { Editor } from '@tiptap/react'
import { FileText, Hash, Image as ImageIcon, Video, Clock } from 'lucide-react'

export function EditorStatsBar({ editor }: { editor: Editor | null }) {
    if (!editor) return null;

    const stats = {
        words: editor.storage.characterCount?.words() || editor.getText().split(/\s+/).filter(Boolean).length,
        paragraphs: editor.getJSON().content?.filter(node => node.type === 'paragraph').length || 0,
        media: editor.getJSON().content?.filter(node => ['image', 'youtube'].includes(node.type || '')).length || 0,
        readTime: Math.ceil((editor.storage.characterCount?.words() || 0) / 225) || 1
    };

    return (
        <div className="flex flex-wrap items-center gap-6 p-3 mb-4 border rounded-lg bg-muted/30 text-sm font-medium">
            <div className="flex items-center gap-2">
                <Hash className="size-4 text-primary" />
                <span>{stats.words} Words</span>
            </div>
            <div className="flex items-center gap-2">
                <FileText className="size-4 text-primary" />
                <span>{stats.paragraphs} Paragraphs</span>
            </div>
            <div className="flex items-center gap-2">
                <ImageIcon className="size-4 text-primary" />
                <span>{stats.media} Media Items</span>
            </div>
            <div className="flex items-center gap-2">
                <Clock className="size-4 text-primary" />
                <span>~{stats.readTime} min read</span>
            </div>
        </div>
    );
}