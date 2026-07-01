export interface AppConfig {
  lang: 'zh' | 'en';
  theme: string;
  appearance: 'light' | 'dark';
  plain: boolean;
  fontSize: number;
  llmNo: number;
}

export interface ModelProfile {
  id: number;
  name: string;
  model: string;
  apibase: string;
  apikey?: string;
  protocol: 'oai' | 'claude';
  stream: boolean;
  max_retries?: number;
  connect_timeout?: number;
  read_timeout?: number;
  kind?: 'mixin';
  members?: number[];
}

interface GaApi {
  getConfig: () => Promise<{ config: AppConfig }>;
  saveConfig: (cfg: { config: Partial<AppConfig> }) => Promise<void>;
  getModelProfiles: () => Promise<{ profiles: ModelProfile[] }>;
  rpc: (method: string, params: Record<string, unknown>) => Promise<unknown>;
  getMykeyContent: () => Promise<{ content: string }>;
  saveMykeyContent: (content: string) => Promise<void>;
  tauriInvoke: (cmd: string, args: Record<string, unknown>) => Promise<unknown>;
}

const MOCK_PROFILES: ModelProfile[] = [
  { id: 1, name: 'DeepSeek Chat', model: 'deepseek-chat', apibase: 'https://api.deepseek.com/v1', protocol: 'oai', stream: true },
  { id: 2, name: 'Claude Sonnet', model: 'claude-sonnet-4-20250514', apibase: 'https://api.anthropic.com/v1', protocol: 'claude', stream: true },
];

const MOCK_CONFIG: AppConfig = {
  lang: (localStorage.getItem('ga_lang') as 'zh' | 'en') || 'zh',
  theme: localStorage.getItem('ga_theme') || 'light',
  appearance: (localStorage.getItem('ga_appearance') as 'light' | 'dark') || 'light',
  plain: localStorage.getItem('ga_plain') === '1',
  fontSize: parseInt(localStorage.getItem('ga_chatFontSize') || '14', 10),
  llmNo: 0,
};

let mockProfiles = [...MOCK_PROFILES];
let nextMockId = 100;

function ga(): GaApi | null {
  const w = window as unknown as { ga?: GaApi };
  return w.ga || null;
}

function isBridgeAvailable(): boolean {
  const api = ga();
  if (!api) return false;
  return true;
}

export async function getConfig(): Promise<AppConfig> {
  if (!isBridgeAvailable()) return { ...MOCK_CONFIG };
  try {
    const res = await ga()!.getConfig();
    return res.config;
  } catch {
    return { ...MOCK_CONFIG };
  }
}

export async function saveConfig(config: Partial<AppConfig>): Promise<void> {
  if (!isBridgeAvailable()) return;
  try {
    await ga()!.saveConfig({ config });
  } catch {}
}

export async function getModelProfiles(): Promise<ModelProfile[]> {
  if (!isBridgeAvailable()) return [...mockProfiles];
  try {
    const res = await ga()!.getModelProfiles();
    return res.profiles || [];
  } catch {
    return [...mockProfiles];
  }
}

export async function addModelProfile(data: Partial<ModelProfile>): Promise<ModelProfile[]> {
  if (!isBridgeAvailable()) {
    mockProfiles.push({ id: nextMockId++, name: '', model: '', apibase: '', protocol: 'oai', stream: true, ...data } as ModelProfile);
    return [...mockProfiles];
  }
  const res = await ga()!.rpc('model-profiles/add', data) as { profiles: ModelProfile[] };
  return res.profiles;
}

export async function editModelProfile(id: number, data: Partial<ModelProfile>): Promise<ModelProfile[]> {
  if (!isBridgeAvailable()) {
    mockProfiles = mockProfiles.map((p) => p.id === id ? { ...p, ...data } : p);
    return [...mockProfiles];
  }
  const res = await ga()!.rpc('model-profiles/edit', { id, ...data }) as { profiles: ModelProfile[] };
  return res.profiles;
}

export async function deleteModelProfile(id: number): Promise<ModelProfile[]> {
  if (!isBridgeAvailable()) {
    mockProfiles = mockProfiles.filter((p) => p.id !== id);
    return [...mockProfiles];
  }
  const res = await ga()!.rpc('model-profiles/delete', { id }) as { profiles: ModelProfile[] };
  return res.profiles;
}

export async function addToMixin(id: number): Promise<ModelProfile[]> {
  if (!isBridgeAvailable()) return [...mockProfiles];
  const res = await ga()!.rpc('model-profiles/mixin-add', { id }) as { profiles: ModelProfile[] };
  return res.profiles;
}

export async function removeFromMixin(id: number): Promise<ModelProfile[]> {
  if (!isBridgeAvailable()) return [...mockProfiles];
  const res = await ga()!.rpc('model-profiles/mixin-remove', { id }) as { profiles: ModelProfile[] };
  return res.profiles;
}

export async function getMykeyContent(): Promise<string> {
  if (!isBridgeAvailable()) return '# mock mykey content\npass\n';
  try {
    const res = await ga()!.getMykeyContent();
    return res.content;
  } catch {
    return '';
  }
}

export async function saveMykeyContent(content: string): Promise<void> {
  if (!isBridgeAvailable()) {
    console.log('[mock] saveMykeyContent:', content.slice(0, 50));
    return;
  }
  await ga()!.saveMykeyContent(content);
}

export async function tauriInvoke(cmd: string, args: Record<string, unknown>): Promise<unknown> {
  if (!isBridgeAvailable()) throw new Error('Tauri not available in browser dev mode');
  return ga()!.tauriInvoke(cmd, args);
}
