import { isRunningInExpoGo } from 'expo';
import { AppState, Platform } from 'react-native';
import { formatBreakdownLine, formatTotal } from './format';
import type { RoomRoll } from './room';

const CHANNEL_ID = 'd20x-sala';
let configured = false;
let Notifications: typeof import('expo-notifications') | null = null;

function loadNotifications() {
  if (Notifications) return Notifications;
  if (Platform.OS === 'web' || isRunningInExpoGo()) return null;
  try {
    const mod = require('expo-notifications') as typeof import('expo-notifications');
    Notifications = mod;
    mod.setNotificationHandler({
      handleNotification: async () => {
        const background = AppState.currentState !== 'active';
        return {
          shouldShowBanner: background,
          shouldShowList: true,
          shouldPlaySound: background,
          shouldSetBadge: false,
          priority: mod.AndroidNotificationPriority.HIGH,
        };
      },
    });
    return mod;
  } catch {
    return null;
  }
}

async function ensureChannel(mod: NonNullable<typeof Notifications>) {
  if (Platform.OS !== 'android') return;
  await mod.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Sala',
    importance: mod.AndroidImportance.HIGH,
    vibrationPattern: [0, 180, 80, 180],
    lockscreenVisibility: mod.AndroidNotificationVisibility.PUBLIC,
    enableVibrate: true,
  });
}

export async function prepareRoomNotifications(): Promise<boolean> {
  const mod = loadNotifications();
  if (!mod) return false;
  try {
    await ensureChannel(mod);
    const current = await mod.getPermissionsAsync();
    let status = current.status;
    if (status !== 'granted') {
      const asked = await mod.requestPermissionsAsync();
      status = asked.status;
    }
    configured = status === 'granted';
    return configured;
  } catch {
    return false;
  }
}

export async function notifyRoomRoll(roll: RoomRoll): Promise<void> {
  const mod = loadNotifications();
  if (!mod) return;
  try {
    if (!configured) {
      const ok = await prepareRoomNotifications();
      if (!ok) return;
    }
    const total = formatTotal(roll.result.total);
    const breakdown = roll.result.dice.length
      ? formatBreakdownLine(roll.result.dice, roll.result.groups)
      : '';
    const body = breakdown
      ? `${roll.result.rawExpression} = ${total} · ${breakdown}`
      : `${roll.result.rawExpression} = ${total}`;

    await mod.scheduleNotificationAsync({
      content: {
        title: `${roll.playerName} rolou na sala`,
        body,
        sound: AppState.currentState !== 'active',
        data: { type: 'room-roll', rollId: roll.id },
      },
      trigger: null,
    });
  } catch {
    /* notification is optional */
  }
}

export function watchRoomNotificationTaps(onOpenRoom: () => void) {
  const mod = loadNotifications();
  if (!mod) return () => undefined;
  const sub = mod.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;
    if (data?.type === 'room-roll') onOpenRoom();
  });
  return () => sub.remove();
}
