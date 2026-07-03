import { create } from 'zustand';
import { createSession, sendPrompt, pollMessages, cancelGeneration, listSessions, type Message, type SessionInfo } from '../services/chat';
import { subscribe } from '../services/ws';

const PARTIAL_MSG_ID = '__partial__';
const POLL_INTERVAL_MS = 1000;

interface ChatState {
  activeSessionId: string | null;
  messages: Message[];
  status: 'idle' | 'running';
  sessions: SessionInfo[];
  turnStartedAt: number | null;

  newSession: () => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
  cancel: () => Promise<void>;
  setActiveSession: (id: string | null) => void;
  loadSessions: () => Promise<void>;
}

// rAF throttle state for partial updates (WS path)
let pendingPartial: Message | null = null;
let rafId: number | null = null;

// Fallback polling state
let pollTimer: ReturnType<typeof setInterval> | null = null;

export const useChatStore = create<ChatState>((set, get) => {
  function mergeMessages(current: Message[], incoming: Message[], partial?: Message): Message[] {
    const withoutPartial = current.filter((m) => m.id !== PARTIAL_MSG_ID);
    const localMsgs = withoutPartial.filter((m) => String(m.id).startsWith('local-'));
    let merged = withoutPartial.filter((m) => !String(m.id).startsWith('local-'));

    for (const inc of incoming) {
      if (merged.some((m) => m.id === inc.id)) continue;
      const localIdx = localMsgs.findIndex((l) => l.role === inc.role && l.content === inc.content);
      if (localIdx >= 0) {
        localMsgs.splice(localIdx, 1);
      }
      merged.push(inc);
    }
    merged = [...merged, ...localMsgs];
    merged.sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));

    if (partial) {
      merged.push({ ...partial, id: PARTIAL_MSG_ID, status: 'in_progress' });
    }
    return merged;
  }

  function flushPartial() {
    rafId = null;
    if (!pendingPartial) return;
    const partial = pendingPartial;
    pendingPartial = null;
    const { messages } = get();
    const withoutPartial = messages.filter((m) => m.id !== PARTIAL_MSG_ID);
    set({ messages: [...withoutPartial, partial] });
  }

  function startPolling() {
    stopPolling();
    pollTimer = setInterval(() => {
      const { activeSessionId, status } = get();
      if (!activeSessionId || status !== 'running') { stopPolling(); return; }
      pollMessages(activeSessionId).then((result) => {
        set((s) => ({
          messages: mergeMessages(s.messages, result.messages, result.partial),
          status: result.status,
          turnStartedAt: result.status === 'running' ? s.turnStartedAt : null,
        }));
        if (result.status !== 'running') stopPolling();
      }).catch(() => {});
    }, POLL_INTERVAL_MS);
  }

  function stopPolling() {
    if (pollTimer !== null) { clearInterval(pollTimer); pollTimer = null; }
  }

  // Real-time partial updates via WebSocket — rAF throttled (faster path)
  subscribe('partial-update', (data: unknown) => {
    const evt = data as { sessionId?: string; content?: string; turn_segs?: string[]; curr_turn?: number };
    const { activeSessionId } = get();
    if (!evt.sessionId || evt.sessionId !== activeSessionId) return;

    pendingPartial = {
      id: PARTIAL_MSG_ID,
      role: 'assistant',
      content: evt.content || '',
      status: 'in_progress',
      turn_segs: evt.turn_segs,
    };

    if (rafId === null) {
      rafId = requestAnimationFrame(flushPartial);
    }
  });

  // On session-state change
  subscribe('session-state', (data: unknown) => {
    const evt = data as { sessionId?: string; status?: string };
    const { activeSessionId } = get();
    if (evt.sessionId && evt.sessionId === activeSessionId) {
      if (evt.status === 'running') {
        set({ status: 'running', turnStartedAt: get().turnStartedAt ?? Date.now() });
        startPolling();
      } else if (evt.status === 'idle' || evt.status === 'error' || evt.status === 'cancelled') {
        stopPolling();
        if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
        pendingPartial = null;

        set({ status: 'idle', turnStartedAt: null });
        pollMessages(activeSessionId).then((result) => {
          set((s) => ({
            messages: mergeMessages(
              s.messages.filter((m) => m.id !== PARTIAL_MSG_ID),
              result.messages,
              undefined,
            ),
            status: result.status,
          }));
        }).catch(() => {});
      }
    }
    if (evt.status === 'idle' || evt.status === 'error') {
      listSessions().then((sessions) => set({ sessions })).catch(() => {});
    }
  });

  listSessions().then((sessions) => set({ sessions })).catch(() => {});

  return {
    activeSessionId: null,
    messages: [],
    status: 'idle',
    sessions: [],
    turnStartedAt: null,

    async newSession() {
      const sessionId = await createSession();
      set({ activeSessionId: sessionId, messages: [], status: 'idle', turnStartedAt: null });
      get().loadSessions();
    },

    async sendMessage(text: string) {
      let { activeSessionId } = get();
      if (!activeSessionId) {
        activeSessionId = await createSession();
        set({ activeSessionId });
        get().loadSessions();
      }
      const now = Date.now();
      const userMsg: Message = { id: `local-${now}`, role: 'user', content: text, status: 'completed', createdAt: now };
      set((s) => ({ messages: [...s.messages, userMsg], status: 'running', turnStartedAt: now }));
      startPolling();
      await sendPrompt(activeSessionId, text);
    },

    async cancel() {
      const { activeSessionId } = get();
      if (!activeSessionId) return;
      await cancelGeneration(activeSessionId);
    },

    setActiveSession(id: string | null) {
      stopPolling();
      set({ activeSessionId: id, messages: [], status: 'idle', turnStartedAt: null });
      if (id) {
        pollMessages(id).then((result) => {
          set({
            messages: mergeMessages([], result.messages, result.partial),
            status: result.status,
          });
          if (result.status === 'running') {
            set({ turnStartedAt: Date.now() });
            startPolling();
          }
        }).catch(() => {});
      }
    },

    async loadSessions() {
      try {
        const sessions = await listSessions();
        set({ sessions });
      } catch {}
    },
  };
});
