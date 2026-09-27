import fs from "fs";
import path from "path";
import { env, ensureDataDirs } from "@/lib/config/env";
import { logger } from "@/lib/core/logger";
import { BaseRecord, Collection, Database, QueryOptions } from "./types";

const log = logger.child("db:file");

interface StoreShape {
  version: number;
  collections: Record<string, BaseRecord[]>;
}

const STORE_VERSION = 1;

class FileCollection<T extends BaseRecord> implements Collection<T> {
  private items: Map<string, T> = new Map();
  private dirty = false;

  constructor(
    private readonly name: string,
    private readonly db: FileDatabase
  ) {}

  hydrate(records: T[]): void {
    this.items.clear();
    for (const r of records) this.items.set(r.id, r);
  }

  serialize(): T[] {
    return Array.from(this.items.values());
  }

  private markDirty(): void {
    this.dirty = true;
    this.db.scheduleFlush();
  }

  insert(record: T): T {
    this.items.set(record.id, record);
    this.markDirty();
    return record;
  }

  get(id: string): T | undefined {
    return this.items.get(id);
  }

  update(id: string, patch: Partial<T>): T | undefined {
    const existing = this.items.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...patch, id, updatedAt: Date.now() } as T;
    this.items.set(id, updated);
    this.markDirty();
    return updated;
  }

  upsert(record: T): T {
    const existing = this.items.get(record.id);
    if (existing) return this.update(record.id, record) as T;
    return this.insert(record);
  }

  delete(id: string): boolean {
    const removed = this.items.delete(id);
    if (removed) this.markDirty();
    return removed;
  }

  all(): T[] {
    return Array.from(this.items.values());
  }

  query(options?: QueryOptions<T>): T[] {
    let result = this.all();
    if (options?.filter) result = result.filter(options.filter);
    if (options?.sortBy) {
      const key = options.sortBy;
      const dir = options.sortDir === "desc" ? -1 : 1;
      result = [...result].sort((a, b) => {
        const av = a[key];
        const bv = b[key];
        if (av === bv) return 0;
        return (av > bv ? 1 : -1) * dir;
      });
    }
    const offset = options?.offset ?? 0;
    if (offset) result = result.slice(offset);
    if (options?.limit != null) result = result.slice(0, options.limit);
    return result;
  }

  count(predicate?: (item: T) => boolean): number {
    if (!predicate) return this.items.size;
    return this.all().filter(predicate).length;
  }

  clear(): void {
    this.items.clear();
    this.markDirty();
  }
}

class FileDatabase implements Database {
  public readonly driverName = "file";
  private collections: Map<string, FileCollection<BaseRecord>> = new Map();
  private storePath: string;
  private flushTimer: NodeJS.Timeout | null = null;
  private loaded = false;

  constructor() {
    ensureDataDirs();
    const dir = path.join(env.dataDir, "db");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    this.storePath = path.join(dir, "mhp-store.json");
    this.load();
  }

  private load(): void {
    if (this.loaded) return;
    this.loaded = true;
    if (!fs.existsSync(this.storePath)) return;
    try {
      const raw = fs.readFileSync(this.storePath, "utf-8");
      const parsed = JSON.parse(raw) as StoreShape;
      if (!parsed || typeof parsed !== "object" || !parsed.collections) return;
      for (const [name, records] of Object.entries(parsed.collections)) {
        const collection = this.getOrCreate(name);
        collection.hydrate(records as BaseRecord[]);
      }
      log.info("Database loaded", { path: this.storePath });
    } catch (err) {
      log.error("Failed to load database, starting empty", {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  private getOrCreate(name: string): FileCollection<BaseRecord> {
    let collection = this.collections.get(name);
    if (!collection) {
      collection = new FileCollection<BaseRecord>(name, this);
      this.collections.set(name, collection);
    }
    return collection;
  }

  public collection<T extends BaseRecord>(name: string): Collection<T> {
    this.load();
    return this.getOrCreate(name) as unknown as Collection<T>;
  }

  public scheduleFlush(): void {
    if (this.flushTimer) return;
    this.flushTimer = setTimeout(() => {
      this.flushTimer = null;
      this.flush();
    }, 250);
    if (typeof this.flushTimer.unref === "function") this.flushTimer.unref();
  }

  public flush(): void {
    try {
      const shape: StoreShape = { version: STORE_VERSION, collections: {} };
      for (const [name, collection] of this.collections.entries()) {
        shape.collections[name] = collection.serialize();
      }
      const tmp = `${this.storePath}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(shape, null, 2), "utf-8");
      fs.renameSync(tmp, this.storePath);
    } catch (err) {
      log.error("Failed to persist database", {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
}

export function createFileDatabase(): Database {
  return new FileDatabase();
}