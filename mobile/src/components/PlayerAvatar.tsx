import { Image, Text, View, type ViewStyle } from 'react-native';
import { colorForId, initials } from '../profile';
import { useThemedStyles, type ThemeColors } from '../theme';

type Props = {
  name: string;
  id: string;
  avatar?: string;
  size?: number;
  self?: boolean;
  style?: ViewStyle;
};

export function PlayerAvatar({ name, id, avatar, size = 28, self, style }: Props) {
  const styles = useThemedStyles(createStyles);
  return (
    <View
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        self && styles.self,
        style,
      ]}
    >
      {avatar ? (
        <Image
          source={{ uri: avatar }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
        />
      ) : (
        <View
          style={[
            styles.fallback,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: colorForId(id),
            },
          ]}
        >
          <Text style={[styles.text, size >= 36 && styles.textLg]}>{initials(name)}</Text>
        </View>
      )}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return {
    wrap: {
      overflow: 'hidden' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      borderWidth: 1,
      borderColor: colors.surface,
      backgroundColor: colors.keypad,
    },
    self: {
      borderColor: colors.indigo,
    },
    fallback: {
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    text: {
      color: '#fff',
      fontSize: 11,
      fontWeight: '800' as const,
    },
    textLg: {
      fontSize: 16,
    },
  };
}
