import { memo, useMemo, useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import type { Message } from '../../../services/chat';
import { buildThreadGroups, type ThreadGroup } from '../../../lib/thread-grouping';
import { TurnPair } from './TurnPair';
import { UserMessage } from './UserMessage';

const RENDER_BUDGET = 300;

interface Props {
  messages: Message[];
  isRunning: boolean;
  activeSessionId: string | null;
  scrollRef: React.RefObject<HTMLDivElement>;
}

function getGroupPartCount(group: ThreadGroup): number {
  if (group.kind === 'turn') {
    return group.turns.reduce((sum, t) => sum + t.segments.length, 0);
  }
  return 1;
}

export const MessageList = memo(function MessageList({
  messages,
  isRunning,
  activeSessionId,
  scrollRef,
}: Props) {
  const groups = useMemo(() => buildThreadGroups(messages), [messages]);
  const [budgetMultiplier, setBudgetMultiplier] = useState(1);
  const savedDistanceRef = useRef<number | null>(null);

  // Reset budget when session changes
  useEffect(() => {
    setBudgetMultiplier(1);
  }, [activeSessionId]);

  // Compute cutoff index
  const cutoffIndex = useMemo(() => {
    const totalBudget = RENDER_BUDGET * budgetMultiplier;
    let accumulated = 0;
    for (let i = groups.length - 1; i >= 0; i--) {
      accumulated += getGroupPartCount(groups[i]);
      if (accumulated > totalBudget) {
        return i + 1;
      }
    }
    return 0;
  }, [groups, budgetMultiplier]);

  const visibleGroups = useMemo(() => groups.slice(cutoffIndex), [groups, cutoffIndex]);
  const hiddenCount = cutoffIndex;

  // Scroll position restore after expanding earlier messages
  useLayoutEffect(() => {
    if (savedDistanceRef.current !== null && scrollRef?.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight - savedDistanceRef.current;
      savedDistanceRef.current = null;
    }
  });

  const handleShowEarlier = useCallback(() => {
    const viewport = scrollRef?.current;
    if (viewport) {
      savedDistanceRef.current = viewport.scrollHeight - viewport.scrollTop;
    }
    setBudgetMultiplier(m => m + 1);
  }, [scrollRef]);

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
        <button data-slot="show-earlier-btn" onClick={handleShowEarlier}>
          Show {hiddenCount} earlier messages
        </button>
      )}
      {visibleGroups.map((group, i) => {
        const globalIndex = cutoffIndex + i;
        if (group.kind === 'turn') {
          return (
            <TurnPair
              key={group.assistantMsg.id}
              userMsg={group.userMsg}
              assistantMsg={group.assistantMsg}
              isStreaming={isRunning && globalIndex === groups.length - 1}
            />
          );
        }
        if (group.msg.role === 'user') {
          return (
            <div key={group.msg.id} data-slot="aui_turn-pair">
              <UserMessage content={group.msg.content} msgId={group.msg.id} images={group.msg.images} files={group.msg.files} />
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
