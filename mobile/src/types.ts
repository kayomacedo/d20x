import type { CustomDieSlot } from './customDice';
import type { MultiSoundId, SingleSoundId } from './sound';
import type { ThemeId } from './theme';

export type DieRoll = {
  sides: number;
  value: number;
  isMin: boolean;
  isMax: boolean;
  isKept: boolean;
};

export type DiceGroup = {
  notation: string;
  sides: number;
  rolls: DieRoll[];
  subtotal: number;
};

export type RollResult = {
  rawExpression: string;
  total: number;
  dice: DieRoll[];
  groups: DiceGroup[];
  maxCrits: number;
  minCrits: number;
};

export type HistoryItem = {
  id: string;
  result: RollResult;
  timestamp: string;
  createdAt: number;
  favorite: boolean;
};

export type DiceSort = 'rolled' | 'asc';

export type SessionStats = {
  totalRolls: number;
  maxCrits: number;
  minCrits: number;
};

export type PersistedSession = {
  expression: string;
  history: HistoryItem[];
  stats: SessionStats;
  soundEnabled: boolean;
  hapticEnabled: boolean;
  rollAnimationEnabled: boolean;
  singleSoundId: SingleSoundId;
  multiSoundId: MultiSoundId;
  themeId: ThemeId;
  lastResult: RollResult | null;
  lastTimestamp: string | null;
  lastError: string | null;
  playerName: string;
  playerId: string;
  dismissedUpdateVersion: string;
  customSlots: Array<CustomDieSlot | null>;
  diceSort: DiceSort;
  playerAvatar: string;
};
