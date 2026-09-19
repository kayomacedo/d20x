import type { HistoryItem, RollResult } from './types';

export const HISTORY_LIMIT = 80;

function createdAtFromItem(item: Partial<HistoryItem>, index: number): number {
  if (typeof item.createdAt === 'number' && Number.isFinite(item.createdAt)) {
    return item.createdAt;
  }
  const fromId = Number(String(item.id ?? '').split('-')[0]);
  if (Number.isFinite(fromId) && fromId > 1e12) return fromId;
  return Date.now() - index;
}

export function newHistoryItem(result: RollResult, timestamp: string): HistoryItem {
  const createdAt = Date.now();
  return {
    id: `${createdAt}-${Math.random().toString(36).slice(2, 8)}`,
    result,
    timestamp,
    createdAt,
    favorite: false,
  };
}

export function normalizeHistory(items: Array<Partial<HistoryItem> & { result: RollResult; timestamp: string }>): HistoryItem[] {
  return items.map((item, index) => ({
    id: item.id || `legacy-${index}-${item.timestamp}`,
    result: item.result,
    timestamp: item.timestamp,
    createdAt: createdAtFromItem(item, index),
    favorite: Boolean(item.favorite),
  }));
}

export function capHistory(items: HistoryItem[]): HistoryItem[] {
  const next = [...items];
  for (let i = next.length - 1; i >= 0 && next.length > HISTORY_LIMIT; i -= 1) {
    if (!next[i].favorite) next.splice(i, 1);
  }
  return next;
}
