import type { DiceGroup, DiceSort, DieRoll } from './types';

export const VISIBLE_DICE_LIMIT = 36;

export function isDiceSort(value: unknown): value is DiceSort {
  return value === 'rolled' || value === 'asc';
}

export function sortGroupRolls(rolls: DieRoll[], sort: DiceSort = 'rolled'): DieRoll[] {
  if (sort !== 'asc') return rolls;
  return [...rolls].sort((a, b) => a.value - b.value);
}

export function groupsFromDice(dice: DieRoll[], groups?: DiceGroup[]): DiceGroup[] {
  if (groups && groups.length > 0) return groups;

  const derived: DiceGroup[] = [];
  for (const die of dice) {
    const last = derived[derived.length - 1];
    if (last && last.sides === die.sides) {
      last.rolls.push(die);
      if (die.isKept) last.subtotal += die.value;
      last.notation = `${last.rolls.length}d${die.sides}`;
    } else {
      derived.push({
        notation: `1d${die.sides}`,
        sides: die.sides,
        rolls: [die],
        subtotal: die.isKept ? die.value : 0,
      });
    }
  }
  return derived;
}

export function formatBreakdownLine(dice: DieRoll[], groups?: DiceGroup[], sort: DiceSort = 'rolled'): string {
  return groupsFromDice(dice, groups)
    .map((group) => `${group.notation} ${formatGroupValues(group, sort)}`)
    .join('  ·  ');
}

export function formatGroupValues(group: DiceGroup, sort: DiceSort = 'rolled'): string {
  return sortGroupRolls(group.rolls, sort)
    .map((die) => (die.isKept ? String(die.value) : `${die.value}↓`))
    .join(' + ');
}

export function formatTotal(value: number): string {
  if (!Number.isFinite(value)) return '—';
  const abs = Math.abs(value);
  if (abs >= 1e9) return value.toExponential(2);
  if (Number.isInteger(value)) return String(value);
  return String(Math.round(value * 100) / 100);
}

export function formatRollWhen(createdAt: number, fallback = ''): string {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return fallback;

  const now = new Date();
  const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const dayMs = 24 * 60 * 60 * 1000;

  if (dayStart === today) return `Hoje ${time}`;
  if (dayStart === today - dayMs) return `Ontem ${time}`;

  const datePart = date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: date.getFullYear() === now.getFullYear() ? undefined : 'numeric',
  });
  return `${datePart} ${time}`;
}

export function totalFontSize(value: number, base: number): number {
  const digits = formatTotal(value).replace(/[.-]/g, '').length;
  if (digits <= 4) return base;
  if (digits <= 6) return Math.max(20, base - 6);
  if (digits <= 8) return 18;
  return 15;
}
