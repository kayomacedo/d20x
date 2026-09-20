import { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { PlayerAvatar } from './PlayerAvatar';
import { useTheme, useThemedStyles, type ThemeColors } from '../theme';
import type { RoomPlayer, RoomStatus } from '../room';

type Props = {
  code: string;
  roomTitle: string;
  hostName: string;
  players: RoomPlayer[];
  selfId: string;
  status: RoomStatus;
  onOpenRoom?: () => void;
};

function Avatar({
  player,
  self,
  size = 22,
  overlap,
}: {
  player: RoomPlayer;
  self: boolean;
  size?: number;
  overlap?: boolean;
}) {
  return (
    <PlayerAvatar
      name={player.name}
      id={player.id}
      avatar={player.avatar}
      size={size}
      self={self}
      style={overlap ? { marginLeft: -6 } : undefined}
    />
  );
}

export function RoomHeaderChip({ code, roomTitle, hostName, players, selfId, status, onOpenRoom }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [open, setOpen] = useState(false);
  const others = players.filter((player) => player.id !== selfId);
  const ordered = [...players.filter((player) => player.id === selfId), ...others];
  const shown = ordered.slice(0, 3);
  const extra = Math.max(0, ordered.length - shown.length);
  const creator = hostName || ordered[0]?.name || '—';

  return (
    <>
      <Pressable
        accessibilityLabel={`${roomTitle || 'Sala'} ${code}, ${players.length} jogadores`}
        onPress={() => setOpen(true)}
        style={styles.chip}
      >
        <View style={[styles.dot, status === 'reconnecting' ? styles.dotWait : styles.dotOn]} />
        <Text style={styles.code}>{code}</Text>
        <View style={styles.avatars}>
          {shown.map((player, index) => (
            <Avatar key={player.id} player={player} self={player.id === selfId} overlap={index > 0} />
          ))}
          {extra > 0 ? (
            <View style={[styles.avatar, styles.more, { marginLeft: -6 }]}>
              <Text style={[styles.avatarText, { color: colors.muted }]}>+{extra}</Text>
            </View>
          ) : null}
        </View>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.cascade} onPress={() => undefined}>
            <View style={styles.level}>
              <Text style={styles.levelLabel}>Sala</Text>
              <Text style={styles.levelTitle} numberOfLines={1}>
                {roomTitle || `Sala ${code}`}
              </Text>
              <Text style={styles.levelHint}>
                {status === 'reconnecting' ? 'Reconectando...' : `Código ${code}`}
              </Text>
            </View>

            <View style={styles.branch} />

            <View style={[styles.level, styles.levelNested]}>
              <Text style={styles.levelLabel}>Criou</Text>
              <Text style={styles.levelTitle}>{creator}</Text>
              <Text style={styles.levelHint}>Quem abriu a mesa</Text>
            </View>

            <View style={styles.branch} />

            <View style={[styles.level, styles.levelNestedDeep]}>
              <Text style={styles.levelLabel}>Online · {players.length}</Text>
              {ordered.map((player, index) => {
                const mine = player.id === selfId;
                const last = index === ordered.length - 1;
                return (
                  <View key={player.id} style={styles.onlineRow}>
                    <View style={styles.treeCol}>
                      <View style={styles.treeElbow} />
                      {!last ? <View style={styles.treeStem} /> : null}
                    </View>
                    <Avatar player={player} self={mine} size={26} />
                    <View style={styles.rowText}>
                      <Text style={styles.rowName} numberOfLines={1}>
                        {player.name}
                      </Text>
                      <Text style={styles.rowHint}>
                        {mine ? 'Você' : player.name === creator ? 'Na sala · criou' : 'Na sala'}
                      </Text>
                    </View>
                    <View style={styles.onlineDot} />
                  </View>
                );
              })}
            </View>

            {onOpenRoom ? (
              <Pressable
                style={styles.openBtn}
                onPress={() => {
                  setOpen(false);
                  onOpenRoom();
                }}
              >
                <Text style={styles.openBtnText}>Abrir a sala</Text>
              </Pressable>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function createStyles(colors: ThemeColors) {
  return {
    chip: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      height: 34,
      paddingLeft: 8,
      paddingRight: 6,
      borderRadius: 17,
      backgroundColor: colors.keypadAlt,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 6,
      maxWidth: 148,
      flexShrink: 1,
      minWidth: 0,
    },
    dot: {
      width: 7,
      height: 7,
      borderRadius: 4,
    },
    dotOn: {
      backgroundColor: colors.emerald,
    },
    dotWait: {
      backgroundColor: colors.amber,
    },
    code: {
      color: colors.indigo,
      fontSize: 11,
      fontWeight: '800' as const,
      letterSpacing: 1.2,
    },
    avatars: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
    },
    avatar: {
      width: 22,
      height: 22,
      borderRadius: 11,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      borderWidth: 1,
      borderColor: colors.surface,
    },
    avatarSelf: {
      borderColor: colors.indigo,
    },
    avatarText: {
      color: '#fff',
      fontSize: 8,
      fontWeight: '800' as const,
    },
    avatarTextLg: {
      fontSize: 10,
    },
    more: {
      backgroundColor: colors.keypad,
    },
    backdrop: {
      flex: 1,
      backgroundColor: '#02061788',
      justifyContent: 'flex-start',
      alignItems: 'flex-end',
      paddingTop: 56,
      paddingHorizontal: 12,
    },
    cascade: {
      width: 268,
      maxWidth: '100%',
      gap: 0,
    },
    level: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    levelNested: {
      marginLeft: 16,
    },
    levelNestedDeep: {
      marginLeft: 32,
    },
    levelLabel: {
      color: colors.indigo,
      fontSize: 10,
      fontWeight: '800' as const,
      textTransform: 'uppercase' as const,
      letterSpacing: 0.7,
    },
    levelTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '800' as const,
      marginTop: 2,
    },
    levelHint: {
      color: colors.faint,
      fontSize: 11,
      marginTop: 1,
    },
    branch: {
      width: 2,
      height: 10,
      marginLeft: 28,
      backgroundColor: colors.border,
    },
    onlineRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 8,
      marginTop: 8,
      minHeight: 28,
    },
    treeCol: {
      width: 12,
      alignSelf: 'stretch' as const,
      alignItems: 'center' as const,
    },
    treeElbow: {
      width: 10,
      height: 2,
      backgroundColor: colors.border,
      marginTop: 12,
      alignSelf: 'flex-start' as const,
    },
    treeStem: {
      flex: 1,
      width: 2,
      backgroundColor: colors.border,
    },
    rowText: {
      flex: 1,
      minWidth: 0,
    },
    rowName: {
      color: colors.text,
      fontSize: 13,
      fontWeight: '800' as const,
    },
    rowHint: {
      color: colors.faint,
      fontSize: 11,
    },
    onlineDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: colors.emerald,
    },
    openBtn: {
      marginTop: 10,
      marginLeft: 32,
      backgroundColor: colors.keypadAlt,
      borderRadius: 12,
      paddingVertical: 10,
      alignItems: 'center' as const,
    },
    openBtnText: {
      color: colors.text,
      fontWeight: '800' as const,
      fontSize: 13,
    },
  };
}
