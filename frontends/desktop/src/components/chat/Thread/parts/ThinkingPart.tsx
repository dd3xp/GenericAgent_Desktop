import { memo, useState, useRef, useCallback } from 'react';

interface Props {
  content: string;
  isStreaming: boolean;
}

export const ThinkingPart = memo(function ThinkingPart({ content, isStreaming }: Props) {
  const [userOpen, setUserOpen] = useState<boolean | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  const isOpen = userOpen ?? isStreaming;

  const handleToggle = useCallback(() => {
    setUserOpen((prev) => (prev === null ? !isStreaming : !prev));
  }, [isStreaming]);

  if (!content.trim()) return null;

  return (
    <details
      data-slot="aui_thinking-disclosure"
      open={isOpen}
      onToggle={handleToggle}
    >
      <summary data-slot="thinking-summary">Thinking</summary>
      <div ref={bodyRef} data-slot="thinking-body">
        {content}
      </div>
    </details>
  );
});
