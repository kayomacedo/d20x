import { Text, View } from 'react-native';
import { radius, useThemedStyles, type ThemeColors } from '../theme';
import type { DieRoll } from '../types';

type Props = {
  die: DieRoll;
  compact?: boolean;
};

export function DieBadge({ die, compact }: Props) {
  const styles = useThemedStyles(createStyles);
  const style = !die.isKept
    ? styles.dropped
    : die.isMin
      ? styles.min
      : die.isMax
        ? styles.max
        : styles.neutral;

  const textStyle = !die.isKept
    ? styles.droppedText
    : die.isMin
      ? styles.minText
      : die.isMax
        ? styles.maxText
        : styles.neutralText;

  return (
    <View style={[styles.badge, compact && styles.compact, style]}>
      <Text style={[styles.value, compact && styles.compactValue, textStyle]}>
        {die.value}
      </Text>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return {
  badge: {
    minWidth: 26,
    height: 26,
    paddingHorizontal: 6,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compact: {
    minWidth: 22,
    height: 20,
    paddingHorizontal: 5,
  },
  value: {
    fontSize: 13,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  compactValue: {
    fontSize: 12,
  },
  dropped: {
    backgroundColor: '#020617',
    borderColor: '#1e293b',
    opacity: 0.55,
  },
  droppedText: {
    color: '#64748b',
    textDecorationLine: 'line-through',
  },
  min: {
    backgroundColor: '#dc2626',
    borderColor: '#f87171',
  },
  minText: {
    color: colors.onAccent,
  },
  max: {
    backgroundColor: '#10b981',
    borderColor: '#6ee7b7',
  },
  maxText: {
    color: '#022c22',
  },
  neutral: {
    backgroundColor: colors.badgeNeutral,
    borderColor: '#cbd5e1',
  },
  neutralText: {
    color: colors.badgeNeutralText,
  },
  };
}
