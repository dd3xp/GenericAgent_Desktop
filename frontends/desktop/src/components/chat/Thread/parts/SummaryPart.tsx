import { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface Props {
  content: string;
}

function normalizeLatexDelimiters(text: string): string {
  text = text.replace(/\\\[([\s\S]+?)\\\]/g, (_, expr) => `$$${expr}$$`);
  text = text.replace(/\\\(([\s\S]+?)\\\)/g, (_, expr) => `$${expr}$`);
  return text;
}

export const SummaryPart = memo(function SummaryPart({ content }: Props) {
  return (
    <div data-slot="summary-block">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
      >
        {normalizeLatexDelimiters(content)}
      </ReactMarkdown>
    </div>
  );
});
