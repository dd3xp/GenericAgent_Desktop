import { memo, useRef, useState, useLayoutEffect } from 'react';

interface Props {
  content: string;
}

export const UserMessage = memo(function UserMessage({ content }: Props) {
  const textRef = useRef<HTMLDivElement>(null);
  const [clamped, setClamped] = useState(false);

  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      setClamped(el.scrollHeight > el.clientHeight + 2);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (!content) return null;

  return (
    <div data-slot="aui_user-message-root">
      <div data-slot="user-bubble" data-clamped={clamped || undefined}>
        <div ref={textRef} data-slot="user-bubble-text">
          {content}
        </div>
      </div>
    </div>
  );
});
