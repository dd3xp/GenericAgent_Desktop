import { useRef, useState, useCallback, useEffect } from 'react';
import type { SendOptions } from '../../../stores/chat';
import { ModelSelector } from './ModelSelector';
import { AttachmentStrip, type AttachmentFile } from './AttachmentStrip';
import { SkillPanel } from './SkillPanel';
import './composer.css';

interface Props {
  onSend: (text: string, opts?: SendOptions) => void;
  onStop: () => void;
  isGenerating: boolean;
}

let fileIdCounter = 0;

export function Composer({ onSend, onStop, isGenerating }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const composerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState('');
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

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

  const processFiles = useCallback((fileList: FileList | File[]) => {
    const newFiles: AttachmentFile[] = [];
    for (const file of Array.from(fileList)) {
      const id = `att-${++fileIdCounter}`;
      const isImage = file.type.startsWith('image/');
      if (isImage) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setAttachments((prev) =>
            prev.map((a) => a.id === id ? { ...a, preview: e.target?.result as string } : a)
          );
        };
        reader.readAsDataURL(file);
      }
      newFiles.push({
        id,
        name: file.name,
        size: file.size,
        type: isImage ? 'image' : 'file',
        path: (file as File & { path?: string }).path || file.name,
      });
    }
    setAttachments((prev) => [...prev, ...newFiles]);
  }, []);

  const handleSend = useCallback(() => {
    const text = value.trim();
    if (!text && attachments.length === 0) return;
    const opts: SendOptions = {};
    const files = attachments.filter((a) => a.type === 'file');
    const images = attachments.filter((a) => a.type === 'image');
    if (files.length > 0) {
      opts.files = files.map((f) => ({ name: f.name, path: f.path || f.name, size: f.size }));
    }
    if (images.length > 0) {
      opts.images = images.map((f) => ({ name: f.name, path: f.path || f.name, base64: f.preview }));
    }
    onSend(text || '', Object.keys(opts).length > 0 ? opts : undefined);
    setValue('');
    setAttachments([]);
  }, [value, attachments, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const handleRemoveAttachment = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const handleSkillSelect = useCallback((prompt: string) => {
    setValue(prompt);
    textareaRef.current?.focus();
  }, []);

  const handleFileClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
    e.target.value = '';
  }, [processFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [processFiles]);

  const hasContent = value.trim().length > 0 || attachments.length > 0;

  return (
    <div
      ref={composerRef}
      data-slot="composer-root"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragOver && <div data-slot="composer-drop-overlay">Drop files here</div>}
      <div data-slot="composer-surface">
        <AttachmentStrip files={attachments} onRemove={handleRemoveAttachment} />
        <div data-slot="composer-input-row">
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
        </div>
        <div data-slot="composer-toolbar">
          <div data-slot="composer-toolbar-left">
            <button
              data-slot="composer-attach-btn"
              onClick={handleFileClick}
              aria-label="Attach file"
              title="Upload file"
            >
              <PlusIcon />
            </button>
            <SkillPanel onSelect={handleSkillSelect} />
          </div>
          <div data-slot="composer-toolbar-right">
            <ModelSelector />
            {isGenerating ? (
              <button data-slot="composer-stop-btn" onClick={onStop} aria-label="Stop generating">
                <StopIcon />
              </button>
            ) : (
              <button
                data-slot="composer-send-btn"
                onClick={handleSend}
                disabled={!hasContent}
                aria-label="Send message"
              >
                <SendIcon />
              </button>
            )}
          </div>
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
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

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
