import HtmlDiff from 'htmldiff-js';

interface DiffViewerProps {
    originalHtml: string;
    proposedHtml: string;
}

export function DiffViewer({ originalHtml, proposedHtml }: DiffViewerProps) {
    // Execute the diffing algorithm
    const diffedHtml = HtmlDiff.execute(originalHtml, proposedHtml);

    return (
        <div 
            className="prose prose-sm dark:prose-invert max-w-none 
                       [&>ins]:bg-green-500/20 [&>ins]:text-green-700 dark:[&>ins]:text-green-400 [&>ins]:no-underline
                       [&>del]:bg-red-500/20 [&>del]:text-red-700 dark:[&>del]:text-red-400 [&>del]:line-through
                       [&_ins]:bg-green-500/20 [&_ins]:text-green-700 dark:[&_ins]:text-green-400 [&_ins]:no-underline
                       [&_del]:bg-red-500/20 [&_del]:text-red-700 dark:[&_del]:text-red-400 [&_del]:line-through"
            dangerouslySetInnerHTML={{ __html: diffedHtml }}
        />
    );
}