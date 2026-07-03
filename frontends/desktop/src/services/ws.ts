type WsHandler = (payload: unknown) => void;

const WS_URL = 'ws://127.0.0.1:14168/ws';
const RECONNECT_BASE_MS = 1000;
const RECONNECT_MAX_MS = 30000;

let ws: WebSocket | null = null;
let reconnectAttempt = 0;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Map<string, Set<WsHandler>>();

function connect() {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;

  try {
    ws = new WebSocket(WS_URL);
  } catch {
    scheduleReconnect();
    return;
  }

  ws.onopen = () => {
    reconnectAttempt = 0;
  };

  ws.onmessage = (ev) => {
    try {
      const data = JSON.parse(ev.data);
      const type = data.type as string;
      if (!type) return;
      const handlers = listeners.get(type);
      if (handlers) {
        handlers.forEach((fn) => fn(data));
      }
    } catch {}
  };

  ws.onclose = () => {
    ws = null;
    scheduleReconnect();
  };

  ws.onerror = () => {
    ws?.close();
  };
}

function scheduleReconnect() {
  if (reconnectTimer) return;
  const delay = Math.min(RECONNECT_BASE_MS * 2 ** reconnectAttempt, RECONNECT_MAX_MS);
  reconnectAttempt++;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connect();
  }, delay);
}

export function subscribe(type: string, handler: WsHandler): () => void {
  if (!listeners.has(type)) listeners.set(type, new Set());
  listeners.get(type)!.add(handler);
  connect();
  return () => {
    listeners.get(type)?.delete(handler);
  };
}

export function disconnect() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  ws?.close();
  ws = null;
}
