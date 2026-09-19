import { ActivityIndicator, Text, View } from 'react-native';
import { useTheme, useThemedStyles, type ThemeColors } from '../theme';
import { BrandMark } from './BrandMark';

export function AppSplash() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.screen}>
      <View style={styles.glow} />
      <BrandMark size={112} />
      <Text style={styles.name}>D20X</Text>
      <Text style={styles.tag}>Rolador de mesa</Text>
      <ActivityIndicator style={styles.spinner} color={colors.indigoStrong} />
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return {
    screen: {
      flex: 1,
      backgroundColor: colors.bg,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
    },
    glow: {
      position: 'absolute' as const,
      width: 220,
      height: 220,
      borderRadius: 110,
      backgroundColor: colors.indigoStrong,
      opacity: 0.16,
    },
    name: {
      marginTop: 18,
      color: colors.text,
      fontSize: 40,
      fontWeight: '900' as const,
      letterSpacing: 6,
    },
    tag: {
      marginTop: 4,
      color: colors.faint,
      fontSize: 14,
      fontWeight: '700' as const,
    },
    spinner: {
      marginTop: 28,
    },
  };
}
