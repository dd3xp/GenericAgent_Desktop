import { create } from 'zustand';

export type PageId = 'chat' | 'services' | 'collab' | 'token';

interface AppState {
  activePage: PageId;
  sidebarCollapsed: boolean;
  setPage: (page: PageId) => void;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  activePage: 'chat',
  sidebarCollapsed: false,

  setPage: (page) => set({ activePage: page }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
}));

// Legacy interop: listen for ga:go-page CustomEvent from vanilla app.js
if (typeof window !== 'undefined') {
  window.addEventListener('ga:go-page', ((e: CustomEvent<{ page: PageId }>) => {
    useAppStore.getState().setPage(e.detail.page);
  }) as EventListener);
}
