import AsyncStorage from '@react-native-async-storage/async-storage';
import { capHistory, normalizeHistory } from './history';
import { createPlayerId } from './room';
import { isMultiSoundId, isSingleSoundId } from './sound';
import { isThemeId } from './theme';
import type { PersistedSession, SessionStats } from './types';

export const STORAGE_KEY = '@calculadora-dados/session';

export const emptyStats: SessionStats = {
  totalRolls: 0,
  maxCrits: 0,
  minCrits: 0,
};

export const defaultSession: PersistedSession = {
  expression: '',
  history: [],
  stats: emptyStats,
  soundEnabled: true,
  hapticEnabled: true,
  rollAnimationEnabled: true,
  singleSoundId: 'plastic',
  multiSoundId: 'handful',
  themeId: 'slate',
  lastResult: null,
  lastTimestamp: null,
  lastError: null,
  playerName: '',
  playerId: '',
  dismissedUpdateVersion: '',
};

export async function loadSession(): Promise<PersistedSession> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultSession, playerId: createPlayerId() };

    const parsed = JSON.parse(raw) as Partial<PersistedSession> & {
      hapticEnabled?: boolean;
      soundPreset?: string;
    };
    return {
      ...defaultSession,
      ...parsed,
      soundEnabled: parsed.soundEnabled ?? true,
      hapticEnabled: parsed.hapticEnabled ?? true,
      rollAnimationEnabled: parsed.rollAnimationEnabled ?? true,
      singleSoundId: isSingleSoundId(parsed.singleSoundId)
        ? parsed.singleSoundId
        : parsed.soundPreset === 'table' || parsed.soundPreset === 'single'
          ? 'plastic'
          : 'plastic',
      multiSoundId: isMultiSoundId(parsed.multiSoundId)
        ? parsed.multiSoundId
        : parsed.soundPreset === 'tumble'
          ? 'tumble'
          : parsed.soundPreset === 'table'
            ? 'table'
            : 'handful',
      themeId: isThemeId(parsed.themeId) ? parsed.themeId : 'slate',
      history: Array.isArray(parsed.history)
        ? capHistory(normalizeHistory(parsed.history))
        : [],
      stats: {
        ...emptyStats,
        ...(parsed.stats ?? {}),
      },
      playerName: typeof parsed.playerName === 'string' ? parsed.playerName : '',
      playerId: parsed.playerId || createPlayerId(),
      dismissedUpdateVersion:
        typeof parsed.dismissedUpdateVersion === 'string' ? parsed.dismissedUpdateVersion : '',
    };
  } catch {
    return { ...defaultSession, playerId: createPlayerId() };
  }
}

export async function saveSession(session: PersistedSession): Promise<void> {
  const payload: PersistedSession = {
    ...session,
    history: capHistory(session.history),
  };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export async function clearSessionStorage(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
