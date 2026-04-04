// types/htmldiff-js.d.ts
declare module 'htmldiff-js' {
    const HtmlDiff: {
        execute: (originalHtml: string, proposedHtml: string) => string;
    };
    export default HtmlDiff;
}