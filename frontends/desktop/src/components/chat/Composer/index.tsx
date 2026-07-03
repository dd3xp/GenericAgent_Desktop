import { useRef, useState, useCallback, useEffect } from 'react';
import './composer.css';

interface Props {
  onSend: (text: string) => void;
  onStop: () => void;
  isGenerating: boolean;
}

export function Composer({ onSend, onStop, isGenerating }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const composerRef = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState('');

  useEffect(() => {
    const el = composerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const height = entries[0]?.borderBoxSize?.[0]?.blockSize ?? el.offsetHeight;
      document.documentElement.style.setProperty('--composer-measured-height', `${height}px`);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = '0';
    el.style.height = `${Math.min(el.scrollHeight, 150)}px`;
  }, [value]);

  const handleSend = useCallback(() => {
    const text = value.trim();
    if (!text) return;
    onSend(text);
    setValue('');
  }, [value, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const hasText = value.trim().length > 0;

  return (
    <div ref={composerRef} data-slot="composer-root">
      <div data-slot="composer-surface">
        <textarea
          ref={textareaRef}
          data-slot="composer-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Send a message…"
          rows={1}
          disabled={isGenerating}
        />
        <div data-slot="composer-controls">
          {isGenerating ? (
            <button data-slot="composer-stop-btn" onClick={onStop} aria-label="Stop generating">
              <StopIcon />
            </button>
          ) : (
            <button
              data-slot="composer-send-btn"
              onClick={handleSend}
              disabled={!hasText}
              aria-label="Send message"
            >
              <SendIcon />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 14V2m0 0L3 7m5-5l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <rect x="3" y="3" width="10" height="10" rx="2" fill="currentColor" />
    </svg>
  );
}
