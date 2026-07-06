import { memo, useRef, useState, useLayoutEffect } from 'react';
import { matchSkillPrefix } from '../Composer/skills';

const BRIDGE_BASE = 'http://127.0.0.1:14168';

interface Props {
  content: string;
  msgId?: string;
  images?: { name: string; path: string }[];
}

export const UserMessage = memo(function UserMessage({ content, msgId, images }: Props) {
  const textRef = useRef<HTMLDivElement>(null);
  const [clamped, setClamped] = useState(false);

  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      setClamped(el.scrollHeight > el.clientHeight + 2);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (!content && (!images || images.length === 0)) return null;

  const skill = matchSkillPrefix(content);

  return (
    <>
      {images && images.length > 0 && (
        <div data-slot="user-images">
          {images.map((img, i) => (
            <img
              key={i}
              data-slot="user-image-thumb"
              src={img.path.startsWith('data:') ? img.path : `${BRIDGE_BASE}/upload/raw?path=${encodeURIComponent(img.path)}`}
              alt={img.name}
            />
          ))}
        </div>
      )}
      <div data-slot="aui_user-message-root" id={msgId ? `msg-${msgId}` : undefined} data-msg-id={msgId || undefined} data-role="user">
        <div data-slot="user-bubble" data-clamped={clamped || undefined}>
          <div ref={textRef} data-slot="user-bubble-text">
            {skill ? (
              <>
                <span className="skill-chip">/{skill.id}</span>
                {skill.rest && <> {skill.rest}</>}
              </>
            ) : (
              content
            )}
          </div>
        </div>
      </div>
    </>
  );
});
