import { create } from 'zustand';
import { subscribe } from '../services/ws';

const BRIDGE_BASE = 'http://127.0.0.1:14168';

export interface ServiceInfo {
  id: string;
  name: string;
  status: 'running' | 'offline' | 'error';
  running: boolean;
  pid: number | null;
  memMb: number | null;
  cpuPct: number | null;
  managed: boolean;
  lastError: string | null;
}

interface ServicesState {
  services: ServiceInfo[];
  loading: boolean;
  error: string | null;
  mykeyContent: string;
  mykeyLoading: boolean;

  fetchServices: () => Promise<void>;
  startService: (id: string) => Promise<boolean>;
  stopService: (id: string) => Promise<boolean>;
  restartService: (id: string) => Promise<boolean>;
  fetchLogs: (id: string, tail?: number) => Promise<string[]>;
  fetchMykey: () => Promise<void>;
  saveMykey: (content: string) => Promise<boolean>;
}

export const useServicesStore = create<ServicesState>((set, get) => {
  // Subscribe to WS events for real-time updates
  subscribe('services.snapshot', (data: unknown) => {
    const evt = data as { services?: ServiceInfo[] };
    if (evt.services) {
      set({ services: evt.services, loading: false, error: null });
    }
  });

  subscribe('service.changed', (data: unknown) => {
    const evt = data as { service?: ServiceInfo };
    if (evt.service) {
      set((s) => ({
        services: s.services.map((svc) =>
          svc.id === evt.service!.id ? evt.service! : svc,
        ),
      }));
    }
  });

  return {
    services: [],
    loading: true,
    error: null,
    mykeyContent: '',
    mykeyLoading: false,

    async fetchServices() {
      set({ loading: true, error: null });
      try {
        const res = await fetch(`${BRIDGE_BASE}/services/panel`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        set({ services: data.services ?? [], loading: false });
      } catch (e) {
        set({ loading: false, error: (e as Error).message });
      }
    },

    async startService(id: string) {
      try {
        const res = await fetch(`${BRIDGE_BASE}/services/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.service) {
          set((s) => ({
            services: s.services.map((svc) =>
              svc.id === data.service.id ? data.service : svc,
            ),
          }));
        }
        return data.ok ?? true;
      } catch {
        return false;
      }
    },

    async stopService(id: string) {
      try {
        const res = await fetch(`${BRIDGE_BASE}/services/stop`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.service) {
          set((s) => ({
            services: s.services.map((svc) =>
              svc.id === data.service.id ? data.service : svc,
            ),
          }));
        }
        return data.ok ?? true;
      } catch {
        return false;
      }
    },

    async restartService(id: string) {
      const stopped = await get().stopService(id);
      if (!stopped) return false;
      // Brief delay to allow the process to fully stop
      await new Promise((r) => setTimeout(r, 500));
      return get().startService(id);
    },

    async fetchLogs(id: string, tail = 200) {
      try {
        const res = await fetch(
          `${BRIDGE_BASE}/services/logs?id=${encodeURIComponent(id)}&tail=${tail}`,
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        return data.lines ?? [];
      } catch {
        return [];
      }
    },

    async fetchMykey() {
      set({ mykeyLoading: true });
      try {
        const res = await fetch(`${BRIDGE_BASE}/services/mykey`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        set({ mykeyContent: data.content ?? '', mykeyLoading: false });
      } catch {
        set({ mykeyLoading: false });
      }
    },

    async saveMykey(content: string) {
      try {
        const res = await fetch(`${BRIDGE_BASE}/services/mykey`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.ok) {
          set({ mykeyContent: content });
        }
        return data.ok ?? false;
      } catch {
        return false;
      }
    },
  };
});
