import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Modal, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme';
import type { DieRoll, RollResult } from '../types';

type Props = {
  result: RollResult | null;
  visible: boolean;
  onDone: () => void;
};

const MAX_DICE = 6;

function AnimatedDie({ die, delay, colors }: { die: DieRoll; delay: number; colors: ReturnType<typeof useTheme>['colors'] }) {
  const drop = useRef(new Animated.Value(-120)).current;
  const spin = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.6)).current;
  const [face, setFace] = useState('?');

  useEffect(() => {
    const tick = setInterval(() => {
      setFace(String(1 + Math.floor(Math.random() * Math.max(die.sides, 2))));
    }, 55);

    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(drop, {
          toValue: 0,
          duration: 560,
          easing: Easing.bounce,
          useNativeDriver: true,
        }),
        Animated.timing(spin, {
          toValue: 1,
          duration: 560,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 420,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      clearInterval(tick);
      setFace(String(die.value));
    });

    return () => clearInterval(tick);
  }, [delay, die.sides, die.value, drop, scale, spin]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['-220deg', '0deg'],
  });

  const tone = !die.isKept
    ? { bg: colors.keypad, border: colors.border, text: colors.faint }
    : die.isMax
      ? { bg: colors.emeraldStrong, border: colors.emerald, text: colors.onAccent }
      : die.isMin
        ? { bg: colors.redStrong, border: colors.red, text: colors.onAccent }
        : { bg: colors.indigoStrong, border: colors.indigo, text: colors.onAccent };

  return (
    <Animated.View
      style={[
        styles.die,
        {
          backgroundColor: tone.bg,
          borderColor: tone.border,
          transform: [{ translateY: drop }, { rotate }, { scale }],
        },
      ]}
    >
      <Text style={[styles.face, { color: tone.text }]}>{face}</Text>
      <Text style={[styles.sides, { color: tone.text }]}>d{die.sides}</Text>
    </Animated.View>
  );
}

export function RollAnimation({ result, visible, onDone }: Props) {
  const { colors } = useTheme();
  const fade = useRef(new Animated.Value(0)).current;
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const dice = useMemo(() => (result?.dice ?? []).slice(0, MAX_DICE), [result]);

  useEffect(() => {
    if (!visible || !result) return;

    fade.setValue(0);
    Animated.timing(fade, {
      toValue: 1,
      duration: 160,
      useNativeDriver: true,
    }).start();

    const hide = setTimeout(() => {
      Animated.timing(fade, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) onDoneRef.current();
      });
    }, 980);

    return () => clearTimeout(hide);
  }, [fade, result, visible]);

  if (!visible || !result) return null;

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent>
      <Animated.View style={[styles.backdrop, { opacity: fade }]}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.faint }]}>Rolando</Text>
          <View style={styles.row}>
            {dice.length > 0 ? (
              dice.map((die, index) => (
                <AnimatedDie key={`${index}-${die.sides}-${die.value}`} die={die} delay={index * 70} colors={colors} />
              ))
            ) : (
              <Text style={[styles.total, { color: colors.text }]}>{result.total}</Text>
            )}
          </View>
          <Text style={[styles.total, { color: colors.text }]}>{result.total}</Text>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: '#020617cc',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    minWidth: 220,
    maxWidth: 340,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 22,
    alignItems: 'center',
    gap: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  die: {
    width: 58,
    height: 58,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  face: {
    fontSize: 22,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  sides: {
    fontSize: 10,
    fontWeight: '700',
    opacity: 0.8,
    marginTop: -2,
  },
  total: {
    fontSize: 28,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
});
