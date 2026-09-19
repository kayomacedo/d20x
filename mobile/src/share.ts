import { Platform, Share } from 'react-native';
import { normalizeRoomCode } from './room';

export function roomCodeFromUrl(): string {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return '';
  return normalizeRoomCode(new URLSearchParams(window.location.search).get('sala') ?? '');
}

export function writeRoomCodeToUrl(code: string | null) {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  if (code) url.searchParams.set('sala', code);
  else url.searchParams.delete('sala');
  window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
}

export function roomInviteText(code: string): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const url = new URL(window.location.href);
    url.searchParams.set('sala', code);
    return `Entra na sala ${code} do D20X: ${url.toString()}`;
  }
  return `Entra na sala ${code} do D20X para a gente rolar junto.`;
}

export async function shareRoomCode(code: string): Promise<'shared' | 'copied' | 'none'> {
  const message = roomInviteText(code);

  if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
    try {
      if (navigator.share) {
        await navigator.share({ title: `Sala ${code}`, text: message });
        return 'shared';
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'none';
    }

    try {
      await navigator.clipboard.writeText(message);
      return 'copied';
    } catch {
      return 'none';
    }
  }

  try {
    await Share.share({ message });
    return 'shared';
  } catch {
    return 'none';
  }
}
