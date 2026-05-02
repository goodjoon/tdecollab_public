import fs from 'fs';
import path from 'path';
import os from 'os';
import type { HistoryEntry } from './state.js';

const HISTORY_FILE = path.join(os.homedir(), '.tdecollab_history.json');
const MAX_HISTORY = 100;

export function loadHistory(): HistoryEntry[] {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8')) as HistoryEntry[];
    }
  } catch {
    // 무시
  }
  return [];
}

export function appendHistory(entry: HistoryEntry): void {
  const history = loadHistory();
  history.unshift(entry);
  if (history.length > MAX_HISTORY) history.splice(MAX_HISTORY);
  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), 'utf-8');
  } catch {
    // 무시
  }
}

export function clearHistory(): void {
  try {
    if (fs.existsSync(HISTORY_FILE)) fs.unlinkSync(HISTORY_FILE);
  } catch {
    // 무시
  }
}
