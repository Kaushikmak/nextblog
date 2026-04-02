/**
 * downloadHtml.ts
 * ---------------
 * Wraps the editor's raw HTML in a full standalone document with:
 *  - Tailwind CDN for prose typography
 *  - highlight.js CDN + github-dark theme for code blocks
 *  - The same inline-code pill styles used by PostContent
 */

export function buildStandaloneHtml(title: string, bodyHtml: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title || 'Post')}</title>

    <!-- Tailwind for prose typography -->
    <script src="https://cdn.tailwindcss.com"></script>

    <!-- highlight.js -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css" />
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>

    <style>
        body { background: #fff; color: #111; }
        @media (prefers-color-scheme: dark) { body { background: #0a0a0a; color: #f4f4f5; } }

        /* Code block shell */
        .code-block-wrapper {
            margin: 24px 0; border-radius: 12px;
            border: 1px solid #3f3f46; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,.3);
        }
        .code-block-header {
            display: flex; align-items: center; justify-content: space-between;
            padding: 10px 16px; background: #27272a; border-bottom: 1px solid #3f3f46;
        }
        .code-block-header .dots { display:flex; gap:6px }
        .code-block-header .dot { width:12px; height:12px; border-radius:50% }
        .code-block-header .lang-badge {
            font-size:12px; font-family:ui-monospace,monospace; color:#d4d4d8;
            background:#3f3f46; border:1px solid #52525b; border-radius:4px; padding:1px 8px;
        }
        .code-block-header .copy-btn {
            font-size:12px; color:#a1a1aa; background:none; border:none; cursor:pointer;
            padding:4px 8px; border-radius:4px; display:flex; align-items:center; gap:6px;
        }
        .code-block-header .copy-btn:hover { background:#3f3f46; color:#f4f4f5 }
        .code-block-body { background:#09090b }
        .code-block-body pre {
            margin:0; padding:16px; overflow-x:auto;
            font-size:14px; font-family:ui-monospace,monospace; line-height:1.6; background:transparent;
        }

        /* Inline code */
        :not(pre) > code {
            background:#1e1e2e; color:#cdd6f4;
            border:1px solid #313244; border-radius:4px;
            padding:1px 6px; font-size:0.875em;
            font-family:ui-monospace,monospace; white-space:nowrap;
        }

        /* Prose headings */
        h1 { font-size:2.25rem; font-weight:800; line-height:1.2; margin:2rem 0 1rem }
        h2 { font-size:1.875rem; font-weight:700; line-height:1.3; margin:2rem 0 .75rem }
        h3 { font-size:1.5rem;   font-weight:600; line-height:1.4; margin:1.5rem 0 .5rem }
        p  { line-height:1.75; margin:1rem 0 }
        a  { color:#3b82f6; text-decoration:underline }
        ul { list-style:disc; padding-left:1.5rem }
        ol { list-style:decimal; padding-left:1.5rem }
        blockquote { border-left:4px solid #a1a1aa; padding-left:1rem; font-style:italic; color:#71717a }
        img { border-radius:8px; border:1px solid #e4e4e7; max-width:100% }
    </style>
</head>
<body>
    <div class="max-w-3xl mx-auto px-6 py-12">
        <h1>${escapeHtml(title)}</h1>
        <div id="content">${bodyHtml}</div>
    </div>

    <script>
    // Wrap pre>code blocks in the terminal shell and run hljs
    document.querySelectorAll('pre').forEach(function(pre) {
        var code = pre.querySelector('code');
        if (!code) return;
        var langClass = Array.from(code.classList).find(function(c){ return c.startsWith('language-') });
        var lang = langClass ? langClass.replace('language-','') : 'plaintext';
        try { hljs.highlightElement(code); } catch(e) {}
        code.classList.add('hljs');

        var wrapper = document.createElement('div');
        wrapper.className = 'code-block-wrapper';
        wrapper.innerHTML =
            '<div class="code-block-header">' +
                '<div style="display:flex;align-items:center;gap:12px">' +
                    '<div class="dots">' +
                        '<div class="dot" style="background:#ef4444"></div>' +
                        '<div class="dot" style="background:#eab308"></div>' +
                        '<div class="dot" style="background:#22c55e"></div>' +
                    '</div>' +
                    '<span class="lang-badge">'+lang+'</span>' +
                '</div>' +
                '<button class="copy-btn" onclick="copyCode(this, '+JSON.stringify(code.textContent)+')">'+
                    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>'+
                    'Copy'+
                '</button>' +
            '</div>' +
            '<div class="code-block-body"></div>';

        pre.parentNode.insertBefore(wrapper, pre);
        wrapper.querySelector('.code-block-body').appendChild(pre);
    });

    function copyCode(btn, text) {
        navigator.clipboard.writeText(text);
        btn.textContent = 'Copied!';
        btn.style.color = '#4ade80';
        setTimeout(function(){ btn.textContent = 'Copy'; btn.style.color = ''; }, 2000);
    }
    </script>
</body>
</html>`
}

function escapeHtml(str: string) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}