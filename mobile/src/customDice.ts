export const CUSTOM_SLOT_COUNT = 7;

export type CustomDieSlot = {
  label: string;
  expression: string;
};

export type CustomDiePreset = {
  id: string;
  name: string;
  hint: string;
  short: string;
  expression: string;
  group: 'colunas' | 'dnd' | 'classicos';
};

export const CUSTOM_DIE_GROUPS: { id: CustomDiePreset['group']; title: string; hint: string }[] = [
  { id: 'colunas', title: 'Colunas e repetir', hint: 'O # joga a mesma fórmula várias vezes, cada uma numa coluna.' },
  { id: 'dnd', title: 'D&D e mesa', hint: 'Vantagem, atributo, dano e percentil.' },
  { id: 'classicos', title: 'Outros sistemas', hint: '3d6, pools e dados menos comuns.' },
];

export const CUSTOM_DIE_PRESETS: CustomDiePreset[] = [
  {
    id: 'col-3x3d100',
    name: '3 colunas de 3d100',
    hint: '3#3d100 · três grupos de três percentis',
    short: '3×3d100',
    expression: '3#3d100',
    group: 'colunas',
  },
  {
    id: 'col-2x3d100',
    name: '2 colunas de 3d100',
    hint: '2#3d100',
    short: '2×3d100',
    expression: '2#3d100',
    group: 'colunas',
  },
  {
    id: 'col-3x1d20',
    name: '3 ataques',
    hint: '3#1d20 · três d20 separados',
    short: '3×d20',
    expression: '3#1d20',
    group: 'colunas',
  },
  {
    id: 'col-6x1d20',
    name: '6 iniciativas',
    hint: '6#1d20',
    short: '6×d20',
    expression: '6#1d20',
    group: 'colunas',
  },
  {
    id: 'col-3x1d20p5',
    name: '3 ataques +5',
    hint: '3#1d20+5',
    short: '3×+5',
    expression: '3#1d20+5',
    group: 'colunas',
  },
  {
    id: 'col-2xadv',
    name: '2 vantagens',
    hint: '2#2d20kh1',
    short: '2×vant',
    expression: '2#2d20kh1',
    group: 'colunas',
  },
  {
    id: 'col-4x3d6',
    name: '4 colunas de 3d6',
    hint: '4#3d6 · tipo atributo clássico em fila',
    short: '4×3d6',
    expression: '4#3d6',
    group: 'colunas',
  },
  {
    id: 'adv',
    name: 'Vantagem',
    hint: '2d20kh1 · fica o maior',
    short: 'Vant',
    expression: '2d20kh1',
    group: 'dnd',
  },
  {
    id: 'dis',
    name: 'Desvantagem',
    hint: '2d20kl1 · fica o menor',
    short: 'Desv',
    expression: '2d20kl1',
    group: 'dnd',
  },
  {
    id: 'attr',
    name: 'Atributo 5e',
    hint: '4d6kh3 · descarta o menor',
    short: 'Atrib',
    expression: '4d6kh3',
    group: 'dnd',
  },
  {
    id: 'atk5',
    name: 'Ataque +5',
    hint: '1d20+5',
    short: 'Atq+5',
    expression: '1d20+5',
    group: 'dnd',
  },
  {
    id: 'dmg2d6',
    name: 'Dano 2d6+3',
    hint: 'Arma média com bônus',
    short: '2d6+3',
    expression: '2d6+3',
    group: 'dnd',
  },
  {
    id: 'fireball',
    name: 'Bola de fogo',
    hint: '8d6',
    short: '8d6',
    expression: '8d6',
    group: 'dnd',
  },
  {
    id: 'd100',
    name: 'Percentil',
    hint: '1d100',
    short: 'd100',
    expression: '1d100',
    group: 'dnd',
  },
  {
    id: 'death',
    name: 'Death save',
    hint: '1d20',
    short: 'Save',
    expression: '1d20',
    group: 'dnd',
  },
  {
    id: '3d6',
    name: '3d6 clássico',
    hint: 'GURPS, Traveller, muitos OSR',
    short: '3d6',
    expression: '3d6',
    group: 'classicos',
  },
  {
    id: '2d6',
    name: '2d6',
    hint: 'PbtA, viagem, reação',
    short: '2d6',
    expression: '2d6',
    group: 'classicos',
  },
  {
    id: '5d10',
    name: '5d10',
    hint: 'Pool tipo Storyteller',
    short: '5d10',
    expression: '5d10',
    group: 'classicos',
  },
  {
    id: '12d6',
    name: '12d6',
    hint: 'Pool grande, Shadowrun / dano alto',
    short: '12d6',
    expression: '12d6',
    group: 'classicos',
  },
  {
    id: '2d10d6',
    name: '2d10 + 1d6',
    hint: 'Dois dados diferentes somados',
    short: '2d10+d6',
    expression: '2d10+1d6',
    group: 'classicos',
  },
  {
    id: 'd2',
    name: 'Moeda',
    hint: '1d2',
    short: 'd2',
    expression: '1d2',
    group: 'classicos',
  },
  {
    id: 'd3',
    name: 'd3',
    hint: '1d3',
    short: 'd3',
    expression: '1d3',
    group: 'classicos',
  },
  {
    id: 'd30',
    name: 'd30',
    hint: '1d30',
    short: 'd30',
    expression: '1d30',
    group: 'classicos',
  },
];

export function emptyCustomSlots(): Array<CustomDieSlot | null> {
  return Array.from({ length: CUSTOM_SLOT_COUNT }, () => null);
}

export function slotFromPreset(preset: CustomDiePreset): CustomDieSlot {
  return { label: preset.short, expression: preset.expression };
}

export function slotFromExpression(expression: string): CustomDieSlot | null {
  const value = expression.trim().replace(/\s+/g, '');
  if (!value) return null;
  return {
    label: value.length > 8 ? `${value.slice(0, 7)}…` : value,
    expression: value,
  };
}

export function normalizeCustomSlots(value: unknown): Array<CustomDieSlot | null> {
  const slots = emptyCustomSlots();
  if (!Array.isArray(value)) return slots;
  for (let i = 0; i < CUSTOM_SLOT_COUNT; i += 1) {
    const item = value[i];
    if (!item || typeof item !== 'object') continue;
    const raw = item as Partial<CustomDieSlot>;
    if (typeof raw.expression !== 'string' || !raw.expression.trim()) continue;
    slots[i] = {
      label: typeof raw.label === 'string' && raw.label.trim() ? raw.label.trim().slice(0, 10) : raw.expression.trim().slice(0, 8),
      expression: raw.expression.trim().replace(/\s+/g, ''),
    };
  }
  return slots;
}
