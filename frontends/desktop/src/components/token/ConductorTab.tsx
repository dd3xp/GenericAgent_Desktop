import { useEffect } from 'react';
import { Empty, Spin, Banner } from '@douyinfe/semi-ui';
import { useI18n } from '../../i18n';
import { useTokenStore } from '../../stores/token';
import { TokenTable } from './TokenTable';

/** Conductor-specific stat cards */
function ConductorStats() {
  const { t } = useI18n();
  const snap = useTokenStore((s) => s.conductorSnapshot);
  const total = snap.totalInput + snap.totalOutput;

  function formatNumber(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
  }

  return (
    <div className="ga-token-stats">
      <div className="ga-token-stat-card">
        <div className="ga-token-stat-label">{t('tok.condTotal')}</div>
        <div className="ga-token-stat-value">{formatNumber(total)}</div>
      </div>
      <div className="ga-token-stat-card">
        <div className="ga-token-stat-label">{t('tok.colIn')}</div>
        <div className="ga-token-stat-value">{formatNumber(snap.totalInput)}</div>
      </div>
      <div className="ga-token-stat-card">
        <div className="ga-token-stat-label">{t('tok.colOut')}</div>
        <div className="ga-token-stat-value">{formatNumber(snap.totalOutput)}</div>
      </div>
    </div>
  );
}

/** Table that reads from conductor-specific history */
function ConductorTable() {
  const { t } = useI18n();
  const history = useTokenStore((s) => s.conductorHistory);
  const loading = useTokenStore((s) => s.conductorLoading);

  if (!loading && history.length === 0) {
    return <Empty description={t('tok.noData')} style={{ marginTop: 32 }} />;
  }

  if (loading) {
    return (
      <div className="ga-token-loading">
        <Spin />
      </div>
    );
  }

  return <TokenTable dataSource={history} loading={false} />;
}

export function ConductorTab() {
  const { t } = useI18n();
  const fetchConductorHistory = useTokenStore((s) => s.fetchConductorHistory);
  const conductorOffline = useTokenStore((s) => s.conductorOffline);

  useEffect(() => {
    fetchConductorHistory();
  }, [fetchConductorHistory]);

  return (
    <div className="ga-token-content">
      <Banner
        type="info"
        description={t('tok.condTip')}
        style={{ marginBottom: 12 }}
      />
      {conductorOffline ? (
        <Banner type="warning" description={t('tok.condOffline')} />
      ) : (
        <>
          <ConductorStats />
          <ConductorTable />
        </>
      )}
    </div>
  );
}
