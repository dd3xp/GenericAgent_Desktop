const LOCAL_BRIDGE_BASE = 'http://127.0.0.1:14168';
const LOCAL_CONDUCTOR_BASE = 'http://127.0.0.1:8900';

const isTauri = typeof window !== 'undefined' && (
  '__TAURI_INTERNALS__' in window
  || '__TAURI__' in window
  || window.location.protocol === 'tauri:'
);
const isDeployedWeb = typeof window !== 'undefined'
  && !isTauri
  && !import.meta.env.DEV
  && /^https?:$/.test(window.location.protocol);

function withoutTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

function websocketUrl(httpBase: string, path: string): string {
  const url = new URL(httpBase);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.pathname = `${url.pathname.replace(/\/$/, '')}${path}`;
  url.search = '';
  url.hash = '';
  return url.toString();
}

const deployedOrigin = isDeployedWeb ? withoutTrailingSlash(window.location.origin) : '';

export const BRIDGE_BASE = withoutTrailingSlash(
  import.meta.env.VITE_BRIDGE_BASE || deployedOrigin || LOCAL_BRIDGE_BASE,
);
export const CONDUCTOR_BASE = withoutTrailingSlash(
  import.meta.env.VITE_CONDUCTOR_BASE
    || (isDeployedWeb ? `${deployedOrigin}/conductor` : LOCAL_CONDUCTOR_BASE),
);
export const WS_URL = websocketUrl(BRIDGE_BASE, '/ws');
export const CONDUCTOR_WS_URL = websocketUrl(CONDUCTOR_BASE, '/ws');
