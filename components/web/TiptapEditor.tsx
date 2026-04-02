"use client"

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Youtube from '@tiptap/extension-youtube'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import Color from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import Underline from '@tiptap/extension-underline'
import Highlight from '@tiptap/extension-highlight'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect, useRef, useState } from 'react'
import { EditorStatsBar } from './EditorStatsBar'
import { EditorMenuBar } from './EditorMenuBar'
import { Button } from '@/components/ui/button'
import { FileCode2, Type } from 'lucide-react'
import { ReactNodeViewRenderer } from '@tiptap/react'
import CodeBlockComponent from './CodeBlockComponent'
import { VideoNode, AudioNode } from './media-extensions'
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'

const lowlight = createLowlight(common)

interface TiptapEditorProps {
    content: string
    onChange: (html: string) => void
}

export default function TiptapEditor({ content, onChange }: TiptapEditorProps) {
    // Only render EditorContent after hydration — prevents the flushSync error
    // that occurs when Tiptap calls flushSync during React's render/hydration phase
    const [isMounted, setIsMounted] = useState(false)
    const [isSourceMode, setIsSourceMode] = useState(false)
    const [sourceHtml, setSourceHtml] = useState('')
    const initialised = useRef(false)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({ codeBlock: false }),
            TextStyle,
            Color,
            Underline,
            Highlight.configure({ multicolor: true }),
            Link.configure({ openOnClick: false, autolink: true, linkOnPaste: true }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
                alignments: ['left', 'center', 'right', 'justify'],
            }),
            Image.configure({
                allowBase64: true,
                HTMLAttributes: { class: 'rounded-lg border border-muted' },
            }),
            Youtube.configure({ width: 640, height: 480 }),
            Placeholder.configure({
                placeholder: 'Start writing...',
                emptyEditorClass: 'is-editor-empty',
            }),
            CodeBlockLowlight.extend({
                addNodeView() {
                    return ReactNodeViewRenderer(CodeBlockComponent)
                },
            }).configure({
                lowlight,
                defaultLanguage: 'text',
                languageClassPrefix: 'language-',
            }),
            VideoNode,
            AudioNode,
        ],
        content: '',
        onUpdate: ({ editor }) => {
            if (!isSourceMode) {
                onChange(editor.getHTML())
            }
        },
        editorProps: {
            attributes: {
                class: 'prose dark:prose-invert prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none min-h-[500px] max-w-none p-4 cursor-text',
            },
        },
    })

    // Set initial content once after mount
    useEffect(() => {
        if (!editor || !isMounted) return
        if (!initialised.current && content) {
            editor.commands.setContent(content)
            initialised.current = true
        }
    }, [editor, content, isMounted])

    const toggleMode = () => {
        if (!editor) return
        if (isSourceMode) {
            editor.commands.setContent(sourceHtml)
            onChange(editor.getHTML())
            setIsSourceMode(false)
        } else {
            setSourceHtml(editor.getHTML())
            setIsSourceMode(true)
        }
    }

    const handleSourceChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const html = e.target.value
        setSourceHtml(html)
        editor?.commands.setContent(html)
        onChange(html)
    }

    const insertAtCursor = (snippet: string) => {
        const ta = document.getElementById('html-source-textarea') as HTMLTextAreaElement | null
        if (!ta) return
        const start = ta.selectionStart
        const updated = sourceHtml.slice(0, start) + snippet + sourceHtml.slice(ta.selectionEnd)
        setSourceHtml(updated)
        editor?.commands.setContent(updated)
        onChange(updated)
        requestAnimationFrame(() => {
            ta.selectionStart = ta.selectionEnd = start + snippet.length
            ta.focus()
        })
    }

    // Skeleton until mounted — prevents flushSync / hydration mismatch
    if (!isMounted || !editor) {
        return <div className="min-h-[500px] border rounded-xl bg-muted/10 animate-pulse" />
    }

    return (
        <div className="flex flex-col w-full min-h-[500px] border rounded-xl bg-background shadow-sm overflow-hidden">
            <EditorStatsBar editor={editor} />

            <div className="flex justify-between items-center border-b px-4 py-2 bg-muted/30">
                <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    {isSourceMode ? 'HTML Source' : 'Visual Editor'}
                </span>
                <Button
                    type="button"
                    variant={isSourceMode ? 'default' : 'outline'}
                    size="sm"
                    onClick={toggleMode}
                    className="transition-all"
                >
                    {isSourceMode
                        ? <><Type className="size-4 mr-2" />Switch to Rich Text</>
                        : <><FileCode2 className="size-4 mr-2" />View HTML Source</>
                    }
                </Button>
            </div>

            {!isSourceMode && <EditorMenuBar editor={editor} />}

            {isSourceMode && (
                <div className="flex flex-wrap gap-1 p-2 border-b bg-zinc-900 text-zinc-300">
                    {[
                        { label: 'Image', snippet: '<img src="URL" alt="description" class="rounded-lg border border-muted" />' },
                        { label: 'Video', snippet: '<video src="URL" controls class="rounded-lg w-full my-4"></video>' },
                        { label: 'Audio', snippet: '<audio src="URL" controls class="w-full my-4"></audio>' },
                        { label: 'Link', snippet: '<a href="URL">link text</a>' },
                        { label: 'Code Block', snippet: '<pre><code class="language-javascript">// code here\n</code></pre>' },
                    ].map(({ label, snippet }) => (
                        <button
                            key={label}
                            type="button"
                            onClick={() => insertAtCursor(snippet)}
                            className="text-xs px-2 py-1 rounded bg-zinc-700 hover:bg-zinc-600 transition-colors font-mono"
                        >
                            {label}
                        </button>
                    ))}
                    <span className="ml-auto text-xs text-zinc-500 self-center pr-1">
                        Raw HTML — syncs to visual editor on toggle
                    </span>
                </div>
            )}

            <div className="flex-1 relative">
                {isSourceMode ? (
                    <textarea
                        id="html-source-textarea"
                        value={sourceHtml}
                        onChange={handleSourceChange}
                        className="absolute inset-0 w-full h-full p-6 bg-zinc-950 text-zinc-50 font-mono text-sm leading-relaxed resize-none focus:outline-none"
                        placeholder="<!-- Write raw HTML here... -->"
                        spellCheck={false}
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