import { memo } from 'react';
import type { Message } from '../../../services/chat';
import { UserMessage } from './UserMessage';
import { AssistantMessage } from './AssistantMessage';

interface Props {
  userMsg: Message;
  assistantMsg: Message;
  isStreaming: boolean;
}

export const TurnPair = memo(function TurnPair({ userMsg, assistantMsg, isStreaming }: Props) {
  return (
    <div data-slot="aui_turn-pair">
      <UserMessage content={userMsg.content} />
      <AssistantMessage message={assistantMsg} isStreaming={isStreaming} />
    </div>
  );
});
