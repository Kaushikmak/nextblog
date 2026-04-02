import { Node, mergeAttributes } from '@tiptap/core'

export const VideoNode = Node.create({
    name: 'customVideo',
    group: 'block',
    selectable: true,
    draggable: true,

    addAttributes() {
        return {
            src: { 
                default: null,
                parseHTML: element => element.getAttribute('src'),
                renderHTML: attributes => {
                    if (!attributes.src) return {}
                    return { src: attributes.src }
                },
            },
            controls: { 
                default: true,
                parseHTML: element => element.hasAttribute('controls'),
                renderHTML: attributes => {
                    if (!attributes.controls) return {}
                    return { controls: 'controls' }
                },
            },
            width: {
                default: '100%',
                parseHTML: element => element.getAttribute('width'),
                renderHTML: attributes => {
                    if (!attributes.width) return {}
                    return { width: attributes.width }
                },
            },
        }
    },

    parseHTML() {
        return [{ tag: 'video[src]' }]
    },

    renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, unknown> }) {
        return ['video', mergeAttributes(HTMLAttributes, { 
            class: 'rounded-lg border border-border w-full my-4 bg-muted max-h-[500px]',
            controls: 'controls',
        })]
    },

    addNodeView() {
        return ({ node }: { node: any }) => {
            const dom = document.createElement('div')
            dom.className = 'relative my-4'
            
            const video = document.createElement('video')
            video.src = node.attrs.src as string
            video.controls = node.attrs.controls as boolean
            video.className = 'rounded-lg border border-border w-full bg-muted max-h-[500px]'
            video.style.width = '100%'
            
            dom.appendChild(video)
            
            return {
                dom,
                update: (updatedNode: any) => {
                    if (updatedNode.attrs.src !== node.attrs.src) {
                        video.src = updatedNode.attrs.src as string
                    }
                    return true
                },
            }
        }
    },
})

export const AudioNode = Node.create({
    name: 'customAudio',
    group: 'block',
    selectable: true,
    draggable: true,

    addAttributes() {
        return {
            src: { 
                default: null,
                parseHTML: element => element.getAttribute('src'),
                renderHTML: attributes => {
                    if (!attributes.src) return {}
                    return { src: attributes.src }
                },
            },
            controls: { 
                default: true,
                parseHTML: element => element.hasAttribute('controls'),
                renderHTML: attributes => {
                    if (!attributes.controls) return {}
                    return { controls: 'controls' }
                },
            },
        }
    },

    parseHTML() {
        return [{ tag: 'audio[src]' }]
    },

    renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, unknown> }) {
        return ['audio', mergeAttributes(HTMLAttributes, { 
            class: 'w-full my-4',
            controls: 'controls',
        })]
    },

    addNodeView() {
        return ({ node }: { node: any }) => {
            const dom = document.createElement('div')
            dom.className = 'my-4 p-4 bg-muted rounded-lg border border-border'
            
            const audio = document.createElement('audio')
            audio.src = node.attrs.src as string
            audio.controls = true
            audio.className = 'w-full'
            
            dom.appendChild(audio)
            
            return {
                dom,
                update: (updatedNode: any) => {
                    if (updatedNode.attrs.src !== node.attrs.src) {
                        audio.src = updatedNode.attrs.src as string
                    }
                    return true
                },
            }
        }
    },
})
