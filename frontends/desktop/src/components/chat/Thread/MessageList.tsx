import { memo, useMemo, useState, useCallback, useEffect, useRef } from 'react';
import type { Message } from '../../../services/chat';
import { buildThreadGroups, computeVisibleRange, RENDER_BUDGET_INITIAL, RENDER_BUDGET_STEP } from '../../../lib/thread-grouping';
import { useChatStore } from '../../../stores/chat';
import { TurnPair } from './TurnPair';
import { UserMessage } from './UserMessage';

interface Props {
  messages: Message[];
  isRunning: boolean;
}

export const MessageList = memo(function MessageList({ messages, isRunning }: Props) {
  const [renderBudget, setRenderBudget] = useState(RENDER_BUDGET_INITIAL);
  const sentinelRef = useRef<HTMLButtonElement>(null);
  const activeSessionId = useChatStore((s) => s.activeSessionId);

  useEffect(() => {
    setRenderBudget(RENDER_BUDGET_INITIAL);
  }, [activeSessionId]);

  const groups = useMemo(() => buildThreadGroups(messages), [messages]);
  const { firstVisible, hiddenCount } = useMemo(
    () => computeVisibleRange(groups, renderBudget),
    [groups, renderBudget],
  );

  const handleShowEarlier = useCallback(() => {
    setRenderBudget((b) => b + RENDER_BUDGET_STEP);
  }, []);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRenderBudget((b) => b + RENDER_BUDGET_STEP);
        }
      },
      { rootMargin: '200px 0px 0px 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hiddenCount]);

  if (messages.length === 0) {
    return (
      <div data-slot="thread-empty">
        <p>Send a message to begin.</p>
      </div>
    );
  }

  return (
    <>
      {hiddenCount > 0 && (
        <button ref={sentinelRef} data-slot="show-earlier" onClick={handleShowEarlier}>
          Show {hiddenCount} earlier {hiddenCount === 1 ? 'message' : 'messages'}
        </button>
      )}
      {groups.slice(firstVisible).map((group, i) => {
        if (group.kind === 'turn') {
          const isLast = firstVisible + i === groups.length - 1;
          return (
            <TurnPair
              key={group.assistantMsg.id}
              userMsg={group.userMsg}
              assistantMsg={group.assistantMsg}
              isStreaming={isRunning && isLast}
            />
          );
        }
        if (group.msg.role === 'user') {
          return (
            <div key={group.msg.id} data-slot="aui_turn-pair">
              <UserMessage content={group.msg.content} />
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
