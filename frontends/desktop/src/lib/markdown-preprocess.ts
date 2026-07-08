/**
 * Markdown preprocessing pipeline.
 *
 * Transforms raw agent text before it reaches remark-math / rehype-katex,
 * eliminating false-positive math triggers (currency dollars, code fences)
 * and normalising LaTeX bracket delimiters.
 */

// Matches a complete fenced code block (``` or ~~~) including its content.
const CODE_FENCE_SPLIT_RE = /((?:```|~~~)[\s\S]*?(?:```|~~~))/g;

// Matches inline code spans (single backtick, no newlines inside).
const INLINE_CODE_SPLIT_RE = /(`[^`\n]+`)/g;

// Matches a $ immediately before a digit (currency pattern like $5, $10, $1,299).
// Captures an optional preceding character to avoid matching escaped \$.
const CURRENCY_DOLLAR_RE = /(^|[^\\])\$(?=\d)/g;

// LaTeX bracket delimiters to be rewritten into $ / $$.
const LATEX_INLINE_RE = /\\\((.+?)\\\)/g;
const LATEX_DISPLAY_RE = /\\\[([\s\S]+?)\\\]/g;

/**
 * Escape currency dollar signs so remark-math ignores them.
 * `$5` becomes `\$5`.
 */
function escapeCurrencyDollars(text: string): string {
  return text.replace(CURRENCY_DOLLAR_RE, '$1\\$');
}

/**
 * Rewrite LaTeX bracket delimiters to standard $ / $$ delimiters.
 * `\(x\)` -> `$x$`
 * `\[x\]` -> `$$x$$`
 */
function rewriteLatexBracketDelimiters(text: string): string {
  let result = text;
  result = result.replace(LATEX_DISPLAY_RE, (_, expr) => `$$${expr}$$`);
  result = result.replace(LATEX_INLINE_RE, (_, expr) => `$${expr}$`);
  return result;
}

/**
 * Process a plain-text segment (not inside a code fence or inline code).
 */
function processPlainText(text: string): string {
  return rewriteLatexBracketDelimiters(escapeCurrencyDollars(text));
}

/**
 * Main preprocessing function.
 *
 * Splits input by code fences and inline code spans, applying transformations
 * only to plain prose segments. Code content is passed through unchanged.
 */
export function preprocessMarkdown(text: string): string {
  // First, split by fenced code blocks.
  const fenceSegments = text.split(CODE_FENCE_SPLIT_RE);

  return fenceSegments
    .map((segment, i) => {
      // Odd indices are matched fence blocks — pass through unchanged.
      if (i % 2 === 1) return segment;

      // Even indices are prose segments — split by inline code.
      const inlineSegments = segment.split(INLINE_CODE_SPLIT_RE);
      return inlineSegments
        .map((part, j) => {
          // Odd indices are inline code spans — pass through.
          if (j % 2 === 1) return part;
          // Even indices are plain text — apply transformations.
          return processPlainText(part);
        })
        .join('');
    })
    .join('');
}
