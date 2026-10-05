// Type declaration for the pre-initialized Base44 SDK client.
// The runtime file is JavaScript; this provides type safety for TS/TSX consumers.
declare module "@/api/base44Client" {
  export interface Base44Entity {
    filter(query?: Record<string, unknown>, options?: Record<string, unknown>): Promise<{ items: unknown[]; next_cursor?: string; has_more?: boolean }>;
    list(options?: Record<string, unknown>): Promise<{ items: unknown[]; next_cursor?: string; has_more?: boolean }>;
    count(query?: Record<string, unknown>): Promise<number>;
    aggregate(options: Record<string, unknown>): Promise<{ rows: unknown[]; truncated?: boolean }>;
    create(data: Record<string, unknown>): Promise<Record<string, unknown>>;
    bulkCreate(data: Record<string, unknown>[]): Promise<Record<string, unknown>[]>;
    update(id: string, data: Record<string, unknown>): Promise<Record<string, unknown>>;
    updateMany(query: Record<string, unknown>, update: Record<string, unknown>): Promise<unknown>;
    bulkUpdate(records: Record<string, unknown>[]): Promise<Record<string, unknown>[]>;
    delete(id: string): Promise<unknown>;
    deleteMany(query: Record<string, unknown>): Promise<unknown>;
    upsert(records: Record<string, unknown>[], options: Record<string, unknown>): Promise<Record<string, unknown>>;
    get(id: string): Promise<Record<string, unknown>>;
    subscribe(handler: (event: Record<string, unknown>) => void): () => void;
  }

  export interface Base44Client {
    entities: Record<string, Base44Entity>;
    auth: {
      me(): Promise<Record<string, unknown>>;
      isAuthenticated(): Promise<boolean>;
      logout(redirectUrl?: string): Promise<void>;
      redirectToLogin(nextUrl?: string): void;
      updateMe(data: Record<string, unknown>): Promise<Record<string, unknown>>;
    };
    integrations: Record<string, Record<string, (...args: unknown[]) => Promise<unknown>>>;
    functions: { invoke(name: string, payload?: Record<string, unknown>): Promise<unknown> };
    analytics: { track(event: { eventName: string; properties?: Record<string, unknown> }): void };
    users: { inviteUser(email: string, role: string): Promise<unknown> };
    asServiceRole: {
      connectors: { getConnection(type: string): Promise<{ accessToken: string; connectionConfig?: Record<string, unknown> }> };
      aiGateway: { connection(): Promise<{ baseURL: string; token: string; headers: Record<string, string> }> };
      integrations: Record<string, Record<string, (...args: unknown[]) => Promise<unknown>>>;
    };
  }

  export const base44: Base44Client;
}