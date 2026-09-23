import { createClient, type RedisClientType } from "redis";

const client: RedisClientType = createClient({ url: process.env.REDIS_URL ?? "redis://localhost:6379" });
client.on("error", (err) => console.error("Redis error:", err));

let connectPromise: Promise<void> | null = null;

async function ensureConnected(): Promise<void> {
  if (!client.isOpen) {
    connectPromise ??= client.connect().then(() => undefined);
    await connectPromise;
  }
}

export async function getCached<T>(key: string): Promise<T | null> {
  await ensureConnected();
  const raw = await client.get(key);
  return raw ? (JSON.parse(raw) as T) : null;
}

export async function setCached(key: string, value: unknown, ttlSeconds = 3600): Promise<void> {
  await ensureConnected();
  await client.set(key, JSON.stringify(value), { EX: ttlSeconds });
}
