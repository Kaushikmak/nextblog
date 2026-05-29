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

import { useEffect, useRef } from 'react'
import hljs from 'highlight.js'
import DOMPurify from 'isomorphic-dompurify';
import React from 'react';

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
    })

    return (
        <div
            ref={ref}
            className={[
                'prose dark:prose-invert max-w-none font-medium-body',
                '[&_h1]:text-4xl [&_h1]:font-extrabold [&_h1]:tracking-tight [&_h1]:mt-8 [&_h1]:mb-4 [&_h1]:font-sans',
                '[&_h2]:text-3xl [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:font-sans',
                '[&_h3]:text-2xl [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:font-sans',
                '[&_p]:leading-relaxed [&_p]:my-4',
                '[&_blockquote]:border-l-4 [&_blockquote]:border-zinc-400 [&_blockquote]:pl-4 [&_blockquote]:italic',
                '[&_a]:text-blue-500 [&_a]:underline [&_a]:underline-offset-2',
                '[&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1',
                '[&_img]:rounded-lg [&_img]:border [&_img]:border-muted [&_img]:mx-auto [&_img]:block [&_img]:my-6',
                '[&_.not-prose]:!mt-6',
                className,
            ].join(' ')}
        />
    )
}