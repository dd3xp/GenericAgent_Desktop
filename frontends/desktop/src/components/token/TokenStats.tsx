import { useMemo } from 'react';
import { useI18n } from '../../i18n';
import { useTokenStore } from '../../stores/token';

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function TokenStats() {
  const { t } = useI18n();
  const snapshot = useTokenStore((s) => s.snapshot);
  const history = useTokenStore((s) => s.history);

  const todayTokens = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTs = today.getTime();
    return history
      .filter((e) => e.ts >= todayTs)
      .reduce((sum, e) => sum + e.input + e.output, 0);
  }, [history]);

  const totalTokens = snapshot.totalInput + snapshot.totalOutput;
  const totalCache = snapshot.totalCacheWrite + snapshot.totalCacheRead;
  const cacheRate =
    totalTokens > 0
      ? ((snapshot.totalCacheRead / (totalTokens + totalCache)) * 100).toFixed(1)
      : '0';

  return (
    <div className="ga-token-stats">
      <div className="ga-token-stat-card">
        <div className="ga-token-stat-label">{t('tok.total')}</div>
        <div className="ga-token-stat-value">{formatNumber(totalTokens)}</div>
      </div>
      <div className="ga-token-stat-card">
        <div className="ga-token-stat-label">{t('tok.today')}</div>
        <div className="ga-token-stat-value">{formatNumber(todayTokens)}</div>
      </div>
      <div className="ga-token-stat-card">
        <div className="ga-token-stat-label">{t('tok.cost')}</div>
        <div className="ga-token-stat-value">{cacheRate}%</div>
      </div>
    </div>
  );
}
