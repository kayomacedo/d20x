type MqttWill = {
  topic: string;
  payload: string;
};

type ConnectOptions = {
  url: string;
  protocol?: string;
  clientId: string;
  topics: string[];
  keepAlive?: number;
  will?: MqttWill;
};

type MqttHandlers = {
  onMessage?: (topic: string, payload: string) => void;
  onClose?: () => void;
};

export type MqttClient = {
  publish: (topic: string, payload: string, retain?: boolean) => void;
  disconnect: () => void;
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function encodeLength(value: number): number[] {
  const bytes: number[] = [];
  do {
    let encoded = value % 128;
    value = Math.floor(value / 128);
    if (value > 0) encoded |= 128;
    bytes.push(encoded);
  } while (value > 0);
  return bytes;
}

function encodeString(value: string): number[] {
  const bytes = encoder.encode(value);
  return [(bytes.length >> 8) & 0xff, bytes.length & 0xff, ...bytes];
}

function concatBytes(parts: Array<number[] | Uint8Array>): Uint8Array {
  const arrays = parts.map((part) => (part instanceof Uint8Array ? part : new Uint8Array(part)));
  const total = arrays.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of arrays) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

function packet(typeFlags: number, variable: number[] | Uint8Array): Uint8Array {
  const body = variable instanceof Uint8Array ? variable : new Uint8Array(variable);
  return concatBytes([[typeFlags], encodeLength(body.length), body]);
}

function toBytes(data: unknown): Uint8Array | null {
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  if (ArrayBuffer.isView(data)) {
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  }
  return null;
}

function readRemainingLength(buf: Uint8Array): { length: number; header: number } | null {
  if (buf.length < 2) return null;
  let multiplier = 1;
  let value = 0;
  for (let i = 1; i <= 4; i += 1) {
    if (buf.length <= i) return null;
    const encoded = buf[i];
    value += (encoded & 127) * multiplier;
    if ((encoded & 128) === 0) return { length: value, header: i + 1 };
    multiplier *= 128;
  }
  return null;
}

function readMqttString(buf: Uint8Array, offset: number): { value: string; next: number } | null {
  if (offset + 2 > buf.length) return null;
  const length = (buf[offset] << 8) | buf[offset + 1];
  const start = offset + 2;
  const end = start + length;
  if (end > buf.length) return null;
  return { value: decoder.decode(buf.subarray(start, end)), next: end };
}

export function connectMqttRoom(options: ConnectOptions, handlers: MqttHandlers = {}): Promise<MqttClient> {
  const keepAlive = options.keepAlive ?? 30;
  const protocols = options.protocol ? [options.protocol] : undefined;

  return new Promise((resolve, reject) => {
    const ws = protocols ? new WebSocket(options.url, protocols) : new WebSocket(options.url);
    ws.binaryType = 'arraybuffer';

    let packetId = 1;
    let pingTimer: ReturnType<typeof setInterval> | undefined;
    let settled = false;
    let buffer = new Uint8Array(0);
    const timer = setTimeout(() => fail(new Error('Tempo esgotado ao abrir a sala')), 8000);

    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      cleanup();
      try {
        ws.close();
      } catch {
        /* ignore */
      }
      reject(error);
    };

    const succeed = (client: MqttClient) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(client);
    };

    const cleanup = () => {
      if (pingTimer) clearInterval(pingTimer);
      pingTimer = undefined;
    };

    const send = (bytes: Uint8Array) => {
      if (ws.readyState !== WebSocket.OPEN) return;
      ws.send(bytes);
    };

    const nextPacketId = () => {
      packetId = packetId >= 65535 ? 1 : packetId + 1;
      return packetId;
    };

    const subscribeAll = () => {
      for (const topic of options.topics) {
        const id = nextPacketId();
        const body = concatBytes([[(id >> 8) & 0xff, id & 0xff], encodeString(topic), [0]]);
        send(packet(0x82, body));
      }
    };

    const handlePacket = (raw: Uint8Array) => {
      const type = raw[0] >> 4;
      const remaining = readRemainingLength(raw);
      if (!remaining) return;
      const body = raw.subarray(remaining.header);

      if (type === 2) {
        const code = body[1] ?? 1;
        if (code !== 0) {
          fail(new Error('Broker recusou a conexão'));
          return;
        }
        subscribeAll();
        pingTimer = setInterval(() => send(new Uint8Array([0xc0, 0x00])), keepAlive * 1000 * 0.6);
        return;
      }

      if (type === 9) {
        succeed({
          publish(topic, payload, retain = false) {
            const variable = concatBytes([encodeString(topic), encoder.encode(payload)]);
            send(packet(0x30 | (retain ? 1 : 0), variable));
          },
          disconnect() {
            cleanup();
            try {
              send(new Uint8Array([0xe0, 0x00]));
              ws.close();
            } catch {
              /* already closed */
            }
          },
        });
        return;
      }

      if (type === 3) {
        const qos = (raw[0] >> 1) & 0x03;
        const topic = readMqttString(body, 0);
        if (!topic) return;
        let offset = topic.next;
        if (qos > 0) {
          if (offset + 2 > body.length) return;
          const id = (body[offset] << 8) | body[offset + 1];
          offset += 2;
          if (qos === 1) send(new Uint8Array([0x40, 0x02, (id >> 8) & 0xff, id & 0xff]));
        }
        handlers.onMessage?.(topic.value, decoder.decode(body.subarray(offset)));
      }
    };

    const consume = (chunk: Uint8Array) => {
      const next = new Uint8Array(buffer.length + chunk.length);
      next.set(buffer);
      next.set(chunk, buffer.length);
      buffer = next;

      while (true) {
        const remaining = readRemainingLength(buffer);
        if (!remaining) break;
        const total = remaining.header + remaining.length;
        if (buffer.length < total) break;
        handlePacket(buffer.subarray(0, total));
        buffer = buffer.subarray(total);
      }
    };

    ws.onopen = () => {
      const flags = options.will ? 0x26 : 0x02;
      const payload = [
        ...encodeString(options.clientId),
        ...(options.will
          ? [...encodeString(options.will.topic), ...encodeString(options.will.payload)]
          : []),
      ];
      const variable = concatBytes([
        encodeString('MQTT'),
        [0x04, flags, (keepAlive >> 8) & 0xff, keepAlive & 0xff],
        payload,
      ]);
      send(packet(0x10, variable));
    };

    ws.onmessage = (event) => {
      const bytes = toBytes(event.data);
      if (bytes) consume(bytes);
    };

    ws.onerror = () => fail(new Error('Falha ao conectar na sala'));

    ws.onclose = () => {
      cleanup();
      if (!settled) {
        fail(new Error('Não foi possível abrir a sala'));
        return;
      }
      handlers.onClose?.();
    };
  });
}
