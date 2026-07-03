import { useAppStore, type PageId } from '../../stores/app';
import { useI18n } from '../../i18n';
import { ChatView } from '../chat/ChatView';

const PAGE_PLACEHOLDERS: Record<Exclude<PageId, 'chat'>, { titleKey: string; subKey?: string }> = {
  services: { titleKey: 'page.services.title', subKey: 'page.services.sub' },
  collab: { titleKey: 'page.collab.title', subKey: 'page.collab.sub' },
  token: { titleKey: 'page.token.title', subKey: 'page.token.sub' },
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

  const cfg = PAGE_PLACEHOLDERS[activePage];

  return (
    <div className="ga-main-area">
      <div className="ga-main-placeholder">
        <h2>{t(cfg.titleKey)}</h2>
        {cfg.subKey && <p>{t(cfg.subKey)}</p>}
      </div>
    </div>
  );
}
