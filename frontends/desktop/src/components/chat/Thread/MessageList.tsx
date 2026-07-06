import { memo, useMemo } from 'react';
import type { Message } from '../../../services/chat';
import { buildThreadGroups } from '../../../lib/thread-grouping';
import { TurnPair } from './TurnPair';
import { UserMessage } from './UserMessage';

interface Props {
  messages: Message[];
  isRunning: boolean;
}

export const MessageList = memo(function MessageList({ messages, isRunning }: Props) {
  const groups = useMemo(() => buildThreadGroups(messages), [messages]);

  if (messages.length === 0) {
    return (
      <div data-slot="thread-empty">
        <p>Send a message to begin.</p>
      </div>
    );
  }

  return (
    <>
      {groups.map((group, i) => {
        if (group.kind === 'turn') {
          return (
            <TurnPair
              key={group.assistantMsg.id}
              userMsg={group.userMsg}
              assistantMsg={group.assistantMsg}
              isStreaming={isRunning && i === groups.length - 1}
            />
          );
        }
        if (group.msg.role === 'user') {
          return (
            <div key={group.msg.id} data-slot="aui_turn-pair">
              <UserMessage content={group.msg.content} msgId={group.msg.id} images={group.msg.images} />
            </div>
          );
        }
        return (
          <div key={group.msg.id} data-slot="standalone-message" data-status={group.msg.status}>
            {group.msg.content}
          </div>
        );
      })}
    </>
  );
});
