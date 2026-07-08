import { memo } from 'react';
import katex from 'katex';

interface Props {
  expr: string;
}

/**
 * SafeMathBlock renders a KaTeX display math expression with layered fallback:
 * 1. Attempt strict render (throwOnError: true)
 * 2. Attempt lenient render (throwOnError: false, strict: 'ignore')
 * 3. Final fallback: raw expression in a code block
 */
export const SafeMathBlock = memo(function SafeMathBlock({ expr }: Props) {
  // Try strict rendering first
  try {
    const html = katex.renderToString(expr, {
      displayMode: true,
      throwOnError: true,
    });
    return <div data-slot="math-display" dangerouslySetInnerHTML={{ __html: html }} />;
  } catch {
    // Strict failed — try lenient
  }

  try {
    const html = katex.renderToString(expr, {
      displayMode: true,
      throwOnError: false,
      strict: 'ignore',
    });
    return <div data-slot="math-display" data-math-fallback="lenient" dangerouslySetInnerHTML={{ __html: html }} />;
  } catch {
    // Lenient also failed — raw text fallback
  }

  return (
    <pre data-slot="math-display" data-math-fallback="raw">
      <code>{expr}</code>
    </pre>
  );
});
