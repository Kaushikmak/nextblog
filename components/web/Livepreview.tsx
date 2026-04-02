"use client"

import { useEffect, useRef } from 'react'
import hljs from 'highlight.js'
import { Check, Copy } from 'lucide-react'
import { useState } from 'react'

interface LivePreviewProps {
    html: string
}

function CopyButton({ getText }: { getText: () => string }) {
    const [copied, setCopied] = useState(false)
    return (
        <button
            onClick={() => {
                navigator.clipboard.writeText(getText())
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
            }}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-100 transition-colors px-2 py-1 rounded hover:bg-zinc-700"
        >
            {copied
                ? <><Check className="size-3.5 text-green-400" /><span className="text-green-400">Copied!</span></>
                : <><Copy className="size-3.5" /><span>Copy</span></>
            }
        </button>
    )
}

export function LivePreview({ html }: LivePreviewProps) {
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const container = containerRef.current
        if (!container || !html) return

        // Find all code blocks and upgrade them to styled terminal blocks
        const codeEls = container.querySelectorAll<HTMLElement>('pre code')

        codeEls.forEach((codeEl) => {
            const pre = codeEl.parentElement as HTMLElement
            // Avoid double-processing
            if (pre.parentElement?.classList.contains('preview-code-block')) return

            // Detect language from class
            const langClass = Array.from(codeEl.classList).find(c => c.startsWith('language-'))
            const lang = langClass ? langClass.replace('language-', '') : 'text'

            // Run highlight.js
            if (lang && lang !== 'text') {
                try {
                    codeEl.innerHTML = hljs.highlight(codeEl.textContent || '', { language: lang }).value
                } catch {
                    hljs.highlightElement(codeEl)
                }
            } else {
                hljs.highlightElement(codeEl)
            }
            codeEl.classList.add('hljs')

            // Build the wrapper shell matching the editor's CodeBlockComponent
            const wrapper = document.createElement('div')
            wrapper.className = 'preview-code-block my-6 rounded-xl border border-zinc-700 overflow-hidden shadow-sm not-prose'

            // Header
            const header = document.createElement('div')
            header.className = 'flex items-center justify-between px-4 py-2.5 bg-zinc-800 border-b border-zinc-700'

            // Window dots + language label
            const left = document.createElement('div')
            left.className = 'flex items-center gap-3'
            left.innerHTML = `
                <div class="flex items-center gap-1.5">
                    <div class="w-3 h-3 rounded-full bg-red-500"></div>
                    <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div class="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <span class="text-xs font-mono text-zinc-300 bg-zinc-700 border border-zinc-600 rounded px-2 py-1">${lang}</span>
            `

            // Copy button placeholder (we'll mount a React root into it)
            const copySlot = document.createElement('div')
            copySlot.className = 'preview-copy-slot'

            header.appendChild(left)
            header.appendChild(copySlot)

            // Code area
            const codeArea = document.createElement('div')
            codeArea.className = 'bg-zinc-950'
            pre.className = 'p-4 overflow-x-auto text-sm font-mono leading-relaxed m-0'

            // Rearrange DOM
            pre.parentNode?.insertBefore(wrapper, pre)
            wrapper.appendChild(header)
            wrapper.appendChild(codeArea)
            codeArea.appendChild(pre)

            // Native copy button (no React portal needed)
            const copyBtn = document.createElement('button')
            copyBtn.className = 'flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-100 transition-colors px-2 py-1 rounded hover:bg-zinc-700'
            copyBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg><span>Copy</span>`
            copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(codeEl.textContent || '')
                copyBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="size-3.5 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg><span class="text-green-400">Copied!</span>`
                setTimeout(() => {
                    copyBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg><span>Copy</span>`
                }, 2000)
            })
            copySlot.appendChild(copyBtn)
        })
    }, [html])

    return (
        <div
            ref={containerRef}
            className="prose dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: html }}
        />
    )
}