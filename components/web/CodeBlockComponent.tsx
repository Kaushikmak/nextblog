import { NodeViewContent, NodeViewWrapper } from '@tiptap/react'
import { Check, Copy } from 'lucide-react'
import { useState } from 'react'

export default function CodeBlockComponent({ node, updateAttributes, extension }: any) {
    const [copied, setCopied] = useState(false)

    const handleCopy = () => {
        navigator.clipboard.writeText(node.textContent)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <NodeViewWrapper className="my-6 rounded-xl border bg-zinc-950 overflow-hidden shadow-sm relative group">
            {/* Custom Terminal Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800">
                <select
                    contentEditable={false}
                    value={node.attrs.language || 'text'}
                    onChange={(event) => updateAttributes({ language: event.target.value })}
                    className="bg-transparent text-xs text-zinc-400 font-mono outline-none cursor-pointer focus:text-zinc-100"
                >
                    <option value="text">plaintext</option>
                    <option value="javascript">javascript</option>
                    <option value="typescript">typescript</option>
                    <option value="html">html</option>
                    <option value="css">css</option>
                    <option value="python">python</option>
                    <option value="go">go</option>
                </select>
                
                <button 
                    contentEditable={false} 
                    onClick={handleCopy}
                    className="text-zinc-500 hover:text-zinc-100 transition-colors"
                    title="Copy code"
                >
                    {copied ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-4" />}
                </button>
            </div>
            
            {/* The editable code canvas */}
            <pre className="p-4 overflow-x-auto text-sm font-mono text-zinc-50">
                <NodeViewContent as={"code" as any} />
            </pre>
        </NodeViewWrapper>
    )
}