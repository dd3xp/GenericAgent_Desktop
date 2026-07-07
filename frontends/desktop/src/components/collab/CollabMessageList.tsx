import { useRef } from 'react';
import { useConductorStore, type ConductorMessage } from '../../stores/conductor';
import { MarkdownPart } from '../chat/Thread/parts/MarkdownPart';
import { useStickToBottom } from '../../hooks/useStickToBottom';
import { LiveDuration } from '../layout/LiveDuration';
import { useI18n } from '../../i18n';
import '../chat/Thread/thread.css';

function MessageBubble({ message }: { message: ConductorMessage }) {
  const isUser = message.role === 'user';
  const isConductor = message.role === 'conductor';

  return (
    <div className={`collab-msg collab-msg--${message.role}`} data-slot="collab-msg">
      <div className={`collab-bubble ${isUser ? 'collab-bubble--user' : isConductor ? 'collab-bubble--conductor' : 'collab-bubble--system'}`}>
        {message.images && message.images.length > 0 && (
          <div className="collab-msg-images">
            {message.images.map((img, i) => (
              <img key={i} src={img.base64 || img.path} alt={img.name} className="collab-msg-img" />
            ))}
          </div>
        )}
        {message.files && message.files.length > 0 && (
          <div className="collab-msg-files">
            {message.files.map((f, i) => (
              <span key={i} className="collab-msg-file-chip">{f.name}</span>
            ))}
          </div>
        )}
        {isConductor || message.role === 'system' ? (
          <MarkdownPart content={message.msg} />
        ) : (
          <span className="collab-msg-text">{message.msg}</span>
        )}
      </div>
    </div>
  );
}

function TypingIndicator({ since }: { since: number }) {
  const { t } = useI18n();
  return (
    <div className="collab-msg collab-msg--conductor" data-slot="collab-typing">
      <div className="collab-thinking-bar">
        <span className="collab-thinking-dot" />
        <span className="collab-thinking-label">{t('collab.typing')}</span>
        <span className="collab-thinking-time"><LiveDuration since={since} /></span>
      </div>
    </div>
  );
}

export function CollabMessageList() {
  const messages = useConductorStore((s) => s.messages);
  const conductorTyping = useConductorStore((s) => s.conductorTyping);
  const connectionStatus = useConductorStore((s) => s.connectionStatus);
  const { t } = useI18n();
  const { scrollRef } = useStickToBottom();

  // Derive thinking start from the latest user message timestamp
  // ts may be in seconds (local: Date.now()/1000) or ms (some backends)
  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
  const tsToMs = (ts: number) => ts > 1e12 ? ts : ts * 1000;
  const thinkingSinceRef = useRef(Date.now());
  if (lastUserMsg?.ts) {
    thinkingSinceRef.current = tsToMs(lastUserMsg.ts);
  }

  if (connectionStatus === 'connecting') {
    return (
      <div className="collab-messages-area" data-slot="collab-messages">
        <div className="collab-connecting">
          <span className="collab-connecting-dot" />
          <span>{t('status.connecting')}</span>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="collab-messages-area" data-slot="collab-messages">
        <div className="collab-empty">
          <p>{t('collab.placeholder')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="collab-messages-area" data-slot="collab-messages" ref={scrollRef}>
      <div className="collab-messages-scroll">
        {messages.map((msg, i) => (
          <MessageBubble key={msg.id || i} message={msg} />
        ))}
        {conductorTyping && <TypingIndicator since={thinkingSinceRef.current} />}
      </div>
    </div>
  );
}
