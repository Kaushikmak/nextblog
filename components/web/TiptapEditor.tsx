"use client"

import { useEditor, EditorContent } from '@tiptap/react'
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
import { useEffect, useState } from 'react'
import { EditorStatsBar } from './EditorStatsBar'
import { EditorMenuBar } from './EditorMenuBar'
import { Button } from '@/components/ui/button'
import { FileCode2, Type } from 'lucide-react'

const lowlight = createLowlight(common)

interface TiptapEditorProps {
    content: string;
    onChange: (html: string) => void;
}

export default function TiptapEditor({ content, onChange }: TiptapEditorProps) {
    const [isMarkdownMode, setIsMarkdownMode] = useState(false);
    const [markdownText, setMarkdownText] = useState("");

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                codeBlock: false, 
            }),
            Markdown,
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
                allowBase64: true,
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
            // Only update parent if we are in Rich Text Mode
            // Markdown mode handles updates manually to prevent cursor jumps
            if (!isMarkdownMode) {
                onChange(editor.getHTML());
            }
        },
        editorProps: {
            attributes: {
                class: 'prose dark:prose-invert prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none min-h-[500px] max-w-none p-4 cursor-text',
            },
        },
    });

    // Sync external changes (like resets) to the editor, but only if not typing in Markdown mode
    useEffect(() => {
        if (editor && !isMarkdownMode && content !== editor.getHTML()) {
            editor.commands.setContent(content);
        }
    }, [content, editor, isMarkdownMode]);

    if (!editor) {
        return <div className="min-h-[500px] border rounded-xl bg-muted/10 animate-pulse" />;
    }

    const toggleMode = () => {
        if (isMarkdownMode) {
            // Switching TO Rich Text Mode
            editor.commands.setContent(markdownText);
            onChange(editor.getHTML());
            setIsMarkdownMode(false);
        } else {
            // Switching TO Markdown Mode
            // 1. Cast the entire storage object to allow any string key
            const storage = editor.storage as Record<string, any>;
            
            // 2. Now safely access markdown
            const md = storage.markdown.getMarkdown();
            
            setMarkdownText(md);
            setIsMarkdownMode(true);
        }
    };
    
    const handleMarkdownChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newMd = e.target.value;
        setMarkdownText(newMd);
        
        // Silently update the hidden Tiptap editor to trigger the live preview
        editor.commands.setContent(newMd);
        onChange(editor.getHTML());
    };

    return (
        <div className="flex flex-col w-full min-h-[600px] border rounded-xl bg-background shadow-sm overflow-hidden">
            <EditorStatsBar editor={editor} />
            
            {/* Mode Toggle Bar */}
            <div className="flex justify-between items-center border-b px-4 py-2 bg-muted/30">
                <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    {isMarkdownMode ? "Source Editor" : "Visual Editor"}
                </span>
                <Button type="button" variant={isMarkdownMode ? "default" : "outline"} size="sm" onClick={toggleMode} className="transition-all">
                    {isMarkdownMode ? <Type className="size-4 mr-2" /> : <FileCode2 className="size-4 mr-2" />}
                    {isMarkdownMode ? "Switch to Rich Text" : "Switch to Markdown"}
                </Button>
            </div>

            {/* Formatting Toolbar (Hidden in Markdown Mode) */}
            {!isMarkdownMode && <EditorMenuBar editor={editor} />}
            
            <div className="flex-1 relative">
                {isMarkdownMode ? (
                    <textarea
                        value={markdownText}
                        onChange={handleMarkdownChange}
                        className="absolute inset-0 w-full h-full p-6 bg-zinc-950 text-zinc-50 font-mono text-sm leading-relaxed resize-none focus:outline-none"
                        placeholder="# Write your raw markdown here..."
                    />
                ) : (
                    <div className="h-full overflow-y-auto">
                        <EditorContent editor={editor} />
                    </div>
                )}
            </div>
        </div>
    )
}