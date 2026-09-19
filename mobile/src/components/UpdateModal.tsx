import { ActivityIndicator, Modal, Pressable, Text, View } from 'react-native';
import { radius, useThemedStyles, type ThemeColors } from '../theme';
import type { UpdateFeed } from '../update';
import { BrandMark } from './BrandMark';

type Props = {
  visible: boolean;
  installed: string;
  latest: UpdateFeed | null;
  downloading?: boolean;
  onLater?: () => void;
  onDownload: () => void;
};

export function UpdateModal({ visible, installed, latest, downloading, onLater, onDownload }: Props) {
  const styles = useThemedStyles(createStyles);
  if (!latest) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={latest.force ? undefined : onLater}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <BrandMark size={56} />
          <Text style={styles.kicker}>Nova versão</Text>
          <Text style={styles.title}>D20X {latest.version}</Text>
          <Text style={styles.installed}>Você está na {installed}</Text>
          {latest.notes ? <Text style={styles.notes}>{latest.notes}</Text> : null}
          <Pressable
            style={[styles.download, (!latest.apkUrl || downloading) && styles.downloadOff]}
            onPress={onDownload}
            disabled={!latest.apkUrl || downloading}
          >
            {downloading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.downloadText}>
                {latest.apkUrl ? 'Baixar APK' : 'APK ainda sem link'}
              </Text>
            )}
          </Pressable>
          {!latest.force && onLater ? (
            <Pressable style={styles.later} onPress={onLater}>
              <Text style={styles.laterText}>Depois</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

function createStyles(colors: ThemeColors) {
  return {
    backdrop: {
      flex: 1,
      backgroundColor: '#020617cc',
      justifyContent: 'center',
      padding: 22,
    },
    card: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 20,
      padding: 22,
      alignItems: 'center',
      gap: 8,
    },
    kicker: {
      marginTop: 8,
      color: colors.indigo,
      fontSize: 12,
      fontWeight: '800' as const,
      textTransform: 'uppercase' as const,
      letterSpacing: 1,
    },
    title: {
      color: colors.text,
      fontSize: 24,
      fontWeight: '900' as const,
    },
    installed: {
      color: colors.faint,
      fontSize: 13,
    },
    notes: {
      color: colors.muted,
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center' as const,
      marginTop: 4,
    },
    download: {
      marginTop: 10,
      width: '100%',
      backgroundColor: colors.indigoStrong,
      borderRadius: radius.lg,
      paddingVertical: 13,
      alignItems: 'center' as const,
    },
    downloadOff: {
      opacity: 0.55,
    },
    downloadText: {
      color: colors.onAccent,
      fontWeight: '800' as const,
      fontSize: 15,
    },
    later: {
      paddingVertical: 8,
    },
    laterText: {
      color: colors.faint,
      fontWeight: '700' as const,
    },
  };
}
