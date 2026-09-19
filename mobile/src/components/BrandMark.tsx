import { Text, View } from 'react-native';
import { useTheme } from '../theme';

type Props = {
  size?: number;
};

export function BrandMark({ size = 72 }: Props) {
  const { colors } = useTheme();
  const radius = Math.round(size * 0.24);
  const d20Size = size * 0.2;
  const xSize = size * 0.34;

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: colors.indigoStrong,
        borderWidth: Math.max(2, Math.round(size * 0.04)),
        borderColor: colors.indigo,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          color: colors.onAccent,
          fontSize: d20Size,
          fontWeight: '900',
          letterSpacing: 1,
        }}
      >
        D20
      </Text>
      <Text
        style={{
          color: colors.onAccent,
          fontSize: xSize,
          fontWeight: '900',
          marginTop: -size * 0.08,
          lineHeight: xSize * 1.05,
        }}
      >
        X
      </Text>
    </View>
  );
}
