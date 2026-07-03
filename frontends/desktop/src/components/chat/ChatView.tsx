import { useCallback } from 'react';
import { useChatStore } from '../../stores/chat';
import { Thread } from './Thread';
import { Composer } from './Composer';
import './chatView.css';

export function ChatView() {
  const status = useChatStore((s) => s.status);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const cancel = useChatStore((s) => s.cancel);

  const handleSend = useCallback(
    (text: string) => {
      if (text) sendMessage(text);
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
