import { Pressable, Text, View } from 'react-native';
import { radius, useLayoutScale, useThemedStyles, type ThemeColors } from '../theme';

type Props = {
  onAppendChar: (char: string) => void;
  onAppendDice: (die: string) => void;
  onInsertMacro: (macro: string) => void;
  onClear: () => void;
  onRoll: () => void;
};

type KeyDef = {
  label: string;
  value?: string;
  action?: 'clear' | 'roll';
  flex?: number;
  tone?: 'num' | 'op' | 'clear' | 'die' | 'roll';
};

const DICE = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'] as const;

const ROWS: KeyDef[][] = [
  [
    { label: 'C', action: 'clear', tone: 'clear' },
    { label: '(', value: '(', tone: 'op' },
    { label: ')', value: ')', tone: 'op' },
    { label: '÷', value: '/', tone: 'op' },
  ],
  [
    { label: '7', value: '7', tone: 'num' },
    { label: '8', value: '8', tone: 'num' },
    { label: '9', value: '9', tone: 'num' },
    { label: '×', value: '*', tone: 'op' },
  ],
  [
    { label: '4', value: '4', tone: 'num' },
    { label: '5', value: '5', tone: 'num' },
    { label: '6', value: '6', tone: 'num' },
    { label: '-', value: '-', tone: 'op' },
  ],
  [
    { label: '1', value: '1', tone: 'num' },
    { label: '2', value: '2', tone: 'num' },
    { label: '3', value: '3', tone: 'num' },
    { label: '+', value: '+', tone: 'op' },
  ],
  [
    { label: '0', value: '0', tone: 'num' },
    { label: 'd', value: 'd', tone: 'die' },
    { label: 'Rolar', action: 'roll', flex: 2, tone: 'roll' },
  ],
];

export function Keypad({ onAppendChar, onAppendDice, onInsertMacro, onClear, onRoll }: Props) {
  const { compact, keyPadV } = useLayoutScale();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.wrap}>
      <View style={styles.diceRow}>
        {DICE.map((die) => (
          <Pressable key={die} style={styles.dieBtn} onPress={() => onAppendDice(die)}>
            <Text style={[styles.dieText, compact && styles.dieTextCompact]}>{die}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.macroRow}>
        <Pressable style={[styles.macro, styles.macroIndigo]} onPress={() => onInsertMacro('2d20kh1')}>
          <Text style={styles.macroIndigoText} numberOfLines={1}>Vantagem</Text>
        </Pressable>
        <Pressable style={[styles.macro, styles.macroAmber]} onPress={() => onInsertMacro('2d20kl1')}>
          <Text style={styles.macroAmberText} numberOfLines={1}>Desvantagem</Text>
        </Pressable>
        <Pressable style={[styles.macro, styles.macroGreen]} onPress={() => onInsertMacro('4d6d1')}>
          <Text style={styles.macroGreenText} numberOfLines={1}>Atributo</Text>
        </Pressable>
      </View>

      {ROWS.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((key) => (
            <Pressable
              key={key.label}
              style={[
                styles.key,
                { flex: key.flex ?? 1, paddingVertical: keyPadV },
                key.tone === 'clear' && styles.keyClear,
                key.tone === 'op' && styles.keyOp,
                key.tone === 'die' && styles.keyDie,
                key.tone === 'roll' && styles.keyRoll,
              ]}
              onPress={() => {
                if (key.action === 'clear') onClear();
                else if (key.action === 'roll') onRoll();
                else if (key.value) onAppendChar(key.value);
              }}
            >
              <Text
                style={[
                  styles.keyText,
                  compact && styles.keyTextCompact,
                  key.tone === 'clear' && styles.keyClearText,
                  key.tone === 'op' && styles.keyOpText,
                  key.tone === 'die' && styles.keyDieText,
                  key.tone === 'roll' && styles.keyRollText,
                ]}
              >
                {key.label}
              </Text>
            </Pressable>
          ))}
        </View>
      ))}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return {
  wrap: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: 10,
    gap: 6,
  },
  diceRow: {
    flexDirection: 'row',
    gap: 4,
  },
  dieBtn: {
    flex: 1,
    backgroundColor: colors.keypadAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dieText: {
    color: colors.indigo,
    fontWeight: '800',
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  dieTextCompact: {
    fontSize: 10,
  },
  macroRow: {
    flexDirection: 'row',
    gap: 4,
  },
  macro: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: 7,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  macroIndigo: {
    backgroundColor: '#1e1b4b66',
    borderColor: '#3730a3',
  },
  macroAmber: {
    backgroundColor: '#451a3666',
    borderColor: '#92400e',
  },
  macroGreen: {
    backgroundColor: '#052e1666',
    borderColor: '#166534',
  },
  macroIndigoText: { color: colors.indigo, fontWeight: '700', fontSize: 10 },
  macroAmberText: { color: colors.amber, fontWeight: '700', fontSize: 10 },
  macroGreenText: { color: colors.emerald, fontWeight: '700', fontSize: 10 },
  row: {
    flexDirection: 'row',
    gap: 6,
  },
  key: {
    backgroundColor: colors.keypad,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  keyClear: {
    backgroundColor: '#450a0a99',
    borderWidth: 1,
    borderColor: '#7f1d1d',
  },
  keyOp: {
    backgroundColor: colors.keypadAlt,
  },
  keyDie: {
    backgroundColor: colors.indigoStrong,
  },
  keyRoll: {
    backgroundColor: colors.emeraldStrong,
  },
  keyText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '800',
  },
  keyTextCompact: {
    fontSize: 16,
  },
  keyClearText: { color: '#fca5a5' },
  keyOpText: { color: colors.indigo },
  keyDieText: { color: colors.onAccent },
  keyRollText: { color: colors.onAccent, fontSize: 15 },
  };
}
