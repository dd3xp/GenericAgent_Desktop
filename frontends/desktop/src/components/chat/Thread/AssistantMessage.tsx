import { memo, useMemo } from 'react';
import type { Message } from '../../../services/chat';
import { parseAgentContent } from '../agentProtocol';
import { MessageParts } from './parts';

interface Props {
  message: Message;
  isStreaming: boolean;
}

export const AssistantMessage = memo(function AssistantMessage({ message, isStreaming }: Props) {
  const segments = useMemo(() => {
    const turnSegs = message.turn_segs;
    if (turnSegs && turnSegs.length > 0) {
      return turnSegs.flatMap((seg) => parseAgentContent(seg));
    }
    return parseAgentContent(message.content);
  }, [message.content, message.turn_segs]);

  return (
    <div
      data-slot="aui_assistant-message-root"
      data-role="assistant"
      data-streaming={isStreaming || undefined}
    >
      <MessageParts segments={segments} isStreaming={isStreaming} messageId={String(message.id)} />
    </div>
  );
});
