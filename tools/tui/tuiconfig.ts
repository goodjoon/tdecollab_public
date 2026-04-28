import { cosmiconfig } from 'cosmiconfig';
import fs from 'fs';
import path from 'path';
import os from 'os';

export interface TuiConfig {
  accent?: string;
  menuWidth?: number;
  logHeight?: number;
  showKeys?: boolean;
  presets?: Record<string, Record<string, string | boolean>>;
  lastUsed?: Record<string, Record<string, string | boolean>>;
}

const explorer = cosmiconfig('tdecollab', {
  searchPlaces: [
    '.tdecollab.json',
    '.tdecollab.yaml',
    '.tdecollab.yml',
    'tdecollab.config.json',
    path.join(os.homedir(), '.tdecollab.json'),
  ],
});

let _config: TuiConfig | null = null;
let _configPath: string | null = null;

export async function loadTuiConfig(): Promise<TuiConfig> {
  if (_config) return _config;
  try {
    const result = await explorer.search();
    if (result) {
      _config = result.config as TuiConfig;
      _configPath = result.filepath;
    } else {
      _config = {};
    }
  } catch {
    _config = {};
  }
  return _config!;
}

export function getDefaultConfigPath(): string {
  return path.join(process.cwd(), '.tdecollab.json');
}

// 설정 저장 (lastUsed / presets 갱신)
export function saveTuiConfig(updates: Partial<TuiConfig>): void {
  const configPath = _configPath ?? getDefaultConfigPath();
  let existing: TuiConfig = {};
  if (fs.existsSync(configPath)) {
    try {
      existing = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    } catch {
      existing = {};
    }
  }
  const merged = {
    ...existing,
    ...updates,
    presets: { ...(existing.presets ?? {}), ...(updates.presets ?? {}) },
    lastUsed: { ...(existing.lastUsed ?? {}), ...(updates.lastUsed ?? {}) },
  };
  fs.writeFileSync(configPath, JSON.stringify(merged, null, 2), 'utf-8');
  _config = merged;
}

// 특정 커맨드의 마지막 사용 값 저장
export function saveLastUsed(commandKey: string, values: Record<string, string | boolean>): void {
  saveTuiConfig({ lastUsed: { [commandKey]: values } });
}

// 폼 초기값: lastUsed 우선, 없으면 field.defaultValue
export function getInitialValues(
  commandKey: string,
  fields: Array<{ key: string; defaultValue?: string | boolean }>,
  config: TuiConfig,
): Record<string, string | boolean> {
  const last = config.lastUsed?.[commandKey] ?? {};
  const result: Record<string, string | boolean> = {};
  for (const f of fields) {
    if (f.key in last) {
      result[f.key] = last[f.key];
    } else if (f.defaultValue !== undefined) {
      result[f.key] = f.defaultValue;
    } else {
      result[f.key] = '';
    }
  }
  return result;
}
