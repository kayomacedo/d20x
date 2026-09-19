import { Modal, Pressable, Text, View } from 'react-native';
import { radius, useThemedStyles, type ThemeColors } from '../theme';

type Props = {
  visible: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmClearModal({
  visible,
  title = 'Limpar histórico?',
  message = 'Isso apaga as rolagens que não estão nos favoritos. Os favoritos ficam.',
  confirmLabel = 'Limpar',
  onCancel,
  onConfirm,
}: Props) {
  const styles = useThemedStyles(createStyles);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={styles.card} onPress={() => undefined}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>{message}</Text>
          <View style={styles.actions}>
            <Pressable style={styles.cancel} onPress={onCancel}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </Pressable>
            <Pressable style={styles.confirm} onPress={onConfirm}>
              <Text style={styles.confirmText}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function createStyles(colors: ThemeColors) {
  return {
  backdrop: {
    flex: 1,
    backgroundColor: '#020617b3',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: 20,
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
  },
  body: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 20,
  },
  cancel: {
    backgroundColor: colors.keypadAlt,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  cancelText: {
    color: colors.text,
    fontWeight: '600',
  },
  confirm: {
    backgroundColor: '#b91c1c',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  confirmText: {
    color: colors.onAccent,
    fontWeight: '700' as const,
  },
  };
}
