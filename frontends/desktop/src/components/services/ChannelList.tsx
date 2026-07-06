import { useState, useCallback } from 'react';
import { Button, Tag, Spin, Empty } from '@douyinfe/semi-ui';
import { IconPlay, IconStop, IconFile, IconSetting } from '@douyinfe/semi-icons';
import { useI18n } from '../../i18n';
import { useServicesStore, type ServiceInfo } from '../../stores/services';
import { showError, showSuccess } from '../../utils/toast';
import { ChannelLogModal } from './ChannelLogModal';
import { MykeyConfigModal } from './MykeyConfigModal';

/** Map service script IDs to display labels */
const CHANNEL_LABELS: Record<string, string> = {
  'qqapp.py': 'ch.qq',
  'wechatapp.py': 'ch.wechat',
  'wecomapp.py': 'ch.wecom',
  'dingtalkapp.py': 'ch.dingtalk',
  'tgapp.py': 'ch.telegram',
  'dcapp.py': 'ch.discord',
  'fsapp.py': 'ch.lark',
};

/** Only show IM channel processes in this tab */
const CHANNEL_IDS = new Set(Object.keys(CHANNEL_LABELS));

function isChannelService(svc: ServiceInfo): boolean {
  return CHANNEL_IDS.has(svc.id) || CHANNEL_IDS.has(svc.name);
}

function StatusDot({ status }: { status: ServiceInfo['status'] }) {
  const colorMap: Record<string, string> = {
    running: 'green',
    offline: 'grey',
    error: 'red',
  };
  return (
    <Tag
      size="small"
      color={colorMap[status] as 'green' | 'grey' | 'red'}
      type="light"
      shape="circle"
      style={{ marginRight: 8 }}
    >
      {' '}
    </Tag>
  );
}

export function ChannelList() {
  const { t } = useI18n();
  const services = useServicesStore((s) => s.services);
  const loading = useServicesStore((s) => s.loading);
  const startService = useServicesStore((s) => s.startService);
  const stopService = useServicesStore((s) => s.stopService);

  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [logTarget, setLogTarget] = useState<string | null>(null);
  const [showMykey, setShowMykey] = useState(false);

  const channels = services.filter(isChannelService);

  const handleToggle = useCallback(
    async (svc: ServiceInfo) => {
      setBusyIds((prev) => new Set([...prev, svc.id]));
      try {
        if (svc.running) {
          const ok = await stopService(svc.id);
          if (ok) showSuccess(t('sys.channelStopped'));
          else showError(t('err.channelStop'));
        } else {
          const ok = await startService(svc.id);
          if (ok) showSuccess(t('sys.channelStarted'));
          else showError(t('err.channelStart'));
        }
      } finally {
        setBusyIds((prev) => {
          const next = new Set(prev);
          next.delete(svc.id);
          return next;
        });
      }
    },
    [startService, stopService, t],
  );

  if (loading) {
    return (
      <div className="ga-services-loading">
        <Spin size="large" />
        <span>{t('ch.loading')}</span>
      </div>
    );
  }

  if (channels.length === 0) {
    return <Empty description={t('ch.empty')} />;
  }

  return (
    <div className="ga-channel-list">
      {channels.map((svc) => {
        const labelKey = CHANNEL_LABELS[svc.id] || CHANNEL_LABELS[svc.name] || '';
        const label = labelKey ? t(labelKey) : svc.name;
        const busy = busyIds.has(svc.id);

        return (
          <div key={svc.id} className="ga-channel-card">
            <div className="ga-channel-card-info">
              <StatusDot status={svc.status} />
              <span className="ga-channel-card-name">{label}</span>
              <Tag size="small" color={svc.running ? 'green' : 'grey'} type="ghost">
                {svc.running ? t('st.online') : t('st.offline')}
              </Tag>
              {svc.lastError && (
                <Tag size="small" color="red" type="ghost">
                  {svc.lastError}
                </Tag>
              )}
            </div>
            <div className="ga-channel-card-actions">
              <Button
                size="small"
                icon={svc.running ? <IconStop /> : <IconPlay />}
                loading={busy}
                onClick={() => handleToggle(svc)}
                type={svc.running ? 'danger' : 'primary'}
                theme="light"
              >
                {svc.running ? t('act.stop') : t('act.start')}
              </Button>
              <Button
                size="small"
                icon={<IconFile />}
                theme="borderless"
                onClick={() => setLogTarget(svc.id)}
              >
                {t('act.logs')}
              </Button>
              <Button
                size="small"
                icon={<IconSetting />}
                theme="borderless"
                onClick={() => setShowMykey(true)}
              >
                {t('act.configure')}
              </Button>
            </div>
          </div>
        );
      })}

      <ChannelLogModal
        serviceId={logTarget}
        onClose={() => setLogTarget(null)}
      />
      <MykeyConfigModal
        visible={showMykey}
        onClose={() => setShowMykey(false)}
      />
    </div>
  );
}
