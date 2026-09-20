import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { connectMqttRoom, type MqttClient } from './mqttLite';
import { normalizeAvatar } from './profile';
import type { DiceGroup, DieRoll, RollResult } from './types';

export type RoomPlayer = {
  id: string;
  name: string;
  avatar: string;
};

export type RoomRoll = {
  id: string;
  playerId: string;
  playerName: string;
  result: RollResult;
  createdAt: number;
};

export type RoomStatus = 'idle' | 'connecting' | 'reconnecting' | 'joined' | 'error';

export function isRoomOpen(status: RoomStatus): boolean {
  return status === 'joined' || status === 'reconnecting';
}

const BROKERS = [
  { url: 'wss://broker.emqx.io:8084/mqtt', protocol: 'mqtt' },
  { url: 'wss://broker.emqx.io:8084/mqtt' },
  { url: 'wss://broker.hivemq.com:8884/mqtt', protocol: 'mqtt' },
];

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const ROOM_PREFIX = 'rpgdados/v1';
const ROLL_LIMIT = 40;

export function createPlayerId(): string {
  return `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function createRoomCode(): string {
  return Array.from({ length: 5 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');
}

export function normalizeRoomCode(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
}

export function normalizePlayerName(value: string): string {
  return value.trim().replace(/\s+/g, ' ').slice(0, 18);
}

export function normalizeRoomTitle(value: string): string {
  return value.trim().replace(/\s+/g, ' ').slice(0, 28);
}

function topics(code: string) {
  const base = `${ROOM_PREFIX}/${code}`;
  return {
    base,
    all: `${base}/#`,
    meta: `${base}/meta`,
    roll: `${base}/r`,
    log: `${base}/log`,
    presence: (playerId: string) => `${base}/p/${playerId}`,
  };
}

function isDie(value: unknown): value is DieRoll {
  if (!value || typeof value !== 'object') return false;
  const die = value as DieRoll;
  return (
    typeof die.sides === 'number' &&
    typeof die.value === 'number' &&
    typeof die.isKept === 'boolean'
  );
}

function isGroup(value: unknown): value is DiceGroup {
  if (!value || typeof value !== 'object') return false;
  const group = value as DiceGroup;
  return typeof group.notation === 'string' && Array.isArray(group.rolls);
}

function asRollResult(value: unknown): RollResult | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Partial<RollResult>;
  if (typeof raw.rawExpression !== 'string' || typeof raw.total !== 'number') return null;
  if (!Number.isFinite(raw.total) || !Array.isArray(raw.dice)) return null;
  return {
    rawExpression: raw.rawExpression.slice(0, 80),
    total: raw.total,
    dice: raw.dice.filter(isDie).slice(0, 40),
    groups: Array.isArray(raw.groups) ? raw.groups.filter(isGroup).slice(0, 20) : [],
    maxCrits: Number(raw.maxCrits) || 0,
    minCrits: Number(raw.minCrits) || 0,
  };
}

function asRoomRoll(value: unknown): RoomRoll | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Partial<RoomRoll>;
  const result = asRollResult(raw.result);
  if (!result || typeof raw.id !== 'string' || typeof raw.playerId !== 'string') return null;
  if (typeof raw.playerName !== 'string' || typeof raw.createdAt !== 'number') return null;
  return {
    id: raw.id.slice(0, 40),
    playerId: raw.playerId.slice(0, 40),
    playerName: normalizePlayerName(raw.playerName) || 'Jogador',
    result,
    createdAt: raw.createdAt,
  };
}

function presenceJSON(name: string, avatar: string): string {
  return JSON.stringify(avatar ? { name, avatar } : { name });
}

function asPresence(payload: string): { name: string; avatar: string } | null {
  try {
    const parsed = JSON.parse(payload) as { name?: string; avatar?: string };
    const name = normalizePlayerName(parsed.name ?? '');
    if (!name) return null;
    return { name, avatar: normalizeAvatar(parsed.avatar) };
  } catch {
    return null;
  }
}

function mergeRolls(current: RoomRoll[], incoming: RoomRoll[]): RoomRoll[] {
  const map = new Map<string, RoomRoll>();
  for (const roll of [...incoming, ...current]) map.set(roll.id, roll);
  return [...map.values()].sort((a, b) => b.createdAt - a.createdAt).slice(0, ROLL_LIMIT);
}

async function openBroker(
  clientId: string,
  code: string,
  playerId: string,
  onMessage: (topic: string, payload: string) => void,
  onClose: () => void,
): Promise<MqttClient> {
  const room = topics(code);
  let lastError: Error | null = null;

  for (const broker of BROKERS) {
    try {
      return await connectMqttRoom(
        {
          url: broker.url,
          protocol: broker.protocol,
          clientId,
          topics: [room.all],
          will: { topic: room.presence(playerId), payload: '' },
        },
        { onMessage, onClose },
      );
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Falha ao conectar na sala');
    }
  }

  throw lastError ?? new Error('Falha ao conectar na sala');
}

export function useRoom(playerId: string) {
  const [status, setStatus] = useState<RoomStatus>('idle');
  const [code, setCode] = useState<string | null>(null);
  const [players, setPlayers] = useState<RoomPlayer[]>([]);
  const [rolls, setRolls] = useState<RoomRoll[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hostName, setHostName] = useState('');
  const [roomTitle, setRoomTitle] = useState('');
  const clientRef = useRef<MqttClient | null>(null);
  const codeRef = useRef<string | null>(null);
  const nameRef = useRef('');
  const avatarRef = useRef('');
  const intendedRef = useRef<{ code: string; name: string; create: boolean; title: string } | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const metaWaitRef = useRef<((found: boolean) => void) | null>(null);
  const metaSeenRef = useRef(false);
  const sessionRef = useRef(0);

  const clearHeartbeat = () => {
    if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    heartbeatRef.current = undefined;
  };

  const clearReconnect = () => {
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    reconnectTimerRef.current = undefined;
  };

  const resetLocal = () => {
    clearHeartbeat();
    clearReconnect();
    clientRef.current = null;
    codeRef.current = null;
    intendedRef.current = null;
    setCode(null);
    setPlayers([]);
    setRolls([]);
    setHostName('');
    setRoomTitle('');
  };

  const dropClient = () => {
    sessionRef.current += 1;
    clearHeartbeat();
    clearReconnect();
    const client = clientRef.current;
    clientRef.current = null;
    if (client) {
      try {
        client.disconnect();
      } catch {
        /* ignore */
      }
    }
  };

  const handleMessage = useCallback((topic: string, payload: string) => {
    const currentCode = codeRef.current;
    if (!currentCode) return;
    const room = topics(currentCode);

    if (topic === room.meta) {
      if (payload) {
        metaSeenRef.current = true;
        metaWaitRef.current?.(true);
        try {
          const parsed = JSON.parse(payload) as { host?: string; title?: string };
          const host = normalizePlayerName(parsed.host ?? '');
          const title = normalizeRoomTitle(parsed.title ?? '');
          if (host) setHostName(host);
          if (title) setRoomTitle(title);
        } catch {
          /* ignore broken meta */
        }
      }
      return;
    }

    if (topic === room.log && payload) {
      try {
        const parsed = JSON.parse(payload);
        if (!Array.isArray(parsed)) return;
        const incoming = parsed.map(asRoomRoll).filter((item): item is RoomRoll => item !== null);
        setRolls((prev) => mergeRolls(prev, incoming));
      } catch {
        /* ignore broken log */
      }
      return;
    }

    if (topic === room.roll && payload) {
      try {
        const incoming = asRoomRoll(JSON.parse(payload));
        if (incoming) setRolls((prev) => mergeRolls(prev, [incoming]));
      } catch {
        /* ignore */
      }
      return;
    }

    if (topic.startsWith(`${room.base}/p/`)) {
      const id = topic.slice(`${room.base}/p/`.length);
      if (!id) return;
      if (!payload) {
        setPlayers((prev) => prev.filter((player) => player.id !== id));
        return;
      }
      try {
        const parsed = asPresence(payload);
        if (!parsed) return;
        setPlayers((prev) => {
          const next = prev.filter((player) => player.id !== id);
          next.push({ id, name: parsed.name, avatar: parsed.avatar });
          return next.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
        });
      } catch {
        /* ignore */
      }
    }
  }, []);

  const leave = useCallback(() => {
    const currentCode = codeRef.current;
    const client = clientRef.current;
    if (client && currentCode) {
      try {
        client.publish(topics(currentCode).presence(playerId), '', true);
      } catch {
        /* ignore */
      }
    }
    dropClient();
    resetLocal();
    setStatus('idle');
    setError(null);
  }, [playerId]);

  const enter = useCallback(
    async (rawCode: string, rawName: string, create: boolean, resume = false, rawTitle = '') => {
      const nextCode = normalizeRoomCode(rawCode);
      const name = normalizePlayerName(rawName);
      const title = normalizeRoomTitle(rawTitle);
      if (name.length < 2) {
        setStatus('error');
        setError('Defina seu nome de exibição em Ajustes');
        return;
      }
      if (create && !resume && title.length < 2) {
        setStatus('error');
        setError('Escreva o nome da sala');
        return;
      }
      if (nextCode.length < 4) {
        setStatus('error');
        setError('Código da sala inválido');
        return;
      }

      if (resume) dropClient();
      else leave();

      const session = sessionRef.current + 1;
      sessionRef.current = session;
      nameRef.current = name;
      codeRef.current = nextCode;
      intendedRef.current = { code: nextCode, name, create, title };
      setStatus(resume ? 'reconnecting' : 'connecting');
      setError(null);
      setCode(nextCode);
      if (!resume) {
        setPlayers([{ id: playerId, name, avatar: avatarRef.current }]);
        setRolls([]);
        metaSeenRef.current = false;
        setHostName(create ? name : '');
        setRoomTitle(create ? title : '');
      }

      try {
        const client = await openBroker(
          `${playerId}-${Math.random().toString(36).slice(2, 6)}`,
          nextCode,
          playerId,
          handleMessage,
          () => {
            if (sessionRef.current !== session) return;
            if (!intendedRef.current) return;
            clientRef.current = null;
            clearHeartbeat();
            setStatus('reconnecting');
            clearReconnect();
            reconnectTimerRef.current = setTimeout(() => {
              const next = intendedRef.current;
              if (!next || sessionRef.current !== session) return;
              enter(next.code, next.name, next.create, true, next.title).catch(() => undefined);
            }, 500);
          },
        );
        if (sessionRef.current !== session) {
          client.disconnect();
          return;
        }

        clientRef.current = client;
        const room = topics(nextCode);
        const presence = presenceJSON(nameRef.current || name, avatarRef.current);

        if (create) {
          client.publish(
            room.meta,
            JSON.stringify({ createdAt: Date.now(), host: name, title }),
            true,
          );
        } else if (!resume) {
          const found =
            metaSeenRef.current ||
            (await new Promise<boolean>((resolve) => {
              metaWaitRef.current = resolve;
              setTimeout(() => resolve(false), 2800);
            }));
          metaWaitRef.current = null;
          if (!found) {
            if (sessionRef.current !== session) return;
            intendedRef.current = null;
            sessionRef.current += 1;
            client.disconnect();
            resetLocal();
            setStatus('error');
            setError('Sala não encontrada. Confira o código.');
            return;
          }
        }

        client.publish(room.presence(playerId), presence, true);
        heartbeatRef.current = setInterval(() => {
          const latest = presenceJSON(nameRef.current || name, avatarRef.current);
          clientRef.current?.publish(room.presence(playerId), latest, true);
        }, 20000);

        setStatus('joined');
      } catch (err) {
        if (sessionRef.current !== session) return;
        if (resume && intendedRef.current) {
          setStatus('reconnecting');
          clearReconnect();
          reconnectTimerRef.current = setTimeout(() => {
            const next = intendedRef.current;
            if (!next) return;
            enter(next.code, next.name, next.create, true, next.title).catch(() => undefined);
          }, 1500);
          return;
        }
        resetLocal();
        setStatus('error');
        setError(err instanceof Error ? err.message : 'Não deu para abrir a sala');
      }
    },
    [handleMessage, leave, playerId],
  );

  const create = useCallback(
    (playerName: string, title: string) => enter(createRoomCode(), playerName, true, false, title),
    [enter],
  );

  const join = useCallback(
    (nextCode: string, name: string) => enter(nextCode, name, false),
    [enter],
  );

  const reconnect = useCallback(() => {
    const next = intendedRef.current;
    if (!next || clientRef.current) return;
    enter(next.code, nameRef.current || next.name, next.create, true, next.title).catch(() => undefined);
  }, [enter]);

  const publishRoll = useCallback(
    (result: RollResult) => {
      const client = clientRef.current;
      const currentCode = codeRef.current;
      if (!client || !currentCode || status !== 'joined') return;

      const item: RoomRoll = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        playerId,
        playerName: nameRef.current || 'Você',
        result,
        createdAt: Date.now(),
      };

      setRolls((prev) => {
        const next = mergeRolls(prev, [item]);
        const room = topics(currentCode);
        client.publish(room.roll, JSON.stringify(item));
        client.publish(room.log, JSON.stringify(next.slice(0, 25)), true);
        return next;
      });
    },
    [playerId, status],
  );

  const updateProfile = useCallback(
    (rawName: string, rawAvatar?: string) => {
      const name = normalizePlayerName(rawName);
      if (rawAvatar !== undefined) avatarRef.current = normalizeAvatar(rawAvatar);
      nameRef.current = name;
      if (intendedRef.current && name.length >= 2) {
        intendedRef.current = { ...intendedRef.current, name };
      }
      const client = clientRef.current;
      const currentCode = codeRef.current;
      if (!client || !currentCode || name.length < 2) return;
      client.publish(
        topics(currentCode).presence(playerId),
        presenceJSON(name, avatarRef.current),
        true,
      );
      setPlayers((prev) => {
        const others = prev.filter((player) => player.id !== playerId);
        return [...others, { id: playerId, name, avatar: avatarRef.current }].sort((a, b) =>
          a.name.localeCompare(b.name, 'pt-BR'),
        );
      });
    },
    [playerId],
  );

  const updateName = useCallback(
    (rawName: string) => updateProfile(rawName),
    [updateProfile],
  );

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      const next = intendedRef.current;
      if (!next || clientRef.current) return;
      enter(next.code, nameRef.current || next.name, next.create, true, next.title).catch(() => undefined);
    });
    return () => sub.remove();
  }, [enter]);

  useEffect(() => () => {
    sessionRef.current += 1;
    clearHeartbeat();
    clearReconnect();
    clientRef.current?.disconnect();
  }, []);

  return {
    status,
    code,
    hostName,
    roomTitle,
    players,
    rolls,
    error,
    create,
    join,
    leave,
    reconnect,
    publishRoll,
    updateName,
    updateProfile,
  };
}
