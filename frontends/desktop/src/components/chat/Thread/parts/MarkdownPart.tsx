import { memo, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import type { Components } from 'react-markdown';
import 'katex/dist/katex.min.css';
import { CodeBlock } from './CodeBlock';
import { useSmoothReveal } from '../../../../hooks/useSmoothReveal';

interface Props {
  content: string;
  isStreaming?: boolean;
}

function normalizeLatexDelimiters(text: string): string {
  text = text.replace(/\\\[([\s\S]+?)\\\]/g, (_, expr) => `$$${expr}$$`);
  text = text.replace(/\\\(([\s\S]+?)\\\)/g, (_, expr) => `$${expr}$`);
  return text;
}

function makeComponents(isStreaming: boolean): Components {
  return {
    pre({ children }) {
      return <>{children}</>;
    },
    code({ className, children }) {
      const match = /language-(\w+)/.exec(className || '');
      const code = String(children).replace(/\n$/, '');
      if (match) {
        return <CodeBlock language={match[1]} code={code} isStreaming={isStreaming} />;
      }
      if (code.includes('\n')) {
        return <CodeBlock code={code} isStreaming={isStreaming} />;
      }
      return <code className={className}>{children}</code>;
    },
    table({ children }) {
      return (
        <div data-slot="md-table-wrap">
          <table>{children}</table>
        </div>
      );
    },
  };
}

export const MarkdownPart = memo(function MarkdownPart({ content, isStreaming = false }: Props) {
  const components = useMemo(() => makeComponents(isStreaming), [isStreaming]);
  const revealed = useSmoothReveal(content, isStreaming);

  return (
    <div data-slot="aui_markdown-part">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={components}
      >
        {normalizeLatexDelimiters(revealed)}
      </ReactMarkdown>
    </div>
  );
});
