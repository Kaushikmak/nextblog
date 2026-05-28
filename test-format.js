function formatHTML(html) {
    let formatted = '';
    let indent = '';
    const tab = '  ';
    html.split(/(<\/?[^>]+>)/).forEach(function(node) {
        if (node.trim() === '') return;
        if (node.match(/^<\//)) {
            indent = indent.substring(tab.length);
            formatted += indent + node + '\n';
        } else if (node.match(/^<[^>]+>$/) && !node.match(/<.*\/>/) && !node.match(/<(img|br|hr|input)/)) {
            formatted += indent + node + '\n';
            indent += tab;
        } else {
            formatted += indent + node + '\n';
        }
    });
    return formatted.trim();
}
console.log(formatHTML("<p>Hello <strong>world</strong></p><ul><li>Item 1</li></ul>"));
