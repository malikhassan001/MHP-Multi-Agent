export interface BaseRecord {
  id: string;
  createdAt: number;
  updatedAt: number;
}

export type Filter<T> = Partial<Record<keyof T, unknown>>;

export interface QueryOptions<T> {
  filter?: (item: T) => boolean;
  sortBy?: keyof T;
  sortDir?: "asc" | "desc";
  limit?: number;
  offset?: number;
}

export interface Collection<T extends BaseRecord> {
  insert: (record: T) => T;
  get: (id: string) => T | undefined;
  update: (id: string, patch: Partial<T>) => T | undefined;
  upsert: (record: T) => T;
  delete: (id: string) => boolean;
  all: () => T[];
  query: (options?: QueryOptions<T>) => T[];
  count: (predicate?: (item: T) => boolean) => number;
  clear: () => void;
}

export interface Database {
  collection: <T extends BaseRecord>(name: string) => Collection<T>;
  flush: () => void;
  driverName: string;
}