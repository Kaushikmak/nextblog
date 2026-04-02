"use client"

/**
 * TiptapEditor.tsx
 * ----------------
 * This file is a thin dynamic-import wrapper.
 * The actual editor lives in TiptapEditorInner.tsx and is loaded
 * with ssr:false so useEditor / flushSync never runs during SSR or hydration.
 */

import dynamic from 'next/dynamic'

export interface TiptapEditorProps {
    content: string
    onChange: (html: string) => void
}

const TiptapEditorInner = dynamic(
    () => import('./Tiptapeditorinner'),
    {
        ssr: false,
        loading: () => (
            <div className="flex flex-col w-full min-h-[500px] border rounded-xl bg-muted/10 animate-pulse p-4">
                <div className="h-10 bg-muted rounded-md mb-4 w-full" />
                <div className="flex-1 bg-muted rounded-md w-full" />
            </div>
        ),
    }
)

export default function TiptapEditor(props: TiptapEditorProps) {
    return <TiptapEditorInner {...props} />
}