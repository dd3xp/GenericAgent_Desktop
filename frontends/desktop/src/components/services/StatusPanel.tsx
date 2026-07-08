import { useState, useCallback } from 'react';
import { Table, Tag, Button, Spin, Empty } from '@douyinfe/semi-ui';
import { IconPlay, IconStop, IconRefresh, IconFile, IconClose } from '@douyinfe/semi-icons';
import type { ColumnProps } from '@douyinfe/semi-ui/lib/es/table';
import { useI18n } from '../../i18n';
import { useBridgeStatus } from '../../hooks/useBridgeStatus';
import { useServicesStore, type ServiceInfo } from '../../stores/services';
import { showError, showSuccess } from '../../utils/toast';
import { isChannelService } from './ChannelList';
import { ChannelLogModal } from './ChannelLogModal';

export function StatusPanel() {
  const { t } = useI18n();
  const bridgeStatus = useBridgeStatus();
  const allServices = useServicesStore((s) => s.services);
  const loading = useServicesStore((s) => s.loading);
  const startService = useServicesStore((s) => s.startService);
  const stopService = useServicesStore((s) => s.stopService);
  const restartService = useServicesStore((s) => s.restartService);

  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [logTarget, setLogTarget] = useState<string | null>(null);

  const services = allServices.filter((svc) => !isChannelService(svc));

  const withBusy = useCallback(
    async (id: string, action: () => Promise<boolean>) => {
      setBusyIds((prev) => new Set([...prev, id]));
      try {
        const ok = await action();
        if (!ok) showError(t('err.channelStop'));
      } finally {
        setBusyIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    [t],
  );

  const handleStart = useCallback(
    (svc: ServiceInfo) =>
      withBusy(svc.id, async () => {
        const ok = await startService(svc.id);
        if (ok) showSuccess(t('sys.channelStarted'));
        return ok;
      }),
    [startService, t, withBusy],
  );

  const handleStop = useCallback(
    (svc: ServiceInfo) =>
      withBusy(svc.id, async () => {
        const ok = await stopService(svc.id);
        if (ok) showSuccess(t('sys.channelStopped'));
        return ok;
      }),
    [stopService, t, withBusy],
  );

  const handleRestart = useCallback(
    (svc: ServiceInfo) =>
      withBusy(svc.id, async () => {
        const ok = await restartService(svc.id);
        if (ok) showSuccess(t('sys.channelStarted'));
        return ok;
      }),
    [restartService, t, withBusy],
  );

  const statusTag = (svc: ServiceInfo) => {
    const { status, errorKey, warningKey, lastError, lastWarning } = svc;
    const map: Record<string, { color: string; text: string }> = {
      running: { color: 'green', text: t('st.running') },
      offline: { color: 'grey', text: t('st.offline') },
      error: { color: 'red', text: t('st.error') },
      warning: { color: 'amber', text: t('st.warning') },
    };
    const cfg = map[status] ?? map.offline;
    const detail = errorKey ? t(errorKey) : warningKey ? t(warningKey) : (lastError || lastWarning || '');
    const hasDetail = status === 'error' || (status === 'running' && warningKey);
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <Tag size="small" color={cfg.color as 'green' | 'grey' | 'red' | 'amber'} type="light">
          {cfg.text}
        </Tag>
        {hasDetail && detail && (
          <span
            title={lastError || lastWarning || ''}
            style={{
              fontSize: 11,
              color: status === 'error' ? 'var(--semi-color-danger)' : 'var(--semi-color-warning)',
              maxWidth: 200,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {detail.length > 50 ? detail.slice(0, 50) + '…' : detail}
          </span>
        )}
      </span>
    );
  };

  const columns: ColumnProps<ServiceInfo>[] = [
    {
      title: t('tok.colSession'),
      dataIndex: 'name',
      key: 'name',
      render: (_text: unknown, record: ServiceInfo) => (
        <span style={{ fontWeight: 500 }}>{record.name || record.id}</span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 220,
      render: (_text: unknown, record: ServiceInfo) => statusTag(record),
    },
    {
      title: 'PID',
      dataIndex: 'pid',
      key: 'pid',
      width: 80,
      render: (_text: unknown, record: ServiceInfo) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
          {record.pid ?? '—'}
        </span>
      ),
    },
    {
      title: 'MEM (MB)',
      dataIndex: 'memMb',
      key: 'memMb',
      width: 100,
      render: (_text: unknown, record: ServiceInfo) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
          {record.memMb != null ? record.memMb.toFixed(1) : '—'}
        </span>
      ),
    },
    {
      title: 'CPU (%)',
      dataIndex: 'cpuPct',
      key: 'cpuPct',
      width: 90,
      render: (_text: unknown, record: ServiceInfo) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
          {record.cpuPct != null ? record.cpuPct.toFixed(1) : '—'}
        </span>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 200,
      render: (_text: unknown, record: ServiceInfo) => {
        const busy = busyIds.has(record.id);
        return (
          <div className="ga-status-actions">
            {record.running ? (
              <>
                {record.managed && (
                  <Button
                    size="small"
                    icon={<IconRefresh />}
                    theme="borderless"
                    loading={busy}
                    onClick={() => handleRestart(record)}
                  >
                    {t('act.restart')}
                  </Button>
                )}
                <Button
                  size="small"
                  icon={record.managed ? <IconStop /> : <IconClose />}
                  theme="borderless"
                  type="danger"
                  loading={busy}
                  onClick={() => handleStop(record)}
                >
                  {record.managed ? t('act.stop') : t('act.exit')}
                </Button>
              </>
            ) : (
              record.managed && (
                <Button
                  size="small"
                  icon={<IconPlay />}
                  theme="borderless"
                  type="primary"
                  loading={busy}
                  onClick={() => handleStart(record)}
                >
                  {t('act.start')}
                </Button>
              )
            )}
            <Button
              size="small"
              icon={<IconFile />}
              theme="borderless"
              onClick={() => setLogTarget(record.id)}
            >
              {t('act.logs')}
            </Button>
          </div>
        );
      },
    },
  ];

  if (bridgeStatus !== 'ready') {
    return (
      <div className="ga-services-loading">
        {bridgeStatus === 'connecting' ? <Spin size="large" /> : null}
        <span>{bridgeStatus === 'connecting' ? t('bridge.connecting') : t('bridge.offline')}</span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="ga-services-loading">
        <Spin size="large" />
      </div>
    );
  }

  if (services.length === 0) {
    return <Empty description={t('st.offline')} />;
  }

  return (
    <div className="ga-status-panel">
      <Table
        columns={columns}
        dataSource={services}
        rowKey="id"
        pagination={false}
        size="small"
        bordered={false}
      />
      <ChannelLogModal
        serviceId={logTarget}
        onClose={() => setLogTarget(null)}
      />
    </div>
  );
}
