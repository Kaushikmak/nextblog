"use client"

/**
 * PostContent
 * -----------
 * Renders saved Tiptap HTML with stable DOM — never uses dangerouslySetInnerHTML
 * so React never wipes the hljs-enhanced nodes on re-render.
 *
 * Features:
 *  - Syntax-highlighted fenced code blocks (same shell as editor CodeBlockComponent)
 *  - Styled inline <code> pills with hljs colouring
 *  - Proper h1 / h2 / h3 / prose typography via Tailwind prose classes
 *  - Copy buttons that survive re-renders
 */

import { useEffect, useRef } from 'react'
import hljs from 'highlight.js'
// import 'highlight.js/styles/github-dark.css'

interface PostContentProps {
    html: string
    className?: string
}

// SVG icons as strings to avoid React in plain DOM nodes
const COPY_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
</svg>`

const CHECK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
    fill="none" stroke="#4ade80" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M20 6 9 17l-5-5"/>
</svg>`

function enhanceContainer(container: HTMLDivElement) {
    // ── Fenced code blocks ──────────────────────────────────────────────────
    container.querySelectorAll<HTMLElement>('pre').forEach((pre) => {
        if (pre.dataset.enhanced === 'true') return
        pre.dataset.enhanced = 'true'

        const code = pre.querySelector('code')
        if (!code) return

        const langClass = Array.from(code.classList).find((c) => c.startsWith('language-'))
        const lang = langClass ? langClass.replace('language-', '') : 'plaintext'
        const raw = code.textContent ?? ''

        // Syntax highlight
        try {
            code.innerHTML = lang !== 'plaintext' && lang !== 'text'
                ? hljs.highlight(raw, { language: lang }).value
                : hljs.highlightAuto(raw).value
        } catch {
            hljs.highlightElement(code)
        }
        code.classList.add('hljs')

        // Wrapper
        const wrapper = document.createElement('div')
        wrapper.className = 'my-6 rounded-xl border border-zinc-700 overflow-hidden shadow-sm not-prose'

        // Header
        const header = document.createElement('div')
        header.className = 'flex items-center justify-between px-4 py-2.5 bg-zinc-800 border-b border-zinc-700'

        const left = document.createElement('div')
        left.className = 'flex items-center gap-3'
        left.innerHTML = `
            <div style="display:flex;align-items:center;gap:6px">
                <div style="width:12px;height:12px;border-radius:50%;background:#ef4444"></div>
                <div style="width:12px;height:12px;border-radius:50%;background:#eab308"></div>
                <div style="width:12px;height:12px;border-radius:50%;background:#22c55e"></div>
            </div>
            <span style="font-size:12px;font-family:ui-monospace,monospace;color:#d4d4d8;
                background:#3f3f46;border:1px solid #52525b;border-radius:4px;
                padding:1px 8px;user-select:none">${lang}</span>
        `

        // Copy button
        const copyBtn = document.createElement('button')
        copyBtn.type = 'button'
        copyBtn.style.cssText = 'display:flex;align-items:center;gap:6px;font-size:12px;color:#a1a1aa;background:transparent;border:none;cursor:pointer;padding:4px 8px;border-radius:4px;transition:color 0.15s'
        const setCopyDefault = () => { copyBtn.innerHTML = `${COPY_ICON}<span>Copy</span>` }
        setCopyDefault()
        copyBtn.addEventListener('mouseenter', () => { copyBtn.style.background = '#3f3f46'; copyBtn.style.color = '#f4f4f5' })
        copyBtn.addEventListener('mouseleave', () => { copyBtn.style.background = 'transparent'; copyBtn.style.color = '#a1a1aa' })
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(raw)
            copyBtn.innerHTML = `${CHECK_ICON}<span style="color:#4ade80">Copied!</span>`
            setTimeout(setCopyDefault, 2000)
        })

        header.appendChild(left)
        header.appendChild(copyBtn)

        // Code area
        const codeArea = document.createElement('div')
        codeArea.style.background = '#09090b'
        pre.style.cssText = 'margin:0;padding:16px;overflow-x:auto;font-size:14px;font-family:ui-monospace,monospace;line-height:1.6;background:transparent'

        pre.parentNode?.insertBefore(wrapper, pre)
        wrapper.appendChild(header)
        codeArea.appendChild(pre)
        wrapper.appendChild(codeArea)
    })

    // ── Inline code (not inside pre) ────────────────────────────────────────
    container.querySelectorAll<HTMLElement>('code').forEach((code) => {
        if (code.parentElement?.tagName === 'PRE') return
        if (code.dataset.enhanced === 'true') return
        code.dataset.enhanced = 'true'

        // Highlight inline code with hljs auto-detect
        const raw = code.textContent ?? ''
        try {
            code.innerHTML = hljs.highlightAuto(raw).value
        } catch { /* leave as-is */ }

        code.style.cssText = [
            'display:inline',
            'background:#1e1e2e',
            'color:#cdd6f4',
            'border:1px solid #313244',
            'border-radius:4px',
            'padding:1px 6px',
            'font-size:0.875em',
            'font-family:ui-monospace,SFMono-Regular,Menlo,monospace',
            'white-space:nowrap',
        ].join(';')
    })
}

export function PostContent({ html, className = '' }: PostContentProps) {
    const ref = useRef<HTMLDivElement>(null)
    // Track the last html we injected so we only reset innerHTML when content actually changes
    const lastHtml = useRef<string>('')

    useEffect(() => {
        const container = ref.current
        if (!container) return

        if (html !== lastHtml.current) {
            // Only reset innerHTML when the HTML string actually changes.
            // This prevents React re-renders (e.g. parent state updates) from wiping
            // the enhanced DOM nodes when the content hasn't changed.
            container.innerHTML = html
            lastHtml.current = html
        }

        // Always re-run enhancement — it's idempotent thanks to data-enhanced guards
        enhanceContainer(container)
    })
    // No dep array — runs after every render, but innerHTML only resets on actual html changes.
    // This ensures newly typed content (new pre/code nodes) is always enhanced promptly.

    return (
        <div
            ref={ref}
            className={[
                'prose dark:prose-invert max-w-none',
                // Headings — explicit sizes so they're never collapsed by prose reset
                '[&_h1]:text-4xl [&_h1]:font-extrabold [&_h1]:tracking-tight [&_h1]:mt-8 [&_h1]:mb-4',
                '[&_h2]:text-3xl [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:mt-8 [&_h2]:mb-3',
                '[&_h3]:text-2xl [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-2',
                // Paragraphs
                '[&_p]:leading-7 [&_p]:my-4',
                // Blockquote
                '[&_blockquote]:border-l-4 [&_blockquote]:border-zinc-400 [&_blockquote]:pl-4 [&_blockquote]:italic',
                // Links
                '[&_a]:text-blue-500 [&_a]:underline [&_a]:underline-offset-2',
                // Lists
                '[&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6',
                // Images
                '[&_img]:rounded-lg [&_img]:border [&_img]:border-muted',
                // Suppress prose overriding our code block wrapper background
                '[&_.not-prose]:!mt-6',
                className,
            ].join(' ')}
        />
        // Note: NO dangerouslySetInnerHTML here — content is set via ref.current.innerHTML
        // in the effect above. This prevents React from ever diffing/replacing the
        // hljs-enhanced DOM nodes.
    )
}