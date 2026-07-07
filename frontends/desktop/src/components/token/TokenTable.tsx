import { useMemo } from 'react';
import { Table, Tag, Empty } from '@douyinfe/semi-ui';
import type { ColumnProps } from '@douyinfe/semi-ui/lib/es/table';
import { useI18n } from '../../i18n';
import { useTokenStore, type HistoryEntry } from '../../stores/token';
import { formatTokenCount } from '../../utils/format';

interface Props {
  /** If provided, renders this data instead of the store's chat history */
  dataSource?: HistoryEntry[];
  loading?: boolean;
}

export function TokenTable({ dataSource, loading: loadingProp }: Props) {
  const { t } = useI18n();
  const storeHistory = useTokenStore((s) => s.history);
  const storeLoading = useTokenStore((s) => s.loading);
  const dateRange = useTokenStore((s) => s.dateRange);

  const history = dataSource ?? storeHistory;
  const loading = loadingProp ?? storeLoading;

  const filteredHistory = useMemo(() => {
    // Only apply date filter to store history (not externally-provided data)
    if (dataSource) return dataSource;
    const [from, to] = dateRange;
    if (!from && !to) return history;
    return history.filter((entry) => {
      if (from && entry.ts < from.getTime()) return false;
      if (to && entry.ts > to.getTime()) return false;
      return true;
    });
  }, [history, dateRange, dataSource]);

  const columns: ColumnProps<HistoryEntry>[] = [
    {
      title: t('tok.colSession'),
      dataIndex: 'title',
      key: 'title',
      render: (_text: unknown, record: HistoryEntry) => (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>{record.title || record.id}</span>
          {record.deleted && (
            <Tag size="small" color="orange" type="ghost">
              {t('tok.deleted')}
            </Tag>
          )}
        </span>
      ),
    },
    {
      title: t('tok.colIn'),
      dataIndex: 'input',
      key: 'input',
      width: 100,
      sorter: (a?: HistoryEntry, b?: HistoryEntry) => (a?.input ?? 0) - (b?.input ?? 0),
      render: (_text: unknown, record: HistoryEntry) => (
        <span className="ga-token-mono">{formatTokenCount(record.input)}</span>
      ),
    },
    {
      title: t('tok.colOut'),
      dataIndex: 'output',
      key: 'output',
      width: 100,
      sorter: (a?: HistoryEntry, b?: HistoryEntry) => (a?.output ?? 0) - (b?.output ?? 0),
      render: (_text: unknown, record: HistoryEntry) => (
        <span className="ga-token-mono">{formatTokenCount(record.output)}</span>
      ),
    },
    {
      title: t('tok.colCacheW'),
      dataIndex: 'cacheWrite',
      key: 'cacheWrite',
      width: 110,
      sorter: (a?: HistoryEntry, b?: HistoryEntry) => (a?.cacheWrite ?? 0) - (b?.cacheWrite ?? 0),
      render: (_text: unknown, record: HistoryEntry) => (
        <span className="ga-token-mono">{formatTokenCount(record.cacheWrite)}</span>
      ),
    },
    {
      title: t('tok.colCache'),
      dataIndex: 'cacheRead',
      key: 'cacheRead',
      width: 110,
      sorter: (a?: HistoryEntry, b?: HistoryEntry) => (a?.cacheRead ?? 0) - (b?.cacheRead ?? 0),
      render: (_text: unknown, record: HistoryEntry) => (
        <span className="ga-token-mono">{formatTokenCount(record.cacheRead)}</span>
      ),
    },
    {
      title: t('tok.cost'),
      key: 'cacheRate',
      width: 100,
      render: (_text: unknown, record: HistoryEntry) => {
        const total = record.input + record.output + record.cacheWrite + record.cacheRead;
        const rate = total > 0 ? ((record.cacheRead / total) * 100).toFixed(1) : '0';
        return <span className="ga-token-mono">{rate}%</span>;
      },
    },
  ];

  if (!loading && filteredHistory.length === 0) {
    return <Empty description={t('tok.noData')} style={{ marginTop: 32 }} />;
  }

  return (
    <Table
      columns={columns}
      dataSource={filteredHistory}
      rowKey="id"
      loading={loading}
      pagination={{ pageSize: 10, showTotal: true }}
      size="small"
      bordered={false}
    />
  );
}
