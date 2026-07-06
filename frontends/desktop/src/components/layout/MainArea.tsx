import { useAppStore } from '../../stores/app';
import { useI18n } from '../../i18n';
import { ChatView } from '../chat/ChatView';
import { ServicesPage } from '../services/ServicesPage';
import { TokenPage } from '../token/TokenPage';

const PAGE_PLACEHOLDERS: Record<'collab', { titleKey: string; subKey?: string }> = {
  collab: { titleKey: 'page.collab.title', subKey: 'page.collab.sub' },
};

export function MainArea() {
  const activePage = useAppStore((s) => s.activePage);
  const { t } = useI18n();

  if (activePage === 'chat') {
    return (
      <div className="ga-main-area ga-main-chat">
        <ChatView />
      </div>
    );
  }

  if (activePage === 'services') {
    return (
      <div className="ga-main-area">
        <ServicesPage />
      </div>
    );
  }

  if (activePage === 'token') {
    return (
      <div className="ga-main-area">
        <TokenPage />
      </div>
    );
  }

  // Fallback for pages not yet migrated (collab)
  const cfg = PAGE_PLACEHOLDERS[activePage as 'collab'];
  if (!cfg) return <div className="ga-main-area" />;

  return (
    <div className="ga-main-area">
      <div className="ga-main-placeholder">
        <h2>{t(cfg.titleKey)}</h2>
        {cfg.subKey && <p>{t(cfg.subKey)}</p>}
      </div>
    </div>
  );
}
