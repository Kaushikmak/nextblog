"use client"

/**
 * TiptapEditorInner.tsx
 * ----------------------
 * The real editor — only ever loaded client-side via TiptapEditor.tsx's dynamic import.
 * Because this file is never executed during SSR, useEditor and Tiptap's internal
 * flushSync calls are completely isolated from the React hydration cycle.
 */

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import ImageExt from '@tiptap/extension-image'
import Youtube from '@tiptap/extension-youtube'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import Color from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import Underline from '@tiptap/extension-underline'
import Highlight from '@tiptap/extension-highlight'
import Placeholder from '@tiptap/extension-placeholder'
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { common, createLowlight } from 'lowlight'
import hljs from 'highlight.js/lib/core'
import xml from 'highlight.js/lib/languages/xml'
import { useEffect, useRef, useState } from 'react'
import { Extension } from '@tiptap/core'

hljs.registerLanguage('html', xml);
import { EditorStatsBar } from './EditorStatsBar'
import { EditorMenuBar } from './EditorMenuBar'
import CodeBlockComponent from './CodeBlockComponent'
import { VideoNode, AudioNode } from './media-extensions'
import { Button } from '@/components/ui/button'
import { FileCode2, Type } from 'lucide-react'
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { toast } from 'sonner'

// Define and export the interface here as the single source of truth
export interface TiptapEditorProps {
    content: string
    onChange: (html: string) => void
}

const TabExtension = Extension.create({
    name: 'tabExtension',
    addKeyboardShortcuts() {
        return {
            Tab: () => {
                // Return false to allow default indentation behavior inside lists
                if (
                    this.editor.isActive('bulletList') || 
                    this.editor.isActive('orderedList') || 
                    this.editor.isActive('listItem')
                ) {
                    return false; 
                }
                // Insert 4 spaces and stop event propagation
                return this.editor.commands.insertContent('    ');
            },
        };
    },
});

const lowlight = createLowlight(common)

function formatHTML(html: string) {
    let formatted = '';
    let indent = '';
    const tab = '  ';
    html.split(/(<\/?[^>]+>)/).forEach(function(node) {
        if (node.trim() === '') return;
        const isClosing = node.match(/^<\//);
        const isSelfClosing = node.match(/<.*\/>/) || node.match(/<(img|br|hr|input|meta|link)/);
        const isOpening = node.match(/^<[^>]+>$/) && !isClosing && !isSelfClosing;

        if (isClosing) {
            indent = indent.substring(tab.length);
        }
        
        formatted += indent + node + '\n';
        
        if (isOpening) {
            indent += tab;
        }
    });
    return formatted.trim();
}

export default function TiptapEditorInner({ content, onChange }: TiptapEditorProps) {
    const [isSourceMode, setIsSourceMode] = useState(false)
    const [sourceHtml, setSourceHtml] = useState('')
    const initialised = useRef(false)

    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const generateUploadUrl = useMutation(api.posts.getImageUploadURL);
    const getMediaUrl = useMutation(api.posts.getMediaUrl);

    const uploadFile = async (file: File) => {
        try {
            const toastId = toast.loading('Uploading image...');
            const postUrl = await generateUploadUrl();
            const result = await fetch(postUrl, {
                method: "POST",
                headers: { "Content-Type": file.type },
                body: file,
            });
            if (!result.ok) {
                toast.dismiss(toastId);
                throw new Error("Failed to upload");
            }
            const { storageId } = await result.json();
            const url = await getMediaUrl({ storageId });
            if (!url) {
                toast.dismiss(toastId);
                throw new Error("URL is null");
            }
            toast.success('Image uploaded successfully!', { id: toastId });
            return url;
        } catch (e) {
            toast.error('Failed to upload image');
            console.error(e);
            return null;
        }
    };

    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            TabExtension, // Inject here
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
            ImageExt.configure({
                allowBase64: false, // Explicitly disable to force direct URL uploads
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
            initialised.current = true;
            if (!isSourceMode) {
                onChange(editor.getHTML());
            }
        },
        onBlur: ({ editor }) => {
            if (!isSourceMode) {
                onChange(editor.getHTML());
            }
        },
        editorProps: {
            attributes: {
                class: 'prose dark:prose-invert prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none min-h-full max-w-none p-6 cursor-text',
            },
            handleDrop: (view, event, slice, moved) => {
                if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
                    const file = event.dataTransfer.files[0];
                    if (file.type.startsWith('image/')) {
                        event.preventDefault();
                        const { schema } = view.state;
                        const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
                        
                        uploadFile(file).then(url => {
                            if (url && coordinates) {
                                const node = schema.nodes.image.create({ src: url });
                                const transaction = view.state.tr.insert(coordinates.pos, node);
                                view.dispatch(transaction);
                            }
                        });
                        return true;
                    }
                }
                return false;
            },
            handlePaste: (view, event, slice) => {
                if (event.clipboardData && event.clipboardData.files && event.clipboardData.files[0]) {
                    const file = event.clipboardData.files[0];
                    if (file.type.startsWith('image/')) {
                        event.preventDefault();
                        const { schema } = view.state;
                        
                        uploadFile(file).then(url => {
                            if (url) {
                                const node = schema.nodes.image.create({ src: url });
                                const transaction = view.state.tr.replaceSelectionWith(node);
                                view.dispatch(transaction);
                            }
                        });
                        return true;
                    }
                }
                return false;
            }
        },
    })

    const handleTextareaTab = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
        e.preventDefault();
        const target = e.target as HTMLTextAreaElement;
        const start = target.selectionStart;
        const end = target.selectionEnd;
        const value = target.value;
        const updated = value.substring(0, start) + "    " + value.substring(end);
        
        setSourceHtml(updated);
        editor?.commands.setContent(updated);
        onChange(updated);
        
        requestAnimationFrame(() => {
            target.selectionStart = target.selectionEnd = start + 4;
        });
    }
};

    // Delay hydration lock until content is truthy to resolve race conditions
    useEffect(() => {
        if (!editor || initialised.current) return
        if (content) {
            editor.commands.setContent(content)
            setSourceHtml(content) // Ensure source mode is synced on initial load
            initialised.current = true
        }
    }, [editor, content])

    const toggleMode = () => {
        if (!editor) return
        if (isSourceMode) {
            editor.commands.setContent(sourceHtml)
            onChange(editor.getHTML())
            setIsSourceMode(false)
        } else {
            setSourceHtml(formatHTML(editor.getHTML()))
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

    if (!editor) {
        return <div className="h-full w-full border rounded-xl bg-muted/10 animate-pulse" />
    }

    return (
        <div className="flex flex-col w-full h-full bg-background relative">
            <div className="shrink-0">
                <EditorStatsBar editor={editor} />
            </div>

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
                        { label: 'Image',      snippet: '<img src="URL" alt="description" class="rounded-lg border border-muted" />' },
                        { label: 'Video',      snippet: '<video src="URL" controls class="rounded-lg w-full my-4"></video>' },
                        { label: 'Audio',      snippet: '<audio src="URL" controls class="w-full my-4"></audio>' },
                        { label: 'Link',       snippet: '<a href="URL">link text</a>' },
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

            <div className="flex-1 relative overflow-y-auto bg-background" id="editor-scroll-container">
                {isSourceMode ? (
                    <div className="relative min-h-full bg-zinc-950">
                        <textarea
                            id="html-source-textarea"
                            value={sourceHtml}
                            onChange={handleSourceChange}
                            onKeyDown={handleTextareaTab}
                            className="absolute top-0 left-0 w-full h-full p-6 text-transparent caret-white font-mono text-sm leading-relaxed resize-none focus:outline-none bg-transparent z-10 overflow-hidden"
                            placeholder=""
                            spellCheck={false}
                        />
                        <pre className="relative w-full min-h-full p-6 pointer-events-none z-0 m-0 bg-transparent" aria-hidden="true">
                            <code 
                                className="hljs language-html font-mono text-sm leading-relaxed whitespace-pre-wrap break-words block"
                                dangerouslySetInnerHTML={{ __html: hljs.highlight(sourceHtml || ' ', { language: 'html' }).value }}
                            />
                        </pre>
                    </div>
                ) : (
                    <div className="min-h-full">
                        <EditorContent editor={editor} className="min-h-full" />
                    </div>
                )}
            </div>
        </div>
    )
}