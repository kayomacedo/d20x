import { useEffect, useState, type ReactNode } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AppSplash } from './src/components/AppSplash';
import { BrandMark } from './src/components/BrandMark';
import { ConfirmClearModal } from './src/components/ConfirmClearModal';
import { DiceBreakdown } from './src/components/DiceBreakdown';
import { HistoryPanel } from './src/components/HistoryPanel';
import { Keypad } from './src/components/Keypad';
import { RollAnimation } from './src/components/RollAnimation';
import { RoomPanel } from './src/components/RoomPanel';
import { SettingsPanel } from './src/components/SettingsPanel';
import { UpdateModal } from './src/components/UpdateModal';
import { appendDiceToExpression, parseAndRollExpression } from './src/dice';
import { capHistory, newHistoryItem } from './src/history';
import { formatTotal, totalFontSize } from './src/format';
import { createPlayerId, isRoomOpen, normalizeRoomCode, useRoom } from './src/room';
import { roomCodeFromUrl, writeRoomCodeToUrl } from './src/share';
import {
  MULTI_SOUNDS,
  SINGLE_SOUNDS,
  playWithPlayer,
  resolveRollSound,
  type MultiSoundId,
  type SingleSoundId,
} from './src/sound';
import { emptyStats, loadSession, saveSession } from './src/storage';
import {
  ThemeProvider,
  radius,
  useLayoutScale,
  useTheme,
  useThemedStyles,
  webFrameStyle,
  webPageStyle,
  type ThemeColors,
  type ThemeId,
} from './src/theme';
import type { HistoryItem, RollResult, SessionStats } from './src/types';
import { checkForUpdate, installedVersion, openApk, type UpdateFeed } from './src/update';

type Tab = 'roller' | 'history' | 'room';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

if (Platform.OS === 'web' && typeof document !== 'undefined') {
  document.documentElement.style.height = '100%';
  document.body.style.height = '100%';
  document.body.style.margin = '0';
  document.body.style.background = '#020617';
}

function DiceApp({
  themeId,
  setThemeId,
}: {
  themeId: ThemeId;
  setThemeId: (id: ThemeId) => void;
}) {
  const { colors, statusBar } = useTheme();
  const styles = useThemedStyles(createAppStyles);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<Tab>('roller');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [expression, setExpression] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [stats, setStats] = useState<SessionStats>(emptyStats);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticEnabled, setHapticEnabled] = useState(true);
  const [rollAnimationEnabled, setRollAnimationEnabled] = useState(true);
  const [singleSoundId, setSingleSoundId] = useState<SingleSoundId>('plastic');
  const [multiSoundId, setMultiSoundId] = useState<MultiSoundId>('handful');
  const [rollFx, setRollFx] = useState<RollResult | null>(null);
  const [updateLatest, setUpdateLatest] = useState<UpdateFeed | null>(null);
  const [updateVisible, setUpdateVisible] = useState(false);
  const [updateHint, setUpdateHint] = useState('');
  const [updateBusy, setUpdateBusy] = useState(false);
  const [dismissedUpdateVersion, setDismissedUpdateVersion] = useState('');
  const appVersion = installedVersion();
  const singlePlastic = useAudioPlayer(SINGLE_SOUNDS.plastic);
  const singleWood = useAudioPlayer(SINGLE_SOUNDS.wood);
  const singleStone = useAudioPlayer(SINGLE_SOUNDS.stone);
  const multiHandful = useAudioPlayer(MULTI_SOUNDS.handful);
  const multiTumble = useAudioPlayer(MULTI_SOUNDS.tumble);
  const multiTable = useAudioPlayer(MULTI_SOUNDS.table);
  const [lastResult, setLastResult] = useState<RollResult | null>(null);
  const [lastTimestamp, setLastTimestamp] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [playerId, setPlayerId] = useState(createPlayerId);
  const [joinCode, setJoinCode] = useState(roomCodeFromUrl);
  const room = useRoom(playerId);
  const layout = useLayoutScale();

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = 'D20X';
    }
    if (roomCodeFromUrl()) setTab('room');
  }, []);

  useEffect(() => {
    if (isRoomOpen(room.status) && room.code) writeRoomCodeToUrl(room.code);
  }, [room.status, room.code]);

  useEffect(() => {
    let cancelled = false;
    loadSession().then((session) => {
      if (cancelled) return;
      setExpression(session.expression);
      setHistory(session.history);
      setStats(session.stats);
      setSoundEnabled(session.soundEnabled);
      setHapticEnabled(session.hapticEnabled);
      setRollAnimationEnabled(session.rollAnimationEnabled);
      setSingleSoundId(session.singleSoundId);
      setMultiSoundId(session.multiSoundId);
      setThemeId(session.themeId);
      setAudioModeAsync({
        playsInSilentMode: true,
        interruptionMode: 'duckOthers',
        shouldPlayInBackground: false,
      }).catch(() => undefined);
      setLastResult(session.lastResult);
      setLastTimestamp(session.lastTimestamp);
      setLastError(session.lastError);
      setPlayerName(session.playerName);
      setPlayerId(session.playerId || createPlayerId());
      setDismissedUpdateVersion(session.dismissedUpdateVersion ?? '');
      requestAnimationFrame(() => {
        SplashScreen.hideAsync().catch(() => undefined);
        setTimeout(() => {
          if (!cancelled) setReady(true);
        }, 750);
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    saveSession({
      expression,
      history,
      stats,
      soundEnabled,
      hapticEnabled,
      rollAnimationEnabled,
      singleSoundId,
      multiSoundId,
      themeId,
      lastResult,
      lastTimestamp,
      lastError,
      playerName,
      playerId,
      dismissedUpdateVersion,
    }).catch(() => undefined);
  }, [ready, expression, history, stats, soundEnabled, hapticEnabled, rollAnimationEnabled, singleSoundId, multiSoundId, themeId, lastResult, lastTimestamp, lastError, playerName, playerId, dismissedUpdateVersion]);

  const hasClearableHistory = history.some((item) => !item.favorite);

  const runUpdateCheck = async (fromSettings = false) => {
    if (fromSettings) setUpdateHint('Procurando versão nova...');
    const result = await checkForUpdate();
    if (result.status === 'available') {
      setUpdateLatest(result.latest);
      setUpdateHint(`Tem versão nova: ${result.latest.version}`);
      const alreadySeen = result.latest.version === dismissedUpdateVersion;
      if (fromSettings || result.latest.force || !alreadySeen) {
        setUpdateVisible(true);
      }
      return;
    }
    if (result.status === 'current') {
      setUpdateHint('Você já está na última versão.');
      return;
    }
    if (result.status === 'unavailable') {
      setUpdateHint('Falta o link do feed em app.json (extra.updateFeedUrl).');
      return;
    }
    setUpdateHint(result.message);
  };

  useEffect(() => {
    if (!ready) return;
    runUpdateCheck(false).catch(() => undefined);
  }, [ready]);

  const playSingleSound = (id: SingleSoundId) => {
    const player = id === 'wood' ? singleWood : id === 'stone' ? singleStone : singlePlastic;
    playWithPlayer(player).catch((error) => {
      console.warn('Falha ao tocar som dos dados', error);
    });
  };

  const playMultiSound = (id: MultiSoundId) => {
    const player = id === 'tumble' ? multiTumble : id === 'table' ? multiTable : multiHandful;
    playWithPlayer(player).catch((error) => {
      console.warn('Falha ao tocar som dos dados', error);
    });
  };

  const playDiceSound = (diceCount: number) => {
    if (resolveRollSound(diceCount) === 'single') playSingleSound(singleSoundId);
    else playMultiSound(multiSoundId);
  };

  const roll = (nextExpression = expression) => {
    const inputVal = nextExpression.trim();
    if (!inputVal) return;

    try {
      const result = parseAndRollExpression(inputVal);
      if (!result) return;

      if (soundEnabled) playDiceSound(result.dice.length);
      if (hapticEnabled) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
      }
      if (rollAnimationEnabled) setRollFx(result);

      const timestamp = new Date().toLocaleTimeString('pt-BR');
      setExpression(inputVal);
      setLastResult(result);
      setLastTimestamp(timestamp);
      setLastError(null);
      setHistory((prev) => capHistory([newHistoryItem(result, timestamp), ...prev]));
      setStats((prev) => ({
        totalRolls: prev.totalRolls + 1,
        maxCrits: prev.maxCrits + result.maxCrits,
        minCrits: prev.minCrits + result.minCrits,
      }));
      room.publishRoll(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Expressão de dados inválida';
      setLastError(message);
      setLastResult(null);
    }
  };

  const clearVisor = () => {
    setExpression('');
    setLastResult(null);
    setLastTimestamp(null);
    setLastError(null);
  };

  const toggleFavorite = (id: string) => {
    setHistory((prev) =>
      prev.map((item) => (item.id === id ? { ...item, favorite: !item.favorite } : item)),
    );
  };

  const deleteHistoryItem = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  const deleteHistoryItems = (ids: string[]) => {
    const remove = new Set(ids);
    setHistory((prev) => prev.filter((item) => item.favorite || !remove.has(item.id)));
  };

  const clearHistoryKeepFavorites = () => {
    setHistory((prev) => prev.filter((item) => item.favorite));
    setConfirmClear(false);
  };

  const rerollFromHistory = (expr: string) => {
    setTab('roller');
    roll(expr);
  };

  if (!ready) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
        <StatusBar style={statusBar} />
        <AppSplash />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar style={statusBar} />
      {!settingsOpen ? (
        <View style={styles.header}>
          <View style={styles.brand}>
            <BrandMark size={32} />
            <View style={styles.brandText}>
              <Text style={[styles.title, { fontSize: layout.titleSize }]} numberOfLines={1}>
                D20X
              </Text>
              {!layout.compact ? (
                <Text style={styles.subtitle}>Rolador D&D / RPG de mesa</Text>
              ) : null}
            </View>
          </View>
          <Pressable
            accessibilityLabel="Abrir ajustes"
            style={styles.iconBtn}
            onPress={() => setSettingsOpen(true)}
          >
            <Ionicons name="settings-outline" size={20} color={colors.muted} />
          </Pressable>
        </View>
      ) : null}

      <View style={styles.body}>
      {settingsOpen ? (
        <SettingsPanel
          playerName={playerName}
          onChangeName={(name) => {
            setPlayerName(name);
            room.updateName(name);
          }}
          themeId={themeId}
          onChangeTheme={setThemeId}
          soundEnabled={soundEnabled}
          onToggleSound={setSoundEnabled}
          hapticEnabled={hapticEnabled}
          onToggleHaptic={setHapticEnabled}
          rollAnimationEnabled={rollAnimationEnabled}
          onToggleAnimation={setRollAnimationEnabled}
          singleSoundId={singleSoundId}
          multiSoundId={multiSoundId}
          onChangeSingleSound={setSingleSoundId}
          onChangeMultiSound={setMultiSoundId}
          onPreviewSingleSound={playSingleSound}
          onPreviewMultiSound={playMultiSound}
          stats={stats}
          onResetStats={() => setStats(emptyStats)}
          onClose={() => setSettingsOpen(false)}
          appVersion={appVersion}
          updateHint={updateHint}
          onCheckUpdate={() => {
            runUpdateCheck(true).catch(() => undefined);
          }}
        />
      ) : tab === 'history' ? (
        <HistoryPanel
          items={history}
          onReroll={rerollFromHistory}
          onToggleFavorite={toggleFavorite}
          onDelete={deleteHistoryItem}
          onDeleteMany={deleteHistoryItems}
          onClearKeepFavorites={() => {
            if (hasClearableHistory) setConfirmClear(true);
          }}
        />
      ) : tab === 'room' ? (
        <RoomPanel
          playerName={playerName}
          onChangeName={(name) => {
            setPlayerName(name);
            room.updateName(name);
          }}
          joinCode={joinCode}
          onChangeJoinCode={(value) => setJoinCode(normalizeRoomCode(value))}
          status={room.status}
          code={room.code}
          players={room.players}
          rolls={room.rolls}
          error={room.error}
          selfId={playerId}
          onCreate={() => room.create(playerName)}
          onJoin={() => room.join(joinCode, playerName)}
          onLeave={room.leave}
          onReconnect={room.reconnect}
        />
      ) : (
      <ScrollView
        contentContainerStyle={[styles.content, { padding: layout.screenPad }]}
        keyboardShouldPersistTaps="handled"
      >
        {isRoomOpen(room.status) && room.code ? (
          <Pressable style={styles.roomBanner} onPress={() => setTab('room')}>
            <Text style={styles.roomBannerText} numberOfLines={1}>
              Sala {room.code} · {room.players.length} jogador{room.players.length === 1 ? '' : 'es'}
            </Text>
            <Text style={styles.roomBannerHint}>rolagens vão para a mesa</Text>
          </Pressable>
        ) : null}
        <View style={styles.display}>
          <View style={styles.displayTop}>
            <View style={styles.legend}>
              <Text style={styles.legendRed}>1 falha</Text>
              <Text style={styles.legendGreen}>Máx crítico</Text>
              <Text style={styles.legendNeutral}>Outros</Text>
            </View>
            <View style={styles.displayActions}>
              <Pressable
                accessibilityLabel={soundEnabled ? 'Desligar som' : 'Ligar som'}
                style={[styles.iconBtn, soundEnabled && styles.iconBtnOn]}
                onPress={() => {
                  setSoundEnabled((value) => {
                    const next = !value;
                    if (next) {
                      playSingleSound(singleSoundId);
                    }
                    return next;
                  });
                }}
              >
                <Ionicons
                  name={soundEnabled ? 'volume-high' : 'volume-mute'}
                  size={18}
                  color={soundEnabled ? colors.emerald : colors.faint}
                />
              </Pressable>
              <Pressable
                accessibilityLabel="Limpar visor"
                style={styles.iconBtn}
                onPress={clearVisor}
              >
                <Ionicons name="trash-outline" size={17} color={colors.red} />
              </Pressable>
            </View>
          </View>

          <View style={styles.inputRow}>
            <TextInput
              value={expression}
              onChangeText={setExpression}
              placeholder="Ex: 3d20 + 5"
              placeholderTextColor={colors.placeholder}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={() => roll()}
              style={[styles.input, { fontSize: Math.min(layout.inputSize, expression.length > 16 ? 16 : layout.inputSize) }]}
            />
            <Pressable
              style={styles.backspace}
              onPress={() => setExpression((value) => value.slice(0, -1))}
            >
              <Text style={styles.backspaceText}>⌫</Text>
            </Pressable>
          </View>

          <View style={styles.resultBox}>
            <View style={styles.resultHead}>
              <Text style={styles.resultLabel}>Último resultado</Text>
              <Text style={styles.timestamp}>{lastTimestamp ?? '--:--:--'}</Text>
            </View>
            {lastError ? (
              <Text style={styles.error}>{lastError}</Text>
            ) : lastResult ? (
              <View style={styles.resultBody}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.45}
                    style={[styles.totalValue, { fontSize: totalFontSize(lastResult.total, layout.totalSize) }]}
                  >
                    {formatTotal(lastResult.total)}
                  </Text>
                </View>
                {lastResult.dice.length > 0 ? (
                  <ScrollView
                    style={styles.diceScroller}
                    contentContainerStyle={styles.diceWrap}
                    nestedScrollEnabled
                  >
                    <DiceBreakdown dice={lastResult.dice} groups={lastResult.groups} compact />
                  </ScrollView>
                ) : (
                  <Text style={styles.hint}>Constante matemática (sem dados)</Text>
                )}
              </View>
            ) : (
              <Text style={styles.hint}>Digite uma expressão e pressione Rolar</Text>
            )}
          </View>
        </View>

        <Keypad
          onAppendChar={(char) => setExpression((value) => value + char)}
          onAppendDice={(die) => setExpression((value) => appendDiceToExpression(value, die))}
          onInsertMacro={setExpression}
          onClear={clearVisor}
          onRoll={() => roll()}
        />

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Rolagens</Text>
            <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
              {formatTotal(stats.totalRolls)}
            </Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statLabel, styles.statGreen]}>Críticos</Text>
            <Text style={[styles.statValue, styles.statGreen]} numberOfLines={1} adjustsFontSizeToFit>
              {formatTotal(stats.maxCrits)}
            </Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statLabel, styles.statRed]}>Falhas (1)</Text>
            <Text style={[styles.statValue, styles.statRed]} numberOfLines={1} adjustsFontSizeToFit>
              {formatTotal(stats.minCrits)}
            </Text>
          </View>
        </View>

      </ScrollView>
      )}
      </View>

      {settingsOpen ? null : <View style={styles.tabBar}>
        <Pressable
          style={[styles.tabBtn, tab === 'roller' && styles.tabBtnActive]}
          onPress={() => setTab('roller')}
        >
          <Ionicons name="dice-outline" size={15} color={tab === 'roller' ? colors.text : colors.faint} />
          <Text style={[styles.tabText, tab === 'roller' && styles.tabTextActive]}>Rolador</Text>
        </Pressable>
        <Pressable
          style={[styles.tabBtn, tab === 'history' && styles.tabBtnActive]}
          onPress={() => setTab('history')}
        >
          <Ionicons name="time-outline" size={15} color={tab === 'history' ? colors.text : colors.faint} />
          <Text style={[styles.tabText, tab === 'history' && styles.tabTextActive]}>Histórico</Text>
          {history.length > 0 ? (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{history.length}</Text>
            </View>
          ) : null}
        </Pressable>
        <Pressable
          style={[styles.tabBtn, tab === 'room' && styles.tabBtnActive]}
          onPress={() => setTab('room')}
        >
          <Ionicons name="people-outline" size={15} color={tab === 'room' ? colors.text : colors.faint} />
          <Text style={[styles.tabText, tab === 'room' && styles.tabTextActive]}>Sala</Text>
          {isRoomOpen(room.status) ? (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{room.players.length}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>}

      <RollAnimation result={rollFx} visible={Boolean(rollFx)} onDone={() => setRollFx(null)} />

      <UpdateModal
        visible={updateVisible}
        installed={appVersion}
        latest={updateLatest}
        downloading={updateBusy}
        onLater={() => {
          if (updateLatest?.version) setDismissedUpdateVersion(updateLatest.version);
          setUpdateVisible(false);
        }}
        onDownload={() => {
          if (!updateLatest?.apkUrl) return;
          setUpdateBusy(true);
          openApk(updateLatest.apkUrl)
            .catch(() => undefined)
            .finally(() => setUpdateBusy(false));
        }}
      />

      <ConfirmClearModal
        visible={confirmClear}
        title="Limpar o histórico?"
        message="Apaga todas as rolagens, menos as que estão nos favoritos. Depois dá para desfavoritar uma a uma."
        confirmLabel="Limpar tudo"
        onCancel={() => setConfirmClear(false)}
        onConfirm={clearHistoryKeepFavorites}
      />
    </SafeAreaView>
  );
}

function ThemedShell({ children }: { children: ReactNode }) {
  const { colors } = useTheme();

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    document.body.style.background = colors.page;
    document.documentElement.style.background = colors.page;
  }, [colors.page]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <View style={Platform.OS === 'web' ? webPageStyle(colors) : { flex: 1 }}>
          <View style={Platform.OS === 'web' ? webFrameStyle(colors) : { flex: 1 }}>
            {children}
          </View>
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default function App() {
  const [themeId, setThemeId] = useState<ThemeId>('slate');
  return (
    <ThemeProvider themeId={themeId}>
      <ThemedShell>
        <DiceApp themeId={themeId} setThemeId={setThemeId} />
      </ThemedShell>
    </ThemeProvider>
  );
}

function createAppStyles(colors: ThemeColors) {
  return {
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  loading: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: colors.muted,
  },
  body: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
    minWidth: 0,
  },
  brandText: {
    flexShrink: 1,
    minWidth: 0,
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: colors.indigoStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 12,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.faint,
    fontSize: 11,
  },
  displayTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#0f172a',
    paddingBottom: 8,
  },
  displayActions: {
    flexDirection: 'row',
    gap: 6,
    flexShrink: 0,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.keypadAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnOn: {
    backgroundColor: colors.keypadAlt,
  },
  content: {
    padding: 12,
    gap: 10,
    paddingBottom: 24,
  },
  display: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: 12,
    gap: 8,
    overflow: 'hidden',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    flexShrink: 1,
    minWidth: 0,
  },
  legendRed: { color: colors.red, fontSize: 10, fontWeight: '600' },
  legendGreen: { color: colors.emerald, fontSize: 10, fontWeight: '600' },
  legendNeutral: { color: colors.muted, fontSize: 10, fontWeight: '600' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    minWidth: 0,
    color: colors.indigo,
    fontSize: 24,
    fontWeight: '700',
    paddingVertical: 4,
  },
  backspace: {
    padding: 8,
  },
  backspaceText: {
    color: colors.muted,
    fontSize: 20,
  },
  resultBox: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
  },
  resultHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  resultLabel: {
    color: colors.faint,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  timestamp: {
    color: '#475569',
    fontSize: 11,
    fontVariant: ['tabular-nums'],
  },
  resultBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minWidth: 0,
  },
  totalRow: {
    gap: 2,
    minWidth: 56,
    flexShrink: 0,
  },
  totalLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  totalValue: {
    color: colors.white,
    fontSize: 28,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  diceScroller: {
    flex: 1,
    maxHeight: 72,
    minWidth: 0,
  },
  diceWrap: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingBottom: 2,
  },
  moreDice: {
    color: colors.faint,
    fontSize: 12,
    fontWeight: '700',
    alignSelf: 'center',
    paddingHorizontal: 6,
  },
  hint: {
    color: colors.faint,
    fontStyle: 'italic',
  },
  error: {
    color: colors.red,
    backgroundColor: '#450a0a66',
    borderColor: '#7f1d1d',
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 10,
    flexShrink: 1,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  stat: {
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.xl,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: 'center',
    overflow: 'hidden',
  },
  statLabel: {
    color: colors.faint,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  statValue: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  statGreen: { color: colors.emerald },
  statRed: { color: colors.red },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: 4,
    gap: 6,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  tabBtnActive: {
    backgroundColor: colors.keypadAlt,
  },
  roomBanner: {
    backgroundColor: colors.chip,
    borderColor: colors.indigoStrong,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 8,
  },
  roomBannerText: {
    color: colors.indigo,
    fontWeight: '800',
    fontSize: 13,
  },
  roomBannerHint: {
    color: colors.faint,
    fontSize: 11,
    marginTop: 1,
  },
  tabText: {
    color: colors.faint,
    fontSize: 13,
    fontWeight: '700' as const,
  },
  tabTextActive: {
    color: colors.text,
  },
  tabBadge: {
    backgroundColor: colors.indigoStrong,
    borderRadius: 999,
    minWidth: 18,
    paddingHorizontal: 6,
    paddingVertical: 1,
    alignItems: 'center',
  },
  tabBadgeText: {
    color: colors.onAccent,
    fontSize: 10,
    fontWeight: '800' as const,
    fontVariant: ['tabular-nums'] as const,
  },
  };
}
