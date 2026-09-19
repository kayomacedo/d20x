import type { AudioPlayer } from 'expo-audio';

export const SINGLE_SOUNDS = {
  plastic: require('../assets/sounds/dice-single-plastic.wav'),
  wood: require('../assets/sounds/dice-single-wood.wav'),
  stone: require('../assets/sounds/dice-single-stone.wav'),
} as const;

export const MULTI_SOUNDS = {
  handful: require('../assets/sounds/dice-multi-handful.wav'),
  tumble: require('../assets/sounds/dice-multi-tumble.wav'),
  table: require('../assets/sounds/dice-multi-table.wav'),
} as const;

export type SingleSoundId = keyof typeof SINGLE_SOUNDS;
export type MultiSoundId = keyof typeof MULTI_SOUNDS;

export const SINGLE_SOUND_OPTIONS: Array<{ id: SingleSoundId; name: string; hint: string }> = [
  { id: 'plastic', name: 'Acrílico na mesa', hint: 'Cai, quica e trava — dado de RPG' },
  { id: 'wood', name: 'Acrílico na madeira', hint: 'Mesmo dado, mesa mais oca' },
  { id: 'stone', name: 'Acrílico na pedra', hint: 'Clique mais duro, menos quique' },
];

export const MULTI_SOUND_OPTIONS: Array<{ id: MultiSoundId; name: string; hint: string }> = [
  { id: 'handful', name: 'Punhado na mesa', hint: 'Alguns acrílicos caindo juntos' },
  { id: 'tumble', name: 'Roleta na mesa', hint: 'Vários rolando e quicando' },
  { id: 'table', name: 'Punhado na madeira', hint: 'Queda mais oca, tipo taverna' },
];

export function isSingleSoundId(value: unknown): value is SingleSoundId {
  return typeof value === 'string' && value in SINGLE_SOUNDS;
}

export function isMultiSoundId(value: unknown): value is MultiSoundId {
  return typeof value === 'string' && value in MULTI_SOUNDS;
}

export function resolveRollSound(diceCount: number): 'single' | 'multi' {
  return diceCount <= 1 ? 'single' : 'multi';
}

export async function playWithPlayer(player: AudioPlayer): Promise<void> {
  player.volume = 1;
  await player.seekTo(0);
  player.play();
}
