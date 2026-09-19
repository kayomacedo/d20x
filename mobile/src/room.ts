import { useCallback, useEffect, useRef, useState } from 'react';
import { connectMqttRoom, type MqttClient } from './mqttLite';
import type { DiceGroup, DieRoll, RollResult } from './types';

export type RoomPlayer = {
  id: string;
  name: string;
};

export type RoomRoll = {
  id: string;
  playerId: string;
  playerName: string;
  result: RollResult;
  createdAt: number;
};

export type RoomStatus = 'idle' | 'connecting' | 'joined' | 'error';

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
  const clientRef = useRef<MqttClient | null>(null);
  const codeRef = useRef<string | null>(null);
  const nameRef = useRef('');
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const metaWaitRef = useRef<((found: boolean) => void) | null>(null);
  const metaSeenRef = useRef(false);
  const sessionRef = useRef(0);

  const clearHeartbeat = () => {
    if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    heartbeatRef.current = undefined;
  };

  const resetLocal = () => {
    clearHeartbeat();
    clientRef.current = null;
    codeRef.current = null;
    setCode(null);
    setPlayers([]);
    setRolls([]);
  };

  const handleMessage = useCallback((topic: string, payload: string) => {
    const currentCode = codeRef.current;
    if (!currentCode) return;
    const room = topics(currentCode);

    if (topic === room.meta) {
      if (payload) {
        metaSeenRef.current = true;
        metaWaitRef.current?.(true);
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
        const parsed = JSON.parse(payload) as { name?: string };
        const name = normalizePlayerName(parsed.name ?? '');
        if (!name) return;
        setPlayers((prev) => {
          const next = prev.filter((player) => player.id !== id);
          next.push({ id, name });
          return next.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
        });
      } catch {
        /* ignore */
      }
    }
  }, []);

  const leave = useCallback(() => {
    sessionRef.current += 1;
    const currentCode = codeRef.current;
    const client = clientRef.current;
    if (client && currentCode) {
      try {
        client.publish(topics(currentCode).presence(playerId), '', true);
      } catch {
        /* ignore */
      }
      client.disconnect();
    }
    resetLocal();
    setStatus('idle');
    setError(null);
  }, [playerId]);

  const enter = useCallback(
    async (rawCode: string, rawName: string, create: boolean) => {
      const nextCode = normalizeRoomCode(rawCode);
      const name = normalizePlayerName(rawName);
      if (name.length < 2) {
        setStatus('error');
        setError('Escreva um nome com pelo menos 2 letras');
        return;
      }
      if (nextCode.length < 4) {
        setStatus('error');
        setError('Código da sala inválido');
        return;
      }

      leave();
      const session = sessionRef.current + 1;
      sessionRef.current = session;
      nameRef.current = name;
      codeRef.current = nextCode;
      setStatus('connecting');
      setError(null);
      setCode(nextCode);
      setPlayers([{ id: playerId, name }]);
      setRolls([]);
      metaSeenRef.current = false;

      try {
        const client = await openBroker(
          `${playerId}-${Math.random().toString(36).slice(2, 6)}`,
          nextCode,
          playerId,
          handleMessage,
          () => {
            if (sessionRef.current !== session) return;
            resetLocal();
            setStatus('error');
            setError('A sala caiu. Entre de novo com o código.');
          },
        );
        if (sessionRef.current !== session) {
          client.disconnect();
          return;
        }

        clientRef.current = client;
        const room = topics(nextCode);
        const presence = JSON.stringify({ name });

        if (create) {
          client.publish(room.meta, JSON.stringify({ createdAt: Date.now(), host: name }), true);
        } else {
          const found =
            metaSeenRef.current ||
            (await new Promise<boolean>((resolve) => {
              metaWaitRef.current = resolve;
              setTimeout(() => resolve(false), 2800);
            }));
          metaWaitRef.current = null;
          if (!found) {
            if (sessionRef.current !== session) return;
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
          const latest = JSON.stringify({ name: nameRef.current || name });
          clientRef.current?.publish(room.presence(playerId), latest, true);
        }, 20000);

        setStatus('joined');
      } catch (err) {
        if (sessionRef.current !== session) return;
        resetLocal();
        setStatus('error');
        setError(err instanceof Error ? err.message : 'Não deu para abrir a sala');
      }
    },
    [handleMessage, leave, playerId],
  );

  const create = useCallback(
    (name: string) => enter(createRoomCode(), name, true),
    [enter],
  );

  const join = useCallback(
    (nextCode: string, name: string) => enter(nextCode, name, false),
    [enter],
  );

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

  const updateName = useCallback(
    (rawName: string) => {
      const name = normalizePlayerName(rawName);
      nameRef.current = name;
      const client = clientRef.current;
      const currentCode = codeRef.current;
      if (!client || !currentCode || name.length < 2) return;
      client.publish(topics(currentCode).presence(playerId), JSON.stringify({ name }), true);
      setPlayers((prev) => {
        const others = prev.filter((player) => player.id !== playerId);
        return [...others, { id: playerId, name }].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
      });
    },
    [playerId],
  );

  useEffect(() => () => {
    sessionRef.current += 1;
    clearHeartbeat();
    clientRef.current?.disconnect();
  }, []);

  return {
    status,
    code,
    players,
    rolls,
    error,
    create,
    join,
    leave,
    publishRoll,
    updateName,
  };
}
