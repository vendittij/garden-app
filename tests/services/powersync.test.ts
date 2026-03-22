import { SupabaseConnector } from '../../src/services/powersync';
import { supabase } from '../../src/services/supabase';

// @powersync/react-native has native bindings — mock the whole module.
// All types (interfaces) used by SupabaseConnector are erased at runtime.
jest.mock('@powersync/react-native', () => ({}));

jest.mock('../../src/services/supabase', () => ({
  supabase: {
    auth: { getSession: jest.fn() },
    from: jest.fn(),
  },
}));

const mockGetSession = supabase.auth.getSession as jest.Mock;
const mockFrom = supabase.from as jest.Mock;

describe('SupabaseConnector', () => {
  let connector: SupabaseConnector;

  beforeEach(() => {
    connector = new SupabaseConnector();
    jest.clearAllMocks();
    process.env.EXPO_PUBLIC_POWERSYNC_URL = 'https://ps.example.com';
  });

  describe('fetchCredentials', () => {
    it('returns credentials when a session exists', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: { access_token: 'test-token', expires_at: 1_000_000 } },
        error: null,
      });

      const result = await connector.fetchCredentials();

      expect(result).toEqual({
        endpoint: 'https://ps.example.com',
        token: 'test-token',
        expiresAt: new Date(1_000_000 * 1000),
      });
    });

    it('returns null when there is no active session', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null }, error: null });

      const result = await connector.fetchCredentials();

      expect(result).toBeNull();
    });

    it('omits expiresAt when session has no expires_at', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: { access_token: 'test-token', expires_at: undefined } },
        error: null,
      });

      const result = await connector.fetchCredentials();

      expect(result?.expiresAt).toBeUndefined();
    });

    it('throws when getSession returns an error', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'network error' },
      });

      await expect(connector.fetchCredentials()).rejects.toThrow(
        '[PowerSync] Failed to fetch Supabase session: network error',
      );
    });
  });

  describe('uploadData', () => {
    const mockComplete = jest.fn().mockResolvedValue(undefined);

    const makeDb = (crud: object[]) => ({
      getCrudBatch: jest.fn().mockResolvedValue({ crud, complete: mockComplete }),
    });

    const makeNullDb = () => ({
      getCrudBatch: jest.fn().mockResolvedValue(null),
    });

    function setupFromChain() {
      const eq = jest.fn().mockResolvedValue({});
      const upsert = jest.fn().mockResolvedValue({});
      const update = jest.fn().mockReturnValue({ eq });
      const del = jest.fn().mockReturnValue({ eq });
      mockFrom.mockReturnValue({ upsert, update, delete: del });
      return { upsert, update, del, eq };
    }

    it('returns early without touching supabase when batch is null', async () => {
      await connector.uploadData(makeNullDb() as never);
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('calls upsert for a PUT operation', async () => {
      const { upsert } = setupFromChain();
      const db = makeDb([{ table: 'gardens', op: 'PUT', id: '1', opData: { name: 'Veg bed' } }]);

      await connector.uploadData(db as never);

      expect(mockFrom).toHaveBeenCalledWith('gardens');
      expect(upsert).toHaveBeenCalledWith({ id: '1', name: 'Veg bed' });
      expect(mockComplete).toHaveBeenCalled();
    });

    it('calls update+eq for a PATCH operation', async () => {
      const { update, eq } = setupFromChain();
      const db = makeDb([{ table: 'gardens', op: 'PATCH', id: '1', opData: { name: 'Updated' } }]);

      await connector.uploadData(db as never);

      expect(update).toHaveBeenCalledWith({ name: 'Updated' });
      expect(eq).toHaveBeenCalledWith('id', '1');
      expect(mockComplete).toHaveBeenCalled();
    });

    it('calls delete+eq for a DELETE operation', async () => {
      const { del, eq } = setupFromChain();
      const db = makeDb([{ table: 'gardens', op: 'DELETE', id: '1', opData: null }]);

      await connector.uploadData(db as never);

      expect(del).toHaveBeenCalled();
      expect(eq).toHaveBeenCalledWith('id', '1');
      expect(mockComplete).toHaveBeenCalled();
    });

    it('always calls batch.complete after processing all entries', async () => {
      setupFromChain();
      const db = makeDb([
        { table: 'gardens', op: 'PUT', id: '1', opData: { name: 'A' } },
        { table: 'gardens', op: 'DELETE', id: '2', opData: null },
      ]);

      await connector.uploadData(db as never);

      expect(mockComplete).toHaveBeenCalledTimes(1);
    });
  });
});
