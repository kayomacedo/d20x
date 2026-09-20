import { Text, View } from 'react-native';
import { groupsFromDice, sortGroupRolls } from '../format';
import { radius, useThemedStyles, type ThemeColors } from '../theme';
import type { DiceGroup, DiceSort, DieRoll } from '../types';
import { DieBadge } from './DieBadge';

type Props = {
  dice: DieRoll[];
  groups?: DiceGroup[];
  compact?: boolean;
  sort?: DiceSort;
};

export function DiceBreakdown({ dice, groups, compact, sort = 'rolled' }: Props) {
  const styles = useThemedStyles(createStyles);
  const resolved = groupsFromDice(dice, groups);
  if (resolved.length === 0) return null;
  const stacked = resolved.length > 1;

  return (
    <View style={[styles.wrap, stacked && styles.wrapStacked]}>
      {resolved.map((group, index) => (
        <View
          key={`${group.notation}-${index}`}
          style={[styles.chip, compact && styles.chipCompact, stacked && styles.chipRow]}
        >
          <Text style={styles.notation} numberOfLines={1}>
            {group.notation}
          </Text>
          {sortGroupRolls(group.rolls, sort).map((die, dieIndex) => (
            <DieBadge key={`${dieIndex}-${die.value}-${die.sides}`} die={die} compact />
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
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    gap: 6,
  },
  wrapStacked: {
    flexDirection: 'column',
    alignItems: 'stretch',
    alignSelf: 'stretch',
    width: '100%',
    flexWrap: 'nowrap',
    gap: 4,
  },
  chip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 6,
    backgroundColor: colors.chip,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: 8,
    paddingVertical: 5,
    maxWidth: '100%',
  },
  chipRow: {
    alignSelf: 'stretch',
    width: '100%',
  },
  chipCompact: {
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  notation: {
    color: colors.indigo,
    fontWeight: '800',
    fontSize: 11,
    minWidth: 36,
  },
  };
}
