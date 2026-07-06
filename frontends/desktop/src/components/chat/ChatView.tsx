import { useCallback } from 'react';
import { useChatStore, type SendOptions } from '../../stores/chat';
import { Thread } from './Thread';
import { Composer } from './Composer';
import './chatView.css';

export function ChatView() {
  const status = useChatStore((s) => s.status);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const cancel = useChatStore((s) => s.cancel);

  const handleSend = useCallback(
    (text: string, opts?: SendOptions) => {
      if (text || opts) sendMessage(text, opts);
    },
    [sendMessage],
  );

  return (
    <div className="chat-view-root">
      <Thread />
      <Composer onSend={handleSend} onStop={cancel} isGenerating={status === 'running'} />
    </div>
  );
}
