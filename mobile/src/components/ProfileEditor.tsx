import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { pickProfilePhoto } from '../profile';
import { radius, useTheme, useThemedStyles, type ThemeColors } from '../theme';
import { PlayerAvatar } from './PlayerAvatar';

type Props = {
  playerId: string;
  playerName: string;
  playerAvatar: string;
  onSaveName: (name: string) => void;
  onChangeAvatar: (avatar: string) => void;
  onReadyName?: (name: string) => void;
};

export function ProfileEditor({
  playerId,
  playerName,
  playerAvatar,
  onSaveName,
  onChangeAvatar,
  onReadyName,
}: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [editing, setEditing] = useState(playerName.trim().length < 2);
  const [draft, setDraft] = useState(playerName);
  const [hint, setHint] = useState('');
  const [hintOk, setHintOk] = useState(true);
  const [busy, setBusy] = useState(false);

  const readyRef = useRef(onReadyName);
  readyRef.current = onReadyName;

  useEffect(() => {
    if (!editing) setDraft(playerName);
  }, [playerName, editing]);

  useEffect(() => {
    readyRef.current?.(editing ? draft : playerName);
  }, [draft, editing, playerName]);

  const saveName = () => {
    const name = draft.trim();
    if (name.length < 2) {
      setHint('Escreva um nome com pelo menos 2 letras');
      setHintOk(false);
      return;
    }
    onSaveName(name);
    setEditing(false);
    setHint('Nome salvo neste aparelho');
    setHintOk(true);
  };

  const choosePhoto = async () => {
    setBusy(true);
    setHint('');
    try {
      const uri = await pickProfilePhoto();
      if (!uri) {
        setHint('Não deu para usar a foto. Permita o acesso à galeria.');
        setHintOk(false);
        return;
      }
      onChangeAvatar(uri);
      setHint('Foto salva neste aparelho');
      setHintOk(true);
    } catch {
      setHint('Não deu para abrir a galeria');
      setHintOk(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Pressable
          accessibilityLabel="Escolher foto de perfil"
          onPress={choosePhoto}
          disabled={busy}
          style={styles.photoBtn}
        >
          <PlayerAvatar name={draft || playerName || 'Você'} id={playerId} avatar={playerAvatar} size={64} self />
          <View style={styles.cameraBadge}>
            {busy ? (
              <ActivityIndicator size="small" color={colors.onAccent} />
            ) : (
              <Ionicons name="camera" size={14} color={colors.onAccent} />
            )}
          </View>
        </Pressable>

        <View style={styles.fields}>
          <Text style={styles.label}>Nome de exibição</Text>
          {editing ? (
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Ex: Luan"
              placeholderTextColor={colors.placeholder}
              maxLength={18}
              autoCapitalize="words"
              autoFocus
              style={styles.input}
            />
          ) : (
            <Text style={styles.name} numberOfLines={1}>
              {playerName || 'Sem nome'}
            </Text>
          )}
          <View style={styles.actions}>
            {editing ? (
              <>
                {playerName.trim().length >= 2 ? (
                  <Pressable
                    style={styles.ghostBtn}
                    onPress={() => {
                      setDraft(playerName);
                      setEditing(false);
                      setHint('');
                    }}
                  >
                    <Text style={styles.ghostBtnText}>Cancelar</Text>
                  </Pressable>
                ) : null}
                <Pressable style={styles.saveBtn} onPress={saveName}>
                  <Ionicons name="checkmark" size={16} color={colors.onAccent} />
                  <Text style={styles.saveBtnText}>Salvar</Text>
                </Pressable>
              </>
            ) : (
              <Pressable style={styles.editBtn} onPress={() => setEditing(true)}>
                <Ionicons name="pencil" size={14} color={colors.indigo} />
                <Text style={styles.editBtnText}>Editar</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>

      {playerAvatar ? (
        <Pressable onPress={() => onChangeAvatar('')} style={styles.remove}>
          <Text style={styles.removeText}>Remover foto</Text>
        </Pressable>
      ) : (
        <Text style={styles.help}>Toque na foto para escolher. Nome e foto ficam salvos neste aparelho e aparecem na sala.</Text>
      )}
      {hint ? <Text style={hintOk ? styles.hint : styles.hintError}>{hint}</Text> : null}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return {
    card: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: radius.xl,
      padding: 12,
      gap: 10,
    },
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 12,
    },
    photoBtn: {
      width: 64,
      height: 64,
    },
    cameraBadge: {
      position: 'absolute' as const,
      right: -2,
      bottom: -2,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.indigoStrong,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      borderWidth: 2,
      borderColor: colors.card,
    },
    fields: {
      flex: 1,
      minWidth: 0,
      gap: 4,
    },
    label: {
      color: colors.muted,
      fontSize: 11,
      fontWeight: '700' as const,
      textTransform: 'uppercase' as const,
    },
    name: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '800' as const,
      paddingVertical: 4,
    },
    input: {
      backgroundColor: colors.keypad,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 12,
      color: colors.text,
      fontSize: 16,
      fontWeight: '700' as const,
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    actions: {
      flexDirection: 'row' as const,
      gap: 8,
      marginTop: 4,
    },
    editBtn: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 6,
      backgroundColor: colors.keypadAlt,
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 7,
      alignSelf: 'flex-start' as const,
    },
    editBtnText: {
      color: colors.indigo,
      fontWeight: '800' as const,
      fontSize: 13,
    },
    saveBtn: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 4,
      backgroundColor: colors.indigoStrong,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 7,
    },
    saveBtnText: {
      color: colors.onAccent,
      fontWeight: '800' as const,
      fontSize: 13,
    },
    ghostBtn: {
      paddingHorizontal: 10,
      paddingVertical: 7,
      justifyContent: 'center' as const,
    },
    ghostBtnText: {
      color: colors.faint,
      fontWeight: '700' as const,
      fontSize: 13,
    },
    help: {
      color: colors.faint,
      fontSize: 12,
      lineHeight: 18,
    },
    hint: {
      color: colors.emerald,
      fontSize: 12,
      fontWeight: '700' as const,
    },
    hintError: {
      color: colors.red,
      fontSize: 12,
      fontWeight: '700' as const,
    },
    remove: {
      alignSelf: 'flex-start' as const,
    },
    removeText: {
      color: colors.red,
      fontSize: 12,
      fontWeight: '700' as const,
    },
  };
}
