import {
  AbstractPowerSyncDatabase,
  PowerSyncBackendConnector,
  PowerSyncCredentials,
} from '@powersync/react-native';
import { supabase } from './supabase';

/**
 * Connects PowerSync to our Supabase backend.
 *
 * fetchCredentials — exchanges the active Supabase session token for a
 *   PowerSync JWT. The PowerSync service validates this token against the
 *   Supabase JWKS endpoint configured in the PowerSync dashboard.
 *
 * uploadData — flushes locally-queued CRUD mutations to Supabase. Each
 *   transaction is sent as individual RPC / table upsert calls so the server
 *   remains the source of truth for conflict resolution.
 */
export class SupabaseConnector implements PowerSyncBackendConnector {
  async fetchCredentials(): Promise<PowerSyncCredentials | null> {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      throw new Error(`[PowerSync] Failed to fetch Supabase session: ${error.message}`);
    }

    if (!session) {
      return null;
    }

    return {
      endpoint: process.env.EXPO_PUBLIC_POWERSYNC_URL ?? '',
      token: session.access_token,
      expiresAt: session.expires_at ? new Date(session.expires_at * 1000) : undefined,
    };
  }

  async uploadData(database: AbstractPowerSyncDatabase): Promise<void> {
    const batch = await database.getCrudBatch();
    if (!batch) return;

    for (const entry of batch.crud) {
      const { table, op, opData, id } = entry;

      switch (op) {
        case 'PUT':
          await supabase.from(table).upsert({ id, ...opData });
          break;
        case 'PATCH':
          await supabase.from(table).update(opData ?? {}).eq('id', id);
          break;
        case 'DELETE':
          await supabase.from(table).delete().eq('id', id);
          break;
      }
    }

    await batch.complete();
  }
}

export const supabaseConnector = new SupabaseConnector();
