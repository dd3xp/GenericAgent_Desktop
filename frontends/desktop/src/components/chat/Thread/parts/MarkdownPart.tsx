import { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface Props {
  content: string;
}

function normalizeLatexDelimiters(text: string): string {
  text = text.replace(/\\\[([\s\S]+?)\\\]/g, (_, expr) => `$$${expr}$$`);
  text = text.replace(/\\\(([\s\S]+?)\\\)/g, (_, expr) => `$${expr}$`);
  return text;
}

export const MarkdownPart = memo(function MarkdownPart({ content }: Props) {
  return (
    <div data-slot="aui_markdown-part">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
      >
        {normalizeLatexDelimiters(content)}
      </ReactMarkdown>
    </div>
  );
});
