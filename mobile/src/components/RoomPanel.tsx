import { useState } from 'react';
import { Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { formatBreakdownLine, formatRollWhen, formatTotal } from '../format';
import { shareRoomCode } from '../share';
import { radius, useThemedStyles, type ThemeColors } from '../theme';
import type { RoomPlayer, RoomRoll, RoomStatus } from '../room';

type Props = {
  playerName: string;
  onChangeName: (name: string) => void;
  joinCode: string;
  onChangeJoinCode: (code: string) => void;
  status: RoomStatus;
  code: string | null;
  players: RoomPlayer[];
  rolls: RoomRoll[];
  error: string | null;
  selfId: string;
  onCreate: () => void;
  onJoin: () => void;
  onLeave: () => void;
};

function PlayerChip({ player, self }: { player: RoomPlayer; self: boolean }) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={[styles.chip, self && styles.chipSelf]}>
      <Text style={[styles.chipText, self && styles.chipTextSelf]} numberOfLines={1}>
        {self ? `Você · ${player.name}` : player.name}
      </Text>
    </View>
  );
}

export function RoomPanel({
  playerName,
  onChangeName,
  joinCode,
  onChangeJoinCode,
  status,
  code,
  players,
  rolls,
  error,
  selfId,
  onCreate,
  onJoin,
  onLeave,
}: Props) {
  const styles = useThemedStyles(createStyles);
  const joined = status === 'joined' && code;
  const busy = status === 'connecting';
  const [copied, setCopied] = useState(false);

  const shareCode = () => {
    if (!code) return;
    shareRoomCode(code).then((result) => {
      if (result !== 'copied') return;
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  };

  if (joined) {
    return (
      <View style={styles.screen}>
        <View style={styles.toolbar}>
          <View style={styles.toolbarText}>
            <Text style={styles.title}>Sala {code}</Text>
            <Text style={styles.subtitle}>
              {players.length} jogador{players.length === 1 ? '' : 'es'} · role no Rolador
            </Text>
          </View>
          <Pressable style={styles.leaveBtn} onPress={onLeave}>
            <Text style={styles.leaveBtnText}>Sair</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Pressable style={styles.codeCard} onPress={shareCode}>
            <Text style={styles.codeLabel}>Código da sala</Text>
            <Text style={styles.codeValue} selectable>
              {code}
            </Text>
            <Text style={styles.codeHint}>
              {copied
                ? 'Código copiado'
                : Platform.OS === 'web'
                  ? 'Clique para copiar o link da sala'
                  : 'Toque para enviar o código'}
            </Text>
          </Pressable>

          <Text style={styles.section}>Na mesa</Text>
          <View style={styles.playerRow}>
            {players.map((player) => (
              <PlayerChip key={player.id} player={player} self={player.id === selfId} />
            ))}
          </View>

          <Text style={styles.section}>Rolagens da mesa</Text>
          {rolls.length === 0 ? (
            <Text style={styles.empty}>Ainda ninguém rolou. Vai no Rolador e joga os dados.</Text>
          ) : (
            rolls.map((item) => {
              const mine = item.playerId === selfId;
              return (
                <View key={item.id} style={[styles.rollCard, mine && styles.rollCardMine]}>
                  <View style={styles.rollTop}>
                    <View style={styles.rollMain}>
                      <Text style={styles.rollName} numberOfLines={1}>
                        {mine ? `Você · ${item.playerName}` : item.playerName}
                      </Text>
                      <Text style={styles.rollExpr} numberOfLines={1}>
                        {item.result.rawExpression}
                      </Text>
                      {item.result.dice.length > 0 ? (
                        <Text style={styles.rollBreak} numberOfLines={2}>
                          {formatBreakdownLine(item.result.dice, item.result.groups)}
                        </Text>
                      ) : null}
                      <Text style={styles.rollTime}>{formatRollWhen(item.createdAt)}</Text>
                    </View>
                    <View style={styles.rollTotalBox}>
                      <Text style={styles.totalLabel}>Total</Text>
                      <Text style={styles.rollTotal} numberOfLines={1} adjustsFontSizeToFit>
                        {formatTotal(item.result.total)}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.toolbar}>
        <View style={styles.toolbarText}>
          <Text style={styles.title}>Sala</Text>
          <Text style={styles.subtitle}>Crie um código e chama a mesa</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.fieldLabel}>Seu nome na mesa</Text>
        <TextInput
          value={playerName}
          onChangeText={onChangeName}
          placeholder="Ex: Luan"
          placeholderTextColor="#475569"
          maxLength={18}
          autoCapitalize="words"
          style={styles.input}
        />

        <Pressable
          style={[styles.primaryBtn, busy && styles.btnDisabled]}
          onPress={onCreate}
          disabled={busy}
        >
          <Text style={styles.primaryBtnText}>{busy ? 'Abrindo sala...' : 'Criar sala'}</Text>
        </Pressable>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>ou entrar</Text>
          <View style={styles.dividerLine} />
        </View>

        <Text style={styles.fieldLabel}>Código da sala</Text>
        <TextInput
          value={joinCode}
          onChangeText={onChangeJoinCode}
          placeholder="Ex: K7M2P"
          placeholderTextColor="#475569"
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={6}
          style={[styles.input, styles.codeInput]}
        />

        <Pressable
          style={[styles.secondaryBtn, busy && styles.btnDisabled]}
          onPress={onJoin}
          disabled={busy}
        >
          <Text style={styles.secondaryBtnText}>{busy ? 'Entrando...' : 'Entrar na sala'}</Text>
        </Pressable>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Text style={styles.help}>
          Quem tiver o app entra com o mesmo código. As rolagens de todo mundo aparecem aqui, com
          o nome de cada um.
        </Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
    gap: 8,
  },
  toolbarText: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.faint,
    fontSize: 12,
    marginTop: 2,
  },
  leaveBtn: {
    backgroundColor: '#7f1d1d',
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  leaveBtnText: {
    color: colors.red,
    fontWeight: '800',
    fontSize: 13,
  },
  content: {
    padding: 12,
    gap: 10,
    paddingBottom: 28,
  },
  fieldLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  codeInput: {
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  primaryBtn: {
    backgroundColor: colors.indigoStrong,
    borderRadius: radius.lg,
    paddingVertical: 13,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 15,
  },
  secondaryBtn: {
    backgroundColor: colors.keypadAlt,
    borderRadius: radius.lg,
    paddingVertical: 13,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 15,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    color: colors.faint,
    fontSize: 12,
    fontWeight: '700',
  },
  error: {
    color: colors.red,
    fontSize: 13,
    fontWeight: '700',
  },
  help: {
    color: colors.faint,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  codeCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.xl,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 4,
  },
  codeLabel: {
    color: colors.faint,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  codeValue: {
    color: colors.white,
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: 6,
  },
  codeHint: {
    color: colors.indigo,
    fontSize: 12,
    fontWeight: '700',
  },
  section: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginTop: 6,
  },
  playerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    backgroundColor: colors.keypad,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    maxWidth: '100%',
  },
  chipSelf: {
    backgroundColor: colors.keypadAlt,
    borderColor: colors.indigoStrong,
  },
  chipText: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 12,
  },
  chipTextSelf: {
    color: colors.indigo,
  },
  empty: {
    color: colors.faint,
    fontSize: 13,
    lineHeight: 18,
  },
  rollCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 10,
  },
  rollCardMine: {
    borderColor: colors.indigoStrong,
  },
  rollTop: {
    flexDirection: 'row',
    gap: 10,
  },
  rollMain: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  rollName: {
    color: colors.indigo,
    fontWeight: '800',
    fontSize: 13,
  },
  rollExpr: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 14,
  },
  rollBreak: {
    color: colors.muted,
    fontSize: 12,
  },
  rollTime: {
    color: colors.faint,
    fontSize: 11,
    marginTop: 2,
  },
  rollTotalBox: {
    width: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalLabel: {
    color: colors.faint,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  rollTotal: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '900' as const,
    fontVariant: ['tabular-nums'] as const,
  },
  };
}
