import { useState, useEffect, useCallback } from 'react';
import { ApiError } from './api';

// Generic data-fetching hook
export function useFetch<T>(fetcher: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      setData(result);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Unexpected error');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, refetch: load };
}

// Tenant ID from localStorage — synced across all useTenant consumers via custom event
export function useTenant() {
  const isUuid = (val: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

  const [tenantId, setTenantIdState] = useState(() => {
    let id = localStorage.getItem('tenantId') ?? '';
    if (!id || !isUuid(id)) {
      try {
        id = window.crypto.randomUUID();
      } catch {
        id = '11111111-1111-4111-8111-111111111111';
      }
      localStorage.setItem('tenantId', id);
    }
    return id;
  });

  useEffect(() => {
    const sync = () => {
      const stored = localStorage.getItem('tenantId') ?? '';
      if (stored && isUuid(stored)) {
        setTenantIdState(stored);
      }
    };
    // 'tenantchange' fires on same tab; 'storage' fires from other tabs
    window.addEventListener('tenantchange', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('tenantchange', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const setTenantId = (id: string) => {
    localStorage.setItem('tenantId', id);
    setTenantIdState(id);
    // Notify every other useTenant instance in this tab
    window.dispatchEvent(new Event('tenantchange'));
  };

  return { tenantId, setTenantId };
}

// Async action with loading/error state
export function useAction<T>(action: (...args: T[]) => Promise<unknown>) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (...args: T[]) => {
    setLoading(true);
    setError(null);
    try {
      const result = await action(...args);
      return { ok: true, data: result };
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Unexpected error';
      setError(msg);
      return { ok: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  return { run, loading, error };
}
