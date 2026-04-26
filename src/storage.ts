import { promises as fs } from "node:fs";
import path from "node:path";

const DATA_DIR = path.resolve(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "store.json");

export type Tier = "free" | "prem";

export interface DataStore {
  stock: {
    free: string[];
    prem: string[];
  };
  subscriptions: Record<string, Record<string, number>>;
  cooldowns: {
    free: Record<string, number>;
    prem: Record<string, number>;
  };
  generated: {
    free: number;
    prem: number;
  };
  settings: {
    freeCooldownMinutes: number;
    premCooldownMinutes: number;
    premiumRoleIds: string[];
    freeRoleIds: string[];
  };
}

const DEFAULT_FREE_COOLDOWN_MINUTES = 12 * 60;
const DEFAULT_PREM_COOLDOWN_MINUTES = 0;

const DEFAULT_DATA: DataStore = {
  stock: { free: [], prem: [] },
  subscriptions: {},
  cooldowns: { free: {}, prem: {} },
  generated: { free: 0, prem: 0 },
  settings: {
    freeCooldownMinutes: DEFAULT_FREE_COOLDOWN_MINUTES,
    premCooldownMinutes: DEFAULT_PREM_COOLDOWN_MINUTES,
    premiumRoleIds: [],
    freeRoleIds: [],
  },
};

let cache: DataStore | null = null;
let writePromise: Promise<void> = Promise.resolve();

async function ensureFile(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify(DEFAULT_DATA, null, 2));
  }
}

function flatten(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === "string");
  }
  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).flatMap((v) => flatten(v));
  }
  return [];
}

export async function loadData(): Promise<DataStore> {
  if (cache) return cache;
  await ensureFile();
  const raw = await fs.readFile(DATA_FILE, "utf8");
  try {
    const parsed = JSON.parse(raw) as Partial<DataStore> & {
      stock?: { free?: unknown; prem?: unknown };
      cooldowns?: unknown;
      subscriptions?: unknown;
      settings?: {
        freeCooldownMinutes?: number;
        premCooldownMinutes?: number;
        premiumRoleIds?: unknown;
        freeRoleIds?: unknown;
      };
    };

    let freeCooldowns: Record<string, number> = {};
    let premCooldowns: Record<string, number> = {};
    const cd = parsed.cooldowns;
    if (cd && typeof cd === "object") {
      const obj = cd as Record<string, unknown>;
      if (obj["free"] && typeof obj["free"] === "object") {
        freeCooldowns = obj["free"] as Record<string, number>;
        if (obj["prem"] && typeof obj["prem"] === "object") {
          premCooldowns = obj["prem"] as Record<string, number>;
        }
      } else {
        freeCooldowns = obj as Record<string, number>;
      }
    }

    let subscriptions: Record<string, Record<string, number>> = {};
    const subs = parsed.subscriptions;
    if (subs && typeof subs === "object") {
      const entries = Object.entries(subs as Record<string, unknown>);
      const isNested = entries.every(
        ([, v]) => v && typeof v === "object" && !Array.isArray(v),
      );
      if (isNested && entries.length > 0) {
        for (const [guildId, v] of entries) {
          subscriptions[guildId] = {};
          for (const [userId, exp] of Object.entries(v as Record<string, unknown>)) {
            if (typeof exp === "number") subscriptions[guildId]![userId] = exp;
          }
        }
      } else if (entries.length > 0) {
        const primaryGuildId =
          (process.env.DISCORD_GUILD_ID ?? "")
            .split(",")
            .map((id) => id.trim())
            .filter((id) => id.length > 0)[0] ?? "_legacy";
        const flatSubs: Record<string, number> = {};
        for (const [userId, exp] of entries) {
          if (typeof exp === "number") flatSubs[userId] = exp;
        }
        subscriptions[primaryGuildId] = flatSubs;
      }
    }

    cache = {
      stock: {
        free: flatten(parsed.stock?.free),
        prem: flatten(parsed.stock?.prem),
      },
      subscriptions,
      cooldowns: { free: freeCooldowns, prem: premCooldowns },
      generated: {
        free: parsed.generated?.free ?? 0,
        prem: parsed.generated?.prem ?? 0,
      },
      settings: {
        freeCooldownMinutes:
          parsed.settings?.freeCooldownMinutes ?? DEFAULT_FREE_COOLDOWN_MINUTES,
        premCooldownMinutes:
          parsed.settings?.premCooldownMinutes ?? DEFAULT_PREM_COOLDOWN_MINUTES,
        premiumRoleIds: Array.isArray(parsed.settings?.premiumRoleIds)
          ? (parsed.settings!.premiumRoleIds as unknown[])
              .filter((v) => typeof v === "string")
              .map((v) => v as string)
          : [],
        freeRoleIds: Array.isArray(parsed.settings?.freeRoleIds)
          ? (parsed.settings!.freeRoleIds as unknown[])
              .filter((v) => typeof v === "string")
              .map((v) => v as string)
          : [],
      },
    };
  } catch {
    cache = structuredClone(DEFAULT_DATA);
  }
  return cache;
}

export async function saveData(): Promise<void> {
  if (!cache) return;
  const snapshot = JSON.stringify(cache, null, 2);
  writePromise = writePromise.then(() => fs.writeFile(DATA_FILE, snapshot));
  await writePromise;
}
