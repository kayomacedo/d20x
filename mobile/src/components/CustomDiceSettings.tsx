import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import {
  CUSTOM_DIE_GROUPS,
  CUSTOM_DIE_PRESETS,
  CUSTOM_SLOT_COUNT,
  slotFromExpression,
  slotFromPreset,
  type CustomDieSlot,
} from '../customDice';
import { radius, useTheme, useThemedStyles, type ThemeColors } from '../theme';

type Props = {
  slots: Array<CustomDieSlot | null>;
  onChange: (slots: Array<CustomDieSlot | null>) => void;
};

export function CustomDiceSettings({ slots, onChange }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [editing, setEditing] = useState<number | null>(null);
  const [customText, setCustomText] = useState('');

  const setSlot = (index: number, slot: CustomDieSlot | null) => {
    const next = slots.slice();
    next[index] = slot;
    onChange(next);
    setEditing(null);
    setCustomText('');
  };

  return (
    <>
      <Text style={styles.section}>Dados customizados</Text>
      <Text style={styles.help}>
        Os 7 espaços da linha de cima. Dá para repetir colunas com #, tipo 3#3d100 = três grupos de 3d100.
      </Text>
      <View style={styles.card}>
        {Array.from({ length: CUSTOM_SLOT_COUNT }, (_, index) => {
          const slot = slots[index];
          return (
            <View key={index}>
              {index > 0 ? <View style={styles.divider} /> : null}
              <Pressable
                style={styles.slotRow}
                onPress={() => {
                  setEditing(index);
                  setCustomText(slot?.expression ?? '');
                }}
              >
                <View style={styles.slotIndex}>
                  <Text style={styles.slotIndexText}>{index + 1}</Text>
                </View>
                <View style={styles.slotText}>
                  <Text style={styles.slotName}>{slot ? slot.label : 'Vazio'}</Text>
                  <Text style={styles.slotHint}>{slot ? slot.expression : 'Toque para escolher um dado'}</Text>
                </View>
              </Pressable>
            </View>
          );
        })}
      </View>

      <Modal visible={editing !== null} transparent animationType="fade" onRequestClose={() => setEditing(null)}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Espaço {(editing ?? 0) + 1}</Text>
            <Text style={styles.help}>Escolha um pronto ou escreva a fórmula.</Text>
            <ScrollView style={styles.sheetScroll} keyboardShouldPersistTaps="handled">
              {CUSTOM_DIE_GROUPS.map((group) => (
                <View key={group.id} style={styles.group}>
                  <Text style={styles.groupTitle}>{group.title}</Text>
                  <Text style={styles.slotHint}>{group.hint}</Text>
                  {CUSTOM_DIE_PRESETS.filter((item) => item.group === group.id).map((preset) => (
                    <Pressable
                      key={preset.id}
                      style={styles.preset}
                      onPress={() => editing !== null && setSlot(editing, slotFromPreset(preset))}
                    >
                      <View style={styles.slotText}>
                        <Text style={styles.slotName}>{preset.name}</Text>
                        <Text style={styles.slotHint}>{preset.hint}</Text>
                      </View>
                      <Text style={styles.presetShort}>{preset.short}</Text>
                    </Pressable>
                  ))}
                </View>
              ))}

              <Text style={styles.groupTitle}>Personalizado</Text>
              <TextInput
                value={customText}
                onChangeText={setCustomText}
                placeholder="Ex: 3#3d100 ou 2d20kh1"
                placeholderTextColor={colors.placeholder}
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
              />
              <View style={styles.sheetActions}>
                <Pressable
                  style={styles.ghostBtn}
                  onPress={() => editing !== null && setSlot(editing, null)}
                >
                  <Text style={styles.ghostBtnText}>Limpar espaço</Text>
                </Pressable>
                <Pressable
                  style={styles.saveBtn}
                  onPress={() => editing !== null && setSlot(editing, slotFromExpression(customText))}
                >
                  <Text style={styles.saveBtnText}>Usar fórmula</Text>
                </Pressable>
              </View>
            </ScrollView>
            <Pressable style={styles.closeBtn} onPress={() => setEditing(null)}>
              <Text style={styles.ghostBtnText}>Fechar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

function createStyles(colors: ThemeColors) {
  return {
    section: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: '800' as const,
      textTransform: 'uppercase' as const,
      marginTop: 4,
    },
    help: {
      color: colors.faint,
      fontSize: 12,
      lineHeight: 18,
    },
    card: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 14,
      padding: 6,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
    },
    slotRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 10,
      paddingVertical: 10,
      paddingHorizontal: 6,
    },
    slotIndex: {
      width: 24,
      height: 24,
      borderRadius: 8,
      backgroundColor: colors.keypadAlt,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    slotIndexText: {
      color: colors.indigo,
      fontSize: 12,
      fontWeight: '800' as const,
    },
    slotText: {
      flex: 1,
      minWidth: 0,
    },
    slotName: {
      color: colors.text,
      fontWeight: '800' as const,
      fontSize: 14,
    },
    slotHint: {
      color: colors.faint,
      fontSize: 12,
      marginTop: 2,
    },
    backdrop: {
      flex: 1,
      backgroundColor: '#020617cc',
      justifyContent: 'flex-end',
    },
    sheet: {
      maxHeight: '86%',
      backgroundColor: colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      borderColor: colors.border,
      borderWidth: 1,
      padding: 16,
      gap: 8,
    },
    sheetTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '800' as const,
    },
    sheetScroll: {
      maxHeight: 460,
    },
    group: {
      marginTop: 12,
      gap: 6,
    },
    groupTitle: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: '800' as const,
      textTransform: 'uppercase' as const,
      marginTop: 8,
    },
    preset: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 10,
      paddingVertical: 8,
    },
    presetShort: {
      color: colors.indigo,
      fontWeight: '800' as const,
      fontSize: 12,
    },
    input: {
      backgroundColor: colors.keypad,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 12,
      color: colors.text,
      fontSize: 15,
      fontWeight: '700' as const,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginTop: 6,
    },
    sheetActions: {
      flexDirection: 'row' as const,
      gap: 8,
      marginTop: 10,
    },
    ghostBtn: {
      flex: 1,
      paddingVertical: 10,
      alignItems: 'center' as const,
    },
    ghostBtnText: {
      color: colors.faint,
      fontWeight: '700' as const,
    },
    saveBtn: {
      flex: 1,
      backgroundColor: colors.indigoStrong,
      borderRadius: radius.lg,
      paddingVertical: 10,
      alignItems: 'center' as const,
    },
    saveBtnText: {
      color: colors.onAccent,
      fontWeight: '800' as const,
    },
    closeBtn: {
      alignItems: 'center' as const,
      paddingVertical: 8,
    },
  };
}
