import Constants from 'expo-constants';
import { Linking } from 'react-native';

export type UpdateFeed = {
  version: string;
  build?: number;
  apkUrl: string;
  notes: string;
  force?: boolean;
};

export type UpdateCheck =
  | { status: 'unavailable' }
  | { status: 'current'; installed: string }
  | { status: 'available'; installed: string; latest: UpdateFeed }
  | { status: 'error'; message: string };

const extra = (Constants.expoConfig?.extra ?? {}) as {
  updateFeedUrl?: string;
};

export function installedVersion(): string {
  return Constants.expoConfig?.version ?? '1.0.0';
}

export function updateFeedUrl(): string {
  return (extra.updateFeedUrl ?? '').trim();
}

export function compareVersions(a: string, b: string): number {
  const left = a.split('.').map((part) => Number.parseInt(part, 10) || 0);
  const right = b.split('.').map((part) => Number.parseInt(part, 10) || 0);
  const size = Math.max(left.length, right.length);
  for (let i = 0; i < size; i += 1) {
    const diff = (left[i] ?? 0) - (right[i] ?? 0);
    if (diff !== 0) return diff > 0 ? 1 : -1;
  }
  return 0;
}

function asFeed(value: unknown): UpdateFeed | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Partial<UpdateFeed>;
  if (typeof raw.version !== 'string' || !raw.version.trim()) return null;
  return {
    version: raw.version.trim(),
    build: typeof raw.build === 'number' ? raw.build : undefined,
    apkUrl: typeof raw.apkUrl === 'string' ? raw.apkUrl.trim() : '',
    notes: typeof raw.notes === 'string' ? raw.notes.trim() : '',
    force: Boolean(raw.force),
  };
}

export async function checkForUpdate(): Promise<UpdateCheck> {
  const installed = installedVersion();
  const url = updateFeedUrl();
  if (!url) return { status: 'unavailable' };

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(url, {
      signal: controller.signal,
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timer);
    if (!response.ok) return { status: 'error', message: 'Não deu para falar com o servidor.' };

    const feed = asFeed(await response.json());
    if (!feed) return { status: 'error', message: 'O aviso de versão veio inválido.' };
    feed.apkUrl = resolveApkUrl(feed.apkUrl, url);
    if (compareVersions(feed.version, installed) > 0) {
      return { status: 'available', installed, latest: feed };
    }
    return { status: 'current', installed };
  } catch {
    return { status: 'error', message: 'Sem internet ou o link do update não abriu.' };
  }
}

function resolveApkUrl(apkUrl: string, feedUrl: string): string {
  if (!apkUrl) return '';
  if (/^https?:\/\//i.test(apkUrl)) return apkUrl;
  try {
    return new URL(apkUrl, feedUrl).toString();
  } catch {
    return apkUrl;
  }
}

export async function openApk(url: string): Promise<boolean> {
  if (!url) return false;
  const supported = await Linking.canOpenURL(url).catch(() => true);
  if (!supported) return false;
  await Linking.openURL(url);
  return true;
}
