import type { ReactNode } from 'react';
import { useChatStore } from '../../stores/chat';
import { LiveDuration } from './LiveDuration';

type Variant = 'action' | 'text' | 'menu' | 'link';

interface StatusItemProps {
  variant?: Variant;
  icon?: ReactNode;
  label: string;
  detail?: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  href?: string;
}

function StatusItem({ variant = 'text', icon, label, detail, disabled, onClick, href }: StatusItemProps) {
  const cls = `ga-statusbar-item ${variant}${disabled ? ' disabled' : ''}`;

  const content = (
    <>
      {icon && <span className="ga-statusbar-icon">{icon}</span>}
      <span className="ga-statusbar-label">{label}</span>
      {detail && <span className="ga-statusbar-detail">{detail}</span>}
    </>
  );

  if (variant === 'link' && href) {
    return <a className={cls} href={href} target="_blank" rel="noopener noreferrer">{content}</a>;
  }

  if (variant === 'action' || variant === 'menu') {
    return <button type="button" className={cls} onClick={onClick} disabled={disabled}>{content}</button>;
  }

  return <span className={cls}>{content}</span>;
}

export function Statusbar() {
  const status = useChatStore((s) => s.status);
  const turnStartedAt = useChatStore((s) => s.turnStartedAt);

  return (
    <footer className="ga-statusbar">
      <div className="ga-statusbar-group">
        <StatusItem icon={<DotIcon connected />} label="Bridge" />
      </div>
      <div className="ga-statusbar-group">
        {status === 'running' && turnStartedAt && (
          <StatusItem
            icon={<SpinnerIcon />}
            label="Turn"
            detail={<LiveDuration since={turnStartedAt} />}
          />
        )}
        <StatusItem label="v0.1.0" />
      </div>
    </footer>
  );
}

function DotIcon({ connected }: { connected: boolean }) {
  return (
    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
      <circle cx="4" cy="4" r="3" fill={connected ? 'var(--ui-accent)' : 'var(--ui-text-quaternary)'} />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="ga-statusbar-spinner">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" strokeDasharray="28 10" strokeLinecap="round" />
    </svg>
  );
}
