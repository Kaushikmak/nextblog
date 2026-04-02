import { NodeViewContent, NodeViewWrapper } from '@tiptap/react'
import { Check, Copy } from 'lucide-react'
import { useState } from 'react'

interface CodeBlockComponentProps {
    node: {
        attrs: {
            language?: string;
        };
        textContent: string;
    };
    updateAttributes: (attrs: { language: string }) => void;
}

const LANGUAGES = [
    { value: 'text', label: 'Plain Text' },
    { value: 'javascript', label: 'JavaScript' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'html', label: 'HTML' },
    { value: 'css', label: 'CSS' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'cpp', label: 'C++' },
    { value: 'c', label: 'C' },
    { value: 'csharp', label: 'C#' },
    { value: 'go', label: 'Go' },
    { value: 'rust', label: 'Rust' },
    { value: 'php', label: 'PHP' },
    { value: 'ruby', label: 'Ruby' },
    { value: 'swift', label: 'Swift' },
    { value: 'kotlin', label: 'Kotlin' },
    { value: 'sql', label: 'SQL' },
    { value: 'bash', label: 'Bash' },
    { value: 'json', label: 'JSON' },
    { value: 'xml', label: 'XML' },
    { value: 'yaml', label: 'YAML' },
    { value: 'markdown', label: 'Markdown' },
    { value: 'jsx', label: 'JSX' },
    { value: 'tsx', label: 'TSX' },
];

export default function CodeBlockComponent({ node, updateAttributes }: CodeBlockComponentProps) {
    const [copied, setCopied] = useState(false)
    const language = node.attrs.language || 'text'

    const handleCopy = () => {
        navigator.clipboard.writeText(node.textContent)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <NodeViewWrapper className="my-6 rounded-xl border border-border overflow-hidden shadow-sm relative group not-prose">
            {/* Terminal Header */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-800 border-b border-zinc-700">
                <div className="flex items-center gap-3">
                    {/* Window Controls */}
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500" />
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>

                    {/* Language Selector — fully themed, no OS default dropdown */}
                    <select
                        contentEditable={false}
                        value={language}
                        onChange={(event) => updateAttributes({ language: event.target.value })}
                        className="
                            appearance-none bg-zinc-700 text-zinc-200 text-xs font-mono
                            outline-none cursor-pointer border border-zinc-600 rounded
                            px-2 py-1 hover:bg-zinc-600 transition-colors
                            focus:ring-1 focus:ring-zinc-500
                        "
                    >
                        {LANGUAGES.map((lang) => (
                            <option
                                key={lang.value}
                                value={lang.value}
                                className="bg-zinc-800 text-zinc-200"
                            >
                                {lang.label}
                            </option>
                        ))}
                    </select>
                </div>

                <button
                    contentEditable={false}
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-100 transition-colors px-2 py-1 rounded hover:bg-zinc-700"
                    title="Copy code"
                >
                    {copied ? (
                        <>
                            <Check className="size-3.5 text-green-400" />
                            <span className="text-green-400">Copied!</span>
                        </>
                    ) : (
                        <>
                            <Copy className="size-3.5" />
                            <span>Copy</span>
                        </>
                    )}
                </button>
            </div>

            {/* Code Content — let lowlight (wired into CodeBlock extension) handle highlighting */}
            <div className="relative bg-zinc-950">
                <pre className="p-4 overflow-x-auto text-sm font-mono leading-relaxed">
                    {/*
                        NodeViewContent renders the ProseMirror node content directly.
                        When the editor uses CodeBlockLowlight, hljs tokens are already
                        applied as <span class="hljs-*"> by Tiptap — no manual highlight needed.
                    */}
                    <pre>
                        <code className={`language-${language} hljs`}>
                            <NodeViewContent as="div" />
                        </code>
                    </pre>
                </pre>
            </div>
        </NodeViewWrapper>
    )
}