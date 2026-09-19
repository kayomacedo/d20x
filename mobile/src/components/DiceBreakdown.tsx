import { Text, View } from 'react-native';
import { groupsFromDice } from '../format';
import { radius, useThemedStyles, type ThemeColors } from '../theme';
import type { DiceGroup, DieRoll } from '../types';
import { DieBadge } from './DieBadge';

type Props = {
  dice: DieRoll[];
  groups?: DiceGroup[];
  compact?: boolean;
};

export function DiceBreakdown({ dice, groups, compact }: Props) {
  const styles = useThemedStyles(createStyles);
  const resolved = groupsFromDice(dice, groups);
  if (resolved.length === 0) return null;

  return (
    <View style={styles.wrap}>
      {resolved.map((group, index) => (
        <View key={`${group.notation}-${index}`} style={[styles.chip, compact && styles.chipCompact]}>
          <Text style={styles.notation} numberOfLines={1}>
            {group.notation}
          </Text>
          {group.rolls.map((die, dieIndex) => (
            <DieBadge key={`${dieIndex}-${die.value}`} die={die} compact />
          ))}
        </View>
      ))}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return {
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.chip,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: 8,
    paddingVertical: 5,
    maxWidth: '100%',
  },
  chipCompact: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  notation: {
    color: colors.indigo,
    fontWeight: '800',
    fontSize: 11,
  },
  };
}
