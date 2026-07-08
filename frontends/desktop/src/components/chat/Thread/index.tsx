import { useChatStore } from '../../../stores/chat';
import { useStickToBottom, useSessionScrollStability } from '../../../hooks/useStickToBottom';
import { ThreadContent } from './ThreadContent';
import { MessageList } from './MessageList';
import { UserTurnRail } from './UserTurnRail';
import './thread.css';

export function Thread() {
  const { messages, status, activeSessionId } = useChatStore();
  const { scrollRef, isAtBottom, scrollToBottom, stopScroll } = useStickToBottom();

  useSessionScrollStability(scrollRef, scrollToBottom, stopScroll, activeSessionId);

  return (
    <div data-slot="thread-root">
      <div
        ref={scrollRef}
        data-slot="aui_thread-viewport"
        data-following={isAtBottom}
      >
        <ThreadContent>
          <MessageList messages={messages} isRunning={status === 'running'} activeSessionId={activeSessionId} scrollRef={scrollRef} />
          <div data-slot="aui_composer-clearance" />
        </ThreadContent>
      </div>

      <UserTurnRail messages={messages} stopScroll={stopScroll} />

      {!isAtBottom && (
        <button data-slot="scroll-to-bottom" onClick={() => scrollToBottom('smooth')}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M8 3v10m0 0l-3.5-3.5M8 13l3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
    </div>
  );
}
