"use client"

/**
 * PostContent
 * -----------
 * Renders saved Tiptap HTML with stable DOM — never uses dangerouslySetInnerHTML
 * so React never wipes the hljs-enhanced nodes on re-render.
 *
 * Features:
 * - Strict HTML Sanitization (Blocks CSS injection and Scripts)
 * - Syntax-highlighted fenced code blocks
 * - Styled inline <code> pills with hljs colouring
 * - Proper h1 / h2 / h3 / prose typography via Tailwind prose classes
 * - Copy buttons that survive re-renders
 */

import { useEffect, useRef, useState } from 'react'
import hljs from 'highlight.js'
import DOMPurify from 'isomorphic-dompurify';
import React from 'react';
import { useTheme } from 'next-themes';

interface PostContentProps {
    html: string
    className?: string
}

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
        wrapper.className = 'my-6 rounded-xl border border-border overflow-hidden shadow-sm not-prose'

        // Header
        const header = document.createElement('div')
        header.className = 'flex items-center justify-between px-4 py-2 bg-muted border-b border-border'

        const left = document.createElement('div')
        left.innerHTML = `<span class="text-xs font-mono text-muted-foreground uppercase tracking-wider font-semibold">${lang}</span>`

        // Copy button
        const copyBtn = document.createElement('button')
        copyBtn.type = 'button'
        copyBtn.className = 'flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors'
        const setCopyDefault = () => { copyBtn.innerHTML = `${COPY_ICON}<span>Copy</span>` }
        setCopyDefault()
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(raw)
            copyBtn.innerHTML = `${CHECK_ICON}<span class="text-green-500">Copied!</span>`
            setTimeout(setCopyDefault, 2000)
        })

        header.appendChild(left)
        header.appendChild(copyBtn)

        // Code area
        const codeArea = document.createElement('div')
        codeArea.className = 'bg-background'
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

        code.className = 'bg-muted text-foreground border border-border rounded px-1.5 py-0.5 text-[0.875em] font-mono whitespace-nowrap'
    })

    // ── Internal Links ────────────────────────────────────────────────────────
    container.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) => {
        a.removeAttribute('target')
        a.onclick = (e) => {
            e.preventDefault()
            const targetId = a.getAttribute('href')?.slice(1)
            if (targetId) {
                document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' })
                history.pushState(null, "", `#${targetId}`)
            }
        }
    })

    // ── Headings IDs for Table of Contents ────────────────────────────────────
    container.querySelectorAll<HTMLElement>('h1, h2, h3').forEach((heading) => {
        if (!heading.id && heading.textContent) {
            heading.id = heading.textContent
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)+/g, '');
        }
    })
}

export function PostContent({ html, className = '' }: PostContentProps) {
    const ref = useRef<HTMLDivElement>(null)
    const lastHtml = useRef<string>('')
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);
    const { theme, systemTheme } = useTheme();
    
    const currentTheme = theme === "system" ? systemTheme : theme;
    const isDark = currentTheme === "dark";

    useEffect(() => {
        const container = ref.current
        if (!container) return

        if (html !== lastHtml.current) {
            // STRICT SANITIZATION APPLIED HERE
            // This happens before the HTML touches the DOM
            const sanitizedHtml = DOMPurify.sanitize(html, {
                ALLOWED_TAGS: [
                    'p', 'b', 'i', 'em', 'strong', 'a', 
                    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                    'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'br', 'hr', 'img',
                    'u', 'mark', 'video', 'audio', 'source', 'iframe'
                ],
                // We MUST allow 'class' so Tiptap's language-xx classes survive for hljs
                // 'style' is allowed to support text alignment and color.
                ALLOWED_ATTR: [
                    'href', 'src', 'alt', 'title', 'target', 'class', 
                    'style', 'id', 'allowfullscreen', 'frameborder', 
                    'controls', 'type'
                ], 
                ALLOW_DATA_ATTR: false, // Prevents any smuggled dataset payloads
            });

            container.innerHTML = sanitizedHtml;
            lastHtml.current = html;
        }

            // Always re-run enhancement
            enhanceContainer(container)

            // Setup lightbox listeners for images
            container.querySelectorAll('img').forEach((img) => {
                img.style.cursor = 'zoom-in';
                img.onclick = () => setLightboxImage(img.src);
            });
    }, [html])

    return (
        <>
            <link 
                rel="stylesheet" 
                href={isDark 
                    ? "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css" 
                    : "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css"
                } 
            />
            <div
                ref={ref}
                className={[
                    'prose prose-xl dark:prose-invert max-w-none font-sans tracking-tight text-zinc-900 dark:text-zinc-100',
                    '[&_h1]:text-6xl [&_h1]:font-extrabold [&_h1]:tracking-tighter [&_h1]:mt-8 [&_h1]:mb-4 [&_h1]:font-sans [&_h1]:text-zinc-950 dark:[&_h1]:text-white',
                    '[&_h2]:text-5xl [&_h2]:font-bold [&_h2]:tracking-tighter [&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:font-sans [&_h2]:text-zinc-950 dark:[&_h2]:text-white',
                    '[&_h3]:text-4xl [&_h3]:font-semibold [&_h3]:mt-5 [&_h3]:mb-2 [&_h3]:font-sans [&_h3]:text-zinc-900 dark:[&_h3]:text-zinc-100',
                    '[&_p]:leading-relaxed [&_p]:my-3',
                    '[&_blockquote]:border-l-4 [&_blockquote]:border-zinc-400 [&_blockquote]:pl-4 [&_blockquote]:italic',
                    '[&_a]:text-blue-500 [&_a]:underline [&_a]:underline-offset-2',
                    '[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2 [&_li]:my-0 [&_li>p]:my-0',
                    '[&_img]:rounded-lg [&_img]:border [&_img]:border-muted [&_img]:mx-auto [&_img]:block [&_img]:my-8 [&_img]:max-h-[500px] [&_img]:object-contain',
                    '[&_.not-prose]:!mt-8',
                    className,
                ].join(' ')}
            />
            
            {/* Lightbox Overlay */}
            {lightboxImage && (
                <div 
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 cursor-zoom-out animate-in fade-in duration-200"
                    onClick={() => setLightboxImage(null)}
                >
                    <img 
                        src={lightboxImage} 
                        className="max-w-full max-h-full object-contain rounded-md" 
                        alt="Fullscreen view" 
                    />
                </div>
            )}
        </>
    )
}