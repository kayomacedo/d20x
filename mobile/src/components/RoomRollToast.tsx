import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatBreakdownLine, formatTotal } from '../format';
import { radius, useTheme, useThemedStyles, type ThemeColors } from '../theme';
import type { RoomRoll } from '../room';
import { PlayerAvatar } from './PlayerAvatar';

type Props = {
  roll: RoomRoll | null;
  avatar?: string;
  onClose: () => void;
};

export function RoomRollToast({ roll, avatar, onClose }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  useEffect(() => {
    if (!roll) return;
    const timer = setTimeout(onClose, 10000);
    return () => clearTimeout(timer);
  }, [roll?.id]);

  if (!roll) return null;

  const breakdown = roll.result.dice.length
    ? formatBreakdownLine(roll.result.dice, roll.result.groups)
    : '';

  return (
    <View pointerEvents="box-none" style={styles.wrap}>
      <View style={styles.card}>
        <PlayerAvatar name={roll.playerName} id={roll.playerId} avatar={avatar} size={36} />
        <View style={styles.text}>
          <Text style={styles.kicker}>Rolou na mesa</Text>
          <Text style={styles.name} numberOfLines={1}>
            {roll.playerName}
          </Text>
          <Text style={styles.expr} numberOfLines={1}>
            {roll.result.rawExpression}
          </Text>
          {breakdown ? (
            <Text style={styles.break} numberOfLines={1}>
              {breakdown}
            </Text>
          ) : null}
        </View>
        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.total} numberOfLines={1} adjustsFontSizeToFit>
            {formatTotal(roll.result.total)}
          </Text>
        </View>
        <Pressable accessibilityLabel="Fechar aviso da sala" style={styles.close} onPress={onClose} hitSlop={8}>
          <Ionicons name="close" size={16} color={colors.faint} />
        </Pressable>
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return {
    wrap: {
      position: 'absolute' as const,
      left: 12,
      right: 12,
      top: 58,
      zIndex: 30,
    },
    card: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 10,
      backgroundColor: colors.surface,
      borderColor: colors.indigoStrong,
      borderWidth: 1,
      borderRadius: radius.xl,
      paddingVertical: 12,
      paddingLeft: 14,
      paddingRight: 8,
      shadowColor: '#000',
      shadowOpacity: 0.35,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 8,
    },
    text: {
      flex: 1,
      minWidth: 0,
      gap: 1,
    },
    kicker: {
      color: colors.indigo,
      fontSize: 10,
      fontWeight: '800' as const,
      textTransform: 'uppercase' as const,
      letterSpacing: 0.6,
    },
    name: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '800' as const,
    },
    expr: {
      color: colors.muted,
      fontSize: 13,
      fontWeight: '700' as const,
    },
    break: {
      color: colors.faint,
      fontSize: 12,
    },
    totalBox: {
      minWidth: 56,
      alignItems: 'center' as const,
    },
    totalLabel: {
      color: colors.faint,
      fontSize: 10,
      fontWeight: '700' as const,
      textTransform: 'uppercase' as const,
    },
    total: {
      color: colors.white,
      fontSize: 24,
      fontWeight: '900' as const,
      fontVariant: ['tabular-nums'] as const,
    },
    close: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.keypadAlt,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
  };
}
