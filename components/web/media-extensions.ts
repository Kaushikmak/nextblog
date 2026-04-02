import { Node, mergeAttributes } from '@tiptap/core'

export const VideoNode = Node.create({
    name: 'customVideo',
    group: 'block',
    selectable: true,
    draggable: true,

    addAttributes() {
        return {
            src: { default: null },
            controls: { default: true },
        }
    },

    parseHTML() {
        return [{ tag: 'video[src]' }]
    },

    renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, unknown> }) {
        return ['video', mergeAttributes(HTMLAttributes, { class: 'rounded-lg border w-full my-4 bg-muted' })]
    },
})

export const AudioNode = Node.create({
    name: 'customAudio',
    group: 'block',
    selectable: true,
    draggable: true,

    addAttributes() {
        return {
            src: { default: null },
            controls: { default: true },
        }
    },

    parseHTML() {
        return [{ tag: 'audio[src]' }]
    },

    renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, unknown> }) {
        return ['audio', mergeAttributes(HTMLAttributes, { class: 'w-full my-4' })]
    },
})