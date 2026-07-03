import type { SessionInfo } from '../../services/chat';

function formatAge(dateVal?: number | string): string {
  if (!dateVal) return '';
  const ts = typeof dateVal === 'number' ? dateVal * 1000 : new Date(dateVal).getTime();
  const diff = Date.now() - ts;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export function SessionRow({
  session,
  isActive,
  isWorking,
  onClick,
}: {
  session: SessionInfo;
  isActive: boolean;
  isWorking?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`ga-session-item${isActive ? ' active' : ''}`}
      onClick={onClick}
    >
      <span className="ga-session-content">
        <span className={`ga-status-dot${isWorking ? ' working' : ''}`} />
        <span className="ga-session-title">
          {session.title || 'Untitled'}
        </span>
      </span>
      <span className="ga-session-age">{formatAge(session.updatedAt)}</span>
    </button>
  );
}
