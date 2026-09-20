import * as Clipboard from 'expo-clipboard';
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

function roomLink(code: string): string | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  const url = new URL(window.location.href);
  url.searchParams.set('sala', code);
  return url.toString();
}

export function roomInviteText(code: string, title?: string): string {
  const link = roomLink(code);
  const boxed = [
    title ? `D20X · ${title}` : 'D20X · sala da mesa',
    '',
    '┌──────────────┐',
    `│    ${code}    │`,
    '└──────────────┘',
    '',
    'Copia o código e cola na aba Sala do app.',
  ];
  if (link) boxed.push('', link);
  return boxed.join('\n');
}

export async function copyRoomCode(code: string): Promise<boolean> {
  try {
    await Clipboard.setStringAsync(code);
    return true;
  } catch {
    return false;
  }
}

export async function shareRoomCode(code: string, title?: string): Promise<'shared' | 'none'> {
  const message = roomInviteText(code, title);

  if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title: title ? `D20X · ${title}` : `D20X · sala ${code}`, text: message });
      return 'shared';
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'none';
    }
  }

  try {
    await Share.share({ message, title: title ? `D20X · ${title}` : `D20X · sala ${code}` });
    return 'shared';
  } catch {
    return 'none';
  }
}
