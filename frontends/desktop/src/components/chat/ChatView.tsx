import { useCallback, useRef } from 'react';
import { useChatStore, type SendOptions } from '../../stores/chat';
import { Thread } from './Thread';
import { Composer } from './Composer';
import { EmptyState } from './EmptyState';
import type { SkillDef } from './Composer/skills';
import type { RichEditorHandle } from './Composer/RichEditorInput';
import './chatView.css';

export function ChatView() {
  const status = useChatStore((s) => s.status);
  const messages = useChatStore((s) => s.messages);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const cancel = useChatStore((s) => s.cancel);
  const composerEditorRef = useRef<RichEditorHandle>(null);

  const handleSend = useCallback(
    (text: string, opts?: SendOptions) => {
      if (text || opts) sendMessage(text, opts);
    },
    [sendMessage],
  );

  const handlePresetClick = useCallback((skill: SkillDef) => {
    composerEditorRef.current?.setSkillChip(skill.id, skill.prompt);
    composerEditorRef.current?.focus();
  }, []);

  const isEmpty = messages.length === 0 && status === 'idle';

  return (
    <div className="chat-view-root" data-empty={isEmpty || undefined}>
      {isEmpty ? (
        <EmptyState onPresetClick={handlePresetClick} />
      ) : (
        <Thread />
      )}
      <Composer
        onSend={handleSend}
        onStop={cancel}
        isGenerating={status === 'running'}
        editorRef={composerEditorRef}
      />
    </div>
  );
}
