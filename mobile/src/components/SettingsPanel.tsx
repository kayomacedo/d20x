import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MULTI_SOUND_OPTIONS, SINGLE_SOUND_OPTIONS, type MultiSoundId, type SingleSoundId } from '../sound';
import { THEME_LIST, type ThemeId, useTheme, useThemedStyles, type ThemeColors } from '../theme';
import type { SessionStats } from '../types';

type Props = {
  playerName: string;
  onChangeName: (name: string) => void;
  themeId: ThemeId;
  onChangeTheme: (id: ThemeId) => void;
  soundEnabled: boolean;
  onToggleSound: (value: boolean) => void;
  hapticEnabled: boolean;
  onToggleHaptic: (value: boolean) => void;
  rollAnimationEnabled: boolean;
  onToggleAnimation: (value: boolean) => void;
  singleSoundId: SingleSoundId;
  multiSoundId: MultiSoundId;
  onChangeSingleSound: (id: SingleSoundId) => void;
  onChangeMultiSound: (id: MultiSoundId) => void;
  onPreviewSingleSound: (id: SingleSoundId) => void;
  onPreviewMultiSound: (id: MultiSoundId) => void;
  stats: SessionStats;
  onResetStats: () => void;
  onClose: () => void;
  appVersion: string;
  updateHint: string;
  onCheckUpdate: () => void;
};

function ToggleRow({
  label,
  hint,
  value,
  onValueChange,
  colors,
}: {
  label: string;
  hint: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  colors: ThemeColors;
}) {
  return (
    <View style={rowStyles(colors).row}>
      <View style={rowStyles(colors).text}>
        <Text style={rowStyles(colors).label}>{label}</Text>
        <Text style={rowStyles(colors).hint}>{hint}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.keypadAlt, true: colors.indigoStrong }}
        thumbColor={value ? colors.onAccent : colors.muted}
      />
    </View>
  );
}

const rowCache = new Map<string, ReturnType<typeof StyleSheet.create>>();
function rowStyles(colors: ThemeColors) {
  const key = colors.bg + colors.text;
  const cached = rowCache.get(key);
  if (cached) return cached;
  const created = StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 10,
    },
    text: { flex: 1, minWidth: 0 },
    label: { color: colors.text, fontWeight: '800', fontSize: 14 },
    hint: { color: colors.faint, fontSize: 12, marginTop: 2 },
  });
  rowCache.set(key, created);
  return created;
}

function SoundChoice({
  item,
  active,
  showDivider,
  onSelect,
  onPreview,
  colors,
  styles,
}: {
  item: { id: string; name: string; hint: string };
  active: boolean;
  showDivider: boolean;
  onSelect: () => void;
  onPreview: () => void;
  colors: ThemeColors;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View>
      {showDivider ? <View style={styles.divider} /> : null}
      <Pressable style={styles.soundRow} onPress={onSelect}>
        <View style={styles.soundText}>
          <Text style={styles.soundName}>{item.name}</Text>
          <Text style={styles.soundHint}>{item.hint}</Text>
        </View>
        <Pressable
          accessibilityLabel={`Ouvir ${item.name}`}
          style={styles.previewBtn}
          onPress={onPreview}
          hitSlop={8}
        >
          <Ionicons name="play" size={16} color={colors.indigo} />
        </Pressable>
        <View style={[styles.radio, active && styles.radioOn]}>
          {active ? <View style={styles.radioDot} /> : null}
        </View>
      </Pressable>
    </View>
  );
}

export function SettingsPanel({
  playerName,
  onChangeName,
  themeId,
  onChangeTheme,
  soundEnabled,
  onToggleSound,
  hapticEnabled,
  onToggleHaptic,
  rollAnimationEnabled,
  onToggleAnimation,
  singleSoundId,
  multiSoundId,
  onChangeSingleSound,
  onChangeMultiSound,
  onPreviewSingleSound,
  onPreviewMultiSound,
  stats,
  onResetStats,
  onClose,
  appVersion,
  updateHint,
  onCheckUpdate,
}: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.screen}>
      <View style={styles.toolbar}>
        <Pressable
          accessibilityLabel="Fechar ajustes"
          style={styles.backBtn}
          onPress={onClose}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <View style={styles.toolbarText}>
          <Text style={styles.title}>Ajustes</Text>
          <Text style={styles.subtitle}>Nome, tema e como o dado se comporta</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.section}>Perfil</Text>
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Nome de exibição</Text>
          <TextInput
            value={playerName}
            onChangeText={onChangeName}
            placeholder="Ex: Luan"
            placeholderTextColor={colors.placeholder}
            maxLength={18}
            autoCapitalize="words"
            style={styles.input}
          />
          <Text style={styles.help}>É assim que você aparece na sala para o resto da mesa.</Text>
        </View>

        <Text style={styles.section}>Tema</Text>
        <View style={styles.themeGrid}>
          {THEME_LIST.map((item) => {
            const active = item.id === themeId;
            return (
              <Pressable
                key={item.id}
                onPress={() => onChangeTheme(item.id)}
                style={[styles.themeCard, active && styles.themeCardOn]}
              >
                <View style={styles.swatches}>
                  <View style={[styles.swatch, { backgroundColor: item.colors.bg }]} />
                  <View style={[styles.swatch, { backgroundColor: item.colors.indigoStrong }]} />
                  <View style={[styles.swatch, { backgroundColor: item.colors.surface }]} />
                </View>
                <Text style={styles.themeName}>{item.name}</Text>
                <Text style={styles.themeHint}>{item.hint}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.section}>Som e toque</Text>
        <View style={styles.card}>
          <ToggleRow
            label="Som dos dados"
            hint="Toca ao rolar no Rolador"
            value={soundEnabled}
            onValueChange={onToggleSound}
            colors={colors}
          />
          <View style={styles.divider} />
          <ToggleRow
            label="Vibração"
            hint="Resposta tátil no celular ao rolar"
            value={hapticEnabled}
            onValueChange={onToggleHaptic}
            colors={colors}
          />
          <View style={styles.divider} />
          <ToggleRow
            label="Animação dos dados"
            hint="Os dados caem e giram na tela ao rolar"
            value={rollAnimationEnabled}
            onValueChange={onToggleAnimation}
            colors={colors}
          />
        </View>

        <Text style={styles.section}>Som de 1 dado</Text>
        <Text style={styles.help}>Quando a rolagem tiver só um dado.</Text>
        <View style={styles.card}>
          {SINGLE_SOUND_OPTIONS.map((item, index) => (
            <SoundChoice
              key={item.id}
              item={item}
              active={item.id === singleSoundId}
              showDivider={index > 0}
              onSelect={() => onChangeSingleSound(item.id)}
              onPreview={() => onPreviewSingleSound(item.id)}
              colors={colors}
              styles={styles}
            />
          ))}
        </View>

        <Text style={styles.section}>Som de vários dados</Text>
        <Text style={styles.help}>Quando cair 2 ou mais, tipo 2d20 ou d20 + d10.</Text>
        <View style={styles.card}>
          {MULTI_SOUND_OPTIONS.map((item, index) => (
            <SoundChoice
              key={item.id}
              item={item}
              active={item.id === multiSoundId}
              showDivider={index > 0}
              onSelect={() => onChangeMultiSound(item.id)}
              onPreview={() => onPreviewMultiSound(item.id)}
              colors={colors}
              styles={styles}
            />
          ))}
        </View>

        <Text style={styles.section}>Sessão</Text>
        <View style={styles.card}>
          <Text style={styles.statLine}>
            {stats.totalRolls} rolagens · {stats.maxCrits} críticos · {stats.minCrits} falhas
          </Text>
          <Pressable
            style={[
              styles.resetBtn,
              stats.totalRolls === 0 && stats.maxCrits === 0 && stats.minCrits === 0 && styles.resetBtnOff,
            ]}
            onPress={onResetStats}
            disabled={stats.totalRolls === 0 && stats.maxCrits === 0 && stats.minCrits === 0}
          >
            <Text style={styles.resetBtnText}>Zerar estatísticas</Text>
          </Pressable>
        </View>

        <Text style={styles.section}>Aplicativo</Text>
        <View style={styles.card}>
          <Text style={styles.statLine}>D20X {appVersion}</Text>
          <Pressable style={styles.resetBtn} onPress={onCheckUpdate}>
            <Text style={styles.resetBtnText}>Verificar atualização</Text>
          </Pressable>
          {updateHint ? <Text style={styles.help}>{updateHint}</Text> : null}
        </View>

        <Text style={styles.about}>D20X · rolador de mesa</Text>
      </ScrollView>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return {
    screen: {
      flex: 1,
    },
    toolbar: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
      gap: 8,
    },
    backBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: colors.keypadAlt,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    toolbarText: {
      flex: 1,
      minWidth: 0,
    },
    title: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '800' as const,
    },
    subtitle: {
      color: colors.faint,
      fontSize: 12,
      marginTop: 2,
    },
    content: {
      padding: 12,
      gap: 10,
      paddingBottom: 32,
    },
    section: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: '800' as const,
      textTransform: 'uppercase' as const,
      marginTop: 4,
    },
    card: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 14,
      padding: 12,
      gap: 8,
    },
    fieldLabel: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: '700' as const,
      textTransform: 'uppercase' as const,
    },
    input: {
      backgroundColor: colors.keypad,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 12,
      color: colors.text,
      fontSize: 16,
      fontWeight: '700' as const,
      paddingHorizontal: 12,
      paddingVertical: 12,
    },
    help: {
      color: colors.faint,
      fontSize: 12,
      lineHeight: 18,
    },
    themeGrid: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: 8,
    },
    themeCard: {
      width: '47%',
      flexGrow: 1,
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 14,
      padding: 10,
      gap: 4,
    },
    themeCardOn: {
      borderColor: colors.indigoStrong,
      borderWidth: 2,
    },
    swatches: {
      flexDirection: 'row' as const,
      gap: 4,
      marginBottom: 4,
    },
    swatch: {
      width: 18,
      height: 18,
      borderRadius: 9,
      borderWidth: 1,
      borderColor: colors.border,
    },
    themeName: {
      color: colors.text,
      fontWeight: '800' as const,
      fontSize: 14,
    },
    themeHint: {
      color: colors.faint,
      fontSize: 11,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
    },
    soundRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 10,
      paddingVertical: 10,
    },
    soundText: {
      flex: 1,
      minWidth: 0,
    },
    soundName: {
      color: colors.text,
      fontWeight: '800' as const,
      fontSize: 14,
    },
    soundHint: {
      color: colors.faint,
      fontSize: 12,
      marginTop: 2,
    },
    previewBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.keypadAlt,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    radio: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: colors.faint,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    radioOn: {
      borderColor: colors.indigoStrong,
    },
    radioDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.indigoStrong,
    },
    statLine: {
      color: colors.muted,
      fontSize: 13,
      fontWeight: '600' as const,
    },
    resetBtn: {
      backgroundColor: colors.keypadAlt,
      borderRadius: 10,
      paddingVertical: 10,
      alignItems: 'center' as const,
    },
    resetBtnOff: {
      opacity: 0.45,
    },
    resetBtnText: {
      color: colors.text,
      fontWeight: '800' as const,
      fontSize: 13,
    },
    about: {
      color: colors.faint,
      fontSize: 12,
      textAlign: 'center' as const,
      marginTop: 8,
    },
  };
}
