/**
 * Local IndexedDB persistence via Dexie.
 *
 * Tables:
 *   profiles — the user's saved subjects (bazi birth data)
 *   charts   — computed chart payloads keyed by (profileId + kind)
 *              kind ∈ { bazi | ziwei | astro | sixyao | qimen | predict }
 *   settings — single-row app state (activeProfileId, activeTab)
 */
import Dexie, { type Table } from "dexie";

export interface Profile {
  id: string;
  name: string;
  gender: "M" | "F" | "X";
  birthDate: string;
  birthTime: string;
  zone: string;
  lat: string;
  lon: string;
  location: string;
  /** Free-form subdistrict / neighborhood under location (e.g. 徐汇) */
  subLocation?: string;
  /** Relation tag displayed next to name (朋友 / 历史人物 / 家人 etc.) */
  relation?: string;
  /** Whether birth time is given in true solar time */
  trueSolarTime?: boolean;
  createdAt: number;
  updatedAt: number;
}

export type ChartKind = "bazi" | "ziwei" | "astro" | "sixyao" | "qimen";

export interface ChartRecord {
  id?: number;          // auto-increment
  profileId: string;
  kind: ChartKind;
  payload: unknown;     // full JSON from horosa
  computedAt: number;
}

export interface Setting {
  key: string;
  value: string;
}

class HorosaDB extends Dexie {
  profiles!: Table<Profile, string>;
  charts!: Table<ChartRecord, number>;
  settings!: Table<Setting, string>;

  constructor() {
    super("horosa-chat");
    this.version(1).stores({
      profiles: "id, name, createdAt, updatedAt",
      charts: "++id, &[profileId+kind], profileId, kind",
      settings: "key",
    });
  }
}

export const db = new HorosaDB();

// ─── Profile CRUD ───

export async function listProfiles(): Promise<Profile[]> {
  return db.profiles.orderBy("updatedAt").reverse().toArray();
}

export async function saveProfile(p: Omit<Profile, "createdAt" | "updatedAt"> & Partial<Pick<Profile, "createdAt" | "updatedAt">>): Promise<void> {
  const now = Date.now();
  await db.profiles.put({
    ...p,
    createdAt: p.createdAt ?? now,
    updatedAt: now,
  } as Profile);
}

export async function deleteProfile(id: string): Promise<void> {
  await db.transaction("rw", db.profiles, db.charts, async () => {
    await db.profiles.delete(id);
    await db.charts.where("profileId").equals(id).delete();
  });
}

// ─── Chart cache ───

export async function getChart(profileId: string, kind: ChartKind): Promise<ChartRecord | undefined> {
  return db.charts.where({ profileId, kind }).first();
}

export async function saveChart(profileId: string, kind: ChartKind, payload: unknown): Promise<void> {
  const existing = await db.charts.where({ profileId, kind }).first();
  if (existing?.id) {
    await db.charts.update(existing.id, { payload, computedAt: Date.now() });
  } else {
    await db.charts.add({ profileId, kind, payload, computedAt: Date.now() });
  }
}

export async function deleteCharts(profileId: string): Promise<void> {
  await db.charts.where("profileId").equals(profileId).delete();
}

// ─── Settings ───

export async function getSetting(key: string): Promise<string | undefined> {
  const row = await db.settings.get(key);
  return row?.value;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await db.settings.put({ key, value });
}
