import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Message } from '../../../services/chat';
import './UserTurnRail.css';

const MIN_TURNS = 3;
const MAX_PREVIEW_CHARS = 40;

interface Props {
  messages: Message[];
  stopScroll: () => void;
}

interface UserTurn {
  id: string;
  content: string;
}

function previewText(content: string): string {
  const normalized = content.replace(/\s+/g, ' ').trim();
  return normalized.length <= MAX_PREVIEW_CHARS
    ? normalized
    : normalized.slice(0, MAX_PREVIEW_CHARS) + '…';
}

export const UserTurnRail = memo(function UserTurnRail({ messages, stopScroll }: Props) {
  const userTurns: UserTurn[] = useMemo(
    () => messages
      .filter((m) => m.role === 'user')
      .map((m) => ({ id: m.id, content: m.content })),
    [messages],
  );

  const [activeId, setActiveId] = useState<string | null>(null);
  const [hovered, setHovered] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const observedIds = useRef<Set<string>>(new Set());

  const handleMouseEnter = useCallback(() => {
    if (leaveTimer.current) {
      clearTimeout(leaveTimer.current);
      leaveTimer.current = null;
    }
    setHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    leaveTimer.current = setTimeout(() => {
      setHovered(false);
      leaveTimer.current = null;
    }, 150);
  }, []);

  useEffect(() => {
    if (userTurns.length < MIN_TURNS) return;

    const root = document.querySelector<HTMLElement>('[data-slot="aui_thread-viewport"]');
    if (!root) return;

    if (!observerRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((e) => e.isIntersecting)
            .sort((a, b) => Math.abs(a.boundingClientRect.top) - Math.abs(b.boundingClientRect.top));

          const nearest = visible[0];
          if (nearest) {
            const id = nearest.target.getAttribute('data-msg-id');
            if (id) setActiveId(id);
          }
        },
        {
          root,
          rootMargin: '-20% 0px -65% 0px',
          threshold: [0, 0.1, 0.5, 1],
        },
      );
    }

    const observer = observerRef.current;

    for (const turn of userTurns) {
      if (observedIds.current.has(turn.id)) continue;
      const el = document.getElementById(`msg-${turn.id}`);
      if (el) {
        observer.observe(el);
        observedIds.current.add(turn.id);
      }
    }

    return () => {
      observer.disconnect();
      observedIds.current.clear();
      observerRef.current = null;
    };
  }, [userTurns]);

  const handleJump = useCallback((id: string) => {
    const viewport = document.querySelector<HTMLElement>('[data-slot="aui_thread-viewport"]');
    const el = document.getElementById(`msg-${id}`);
    if (!viewport || !el) return;

    stopScroll();
    const elRect = el.getBoundingClientRect();
    const vpRect = viewport.getBoundingClientRect();
    viewport.scrollTo({
      top: viewport.scrollTop + (elRect.top - vpRect.top) - 16,
      behavior: 'smooth',
    });
  }, [stopScroll]);

  if (userTurns.length < MIN_TURNS) return null;

  return (
    <nav
      data-slot="user-turn-rail"
      data-expanded={hovered || undefined}
      aria-label="User message navigation"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div data-slot="rail-marks">
        {userTurns.map((turn) => (
          <button
            key={turn.id}
            data-slot="rail-mark"
            data-active={turn.id === activeId || undefined}
            aria-label={previewText(turn.content)}
            onClick={() => handleJump(turn.id)}
          >
            <span data-slot="rail-mark-line" />
          </button>
        ))}
      </div>

      <div data-slot="rail-panel" aria-hidden={!hovered}>
        {userTurns.map((turn) => (
          <button
            key={turn.id}
            data-slot="rail-panel-item"
            onClick={() => handleJump(turn.id)}
          >
            {previewText(turn.content)}
          </button>
        ))}
      </div>
    </nav>
  );
});
