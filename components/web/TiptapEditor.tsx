"use client"

import { useEditor, EditorContent, ReactNodeViewRenderer } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Youtube from '@tiptap/extension-youtube'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import Color from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import FontFamily from '@tiptap/extension-font-family'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'
import { Markdown } from 'tiptap-markdown'
import { useEffect } from 'react'
import { EditorStatsBar } from './EditorStatsBar'
import { EditorMenuBar } from './EditorMenuBar'

const lowlight = createLowlight(common)

interface TiptapEditorProps {
    content: string;
    onChange: (html: string) => void;
}

export default function TiptapEditor({ content, onChange }: TiptapEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                // Disable default code block to use lowlight for syntax highlighting
                codeBlock: false, 
            }),
            Markdown, // Enables markdown shortcuts like # for H1
            TextStyle,
            FontFamily,
            Color,
            Link.configure({
                openOnClick: false,
                autolink: true,
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            Image.configure({
                allowBase64: true, // For GIFs and quick inserts
                HTMLAttributes: {
                    class: 'rounded-lg border border-muted',
                },
            }),
            Youtube.configure({
                width: 640,
                height: 480,
            }),
            CodeBlockLowlight.configure({
                lowlight,
            }),
        ],
        content: content,
        immediatelyRender: false,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose dark:prose-invert prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none min-h-[500px] max-w-none p-4 cursor-text',
            },
        },
    });

    // 1. Hook declared FIRST: Sync external changes (like resets) to the editor
    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            editor.commands.setContent(content);
        }
    }, [content, editor]);

    // 2. Early return declared AFTER all hooks
    if (!editor) {
        return <div className="min-h-[500px] border rounded-xl bg-muted/10 animate-pulse" />;
    }

    // 3. Main render logic
    return (
        <div className="flex flex-col w-full min-h-[600px] border rounded-xl bg-background shadow-sm">
            <EditorStatsBar editor={editor} />
            <EditorMenuBar editor={editor} />
            <div className="flex-1 overflow-y-auto">
                <EditorContent editor={editor} />
            </div>
        </div>
    )
}