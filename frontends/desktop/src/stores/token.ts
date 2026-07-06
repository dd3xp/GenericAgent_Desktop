import { create } from 'zustand';

const BRIDGE_BASE = 'http://127.0.0.1:14168';
const CONDUCTOR_BASE = 'http://127.0.0.1:8900';

export interface TokenRecord {
  thread: string;
  input: number;
  output: number;
  cacheCreate: number;
  cacheRead: number;
  model: string;
}

export interface HistoryEntry {
  id: string;
  title: string;
  input: number;
  output: number;
  cacheWrite: number;
  cacheRead: number;
  model: string;
  ts: number;
  deleted?: boolean;
}

export interface TokenSnapshot {
  totalInput: number;
  totalOutput: number;
  totalCacheWrite: number;
  totalCacheRead: number;
}

interface TokenState {
  // Chat tab
  history: HistoryEntry[];
  snapshot: TokenSnapshot;
  loading: boolean;
  error: string | null;

  // Conductor tab
  conductorHistory: HistoryEntry[];
  conductorSnapshot: TokenSnapshot;
  conductorLoading: boolean;
  conductorOffline: boolean;

  // Filters
  dateRange: [Date | null, Date | null];

  // Actions
  fetchHistory: () => Promise<void>;
  fetchConductorHistory: () => Promise<void>;
  fetchLiveStats: () => Promise<void>;
  setDateRange: (range: [Date | null, Date | null]) => void;
  resetFilters: () => void;
}

function emptySnapshot(): TokenSnapshot {
  return { totalInput: 0, totalOutput: 0, totalCacheWrite: 0, totalCacheRead: 0 };
}

export const useTokenStore = create<TokenState>((set) => ({
  history: [],
  snapshot: emptySnapshot(),
  loading: true,
  error: null,

  conductorHistory: [],
  conductorSnapshot: emptySnapshot(),
  conductorLoading: false,
  conductorOffline: false,

  dateRange: [null, null],

  async fetchHistory() {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${BRIDGE_BASE}/token-history`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const history: HistoryEntry[] = data.history ?? [];
      const snap: TokenSnapshot = data.snap ?? emptySnapshot();

      set({
        history,
        snapshot: snap,
        loading: false,
      });

      // Also load conductor data if present in response
      if (data.conductorHist) {
        set({
          conductorHistory: data.conductorHist,
          conductorSnapshot: data.conductorLast ?? emptySnapshot(),
        });
      }
    } catch (e) {
      set({ loading: false, error: (e as Error).message });
    }
  },

  async fetchConductorHistory() {
    set({ conductorLoading: true });
    try {
      const res = await fetch(`${CONDUCTOR_BASE}/token-stats`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const records: TokenRecord[] = data.records ?? [];
      // Convert records to history entries
      const entries: HistoryEntry[] = records.map((r, i) => ({
        id: `cond-${i}`,
        title: r.thread || `Conductor ${i + 1}`,
        input: r.input,
        output: r.output,
        cacheWrite: r.cacheCreate,
        cacheRead: r.cacheRead,
        model: r.model,
        ts: Date.now(),
      }));

      const snap: TokenSnapshot = entries.reduce(
        (acc, e) => ({
          totalInput: acc.totalInput + e.input,
          totalOutput: acc.totalOutput + e.output,
          totalCacheWrite: acc.totalCacheWrite + e.cacheWrite,
          totalCacheRead: acc.totalCacheRead + e.cacheRead,
        }),
        emptySnapshot(),
      );

      set({
        conductorHistory: entries,
        conductorSnapshot: snap,
        conductorLoading: false,
        conductorOffline: false,
      });
    } catch {
      set({ conductorLoading: false, conductorOffline: true });
    }
  },

  async fetchLiveStats() {
    try {
      const res = await fetch(`${BRIDGE_BASE}/token-stats`);
      if (!res.ok) return;
      const data = await res.json();
      const records: TokenRecord[] = data.records ?? [];

      // Aggregate current stats into snapshot
      const snap: TokenSnapshot = records.reduce(
        (acc, r) => ({
          totalInput: acc.totalInput + r.input,
          totalOutput: acc.totalOutput + r.output,
          totalCacheWrite: acc.totalCacheWrite + r.cacheCreate,
          totalCacheRead: acc.totalCacheRead + r.cacheRead,
        }),
        emptySnapshot(),
      );

      set({ snapshot: snap });
    } catch {
      // Silently ignore — live stats are best-effort
    }
  },

  setDateRange(range: [Date | null, Date | null]) {
    set({ dateRange: range });
  },

  resetFilters() {
    set({ dateRange: [null, null] });
  },
}));
