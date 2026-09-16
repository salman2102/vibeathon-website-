import { useCallback, useEffect, useRef, useState } from 'react';
import type { Analytics, ApplicationRecord } from '../types';
import { api } from './api';

export function useApplication(ref: string) {
  const [app, setApp] = useState<ApplicationRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const latest = useRef('');

  const refresh = useCallback(async () => {
    if (!ref) return;
    setLoading(true);
    const current = ref;
    latest.current = current;
    try {
      const data = await api.get<ApplicationRecord>(`/api/applications/${current}`);
      setApp(data);
      setError(null);
      localStorage.setItem('cleargov.flagship-sample', JSON.stringify(data));
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load';
      if (latest.current === current) setError(msg);
    } finally {
      if (latest.current === current) setLoading(false);
    }
  }, [ref]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { app, loading, error, refresh };
}

export function useApplications() {
  const [apps, setApps] = useState<ApplicationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (q?: { search?: string; status?: string; scenario?: string }) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q?.search) params.set('search', q.search);
      if (q?.status) params.set('status', q.status);
      if (q?.scenario) params.set('scenario', q.scenario);
      const list = await api.get<ApplicationRecord[]>(`/api/applications${params.toString() ? `?${params}` : ''}`);
      setApps(list);
    } catch {
      /* tolerate */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { apps, loading, refresh };
}

export function useAnalytics() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setAnalytics(await api.analytics());
    } catch {
      /* tolerate */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { analytics, loading, refresh };
}

export function useAudit(applicationId?: string) {
  const [events, setEvents] = useState<Array<import('../types').AuditEvent>>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setEvents(await api.audit(applicationId));
    } catch {
      /* tolerate */
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { events, loading, refresh };
}

export function useReviewerQueue() {
  const [queue, setQueue] = useState<Array<import('../types').ReviewerQueueItem>>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (q?: { q?: string; filter?: string }) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q?.q) params.set('q', q.q);
      if (q?.filter) params.set('filter', q.filter);
      const list = await api.get<Array<import('../types').ReviewerQueueItem>>(`/api/reviewer/queue${params.toString() ? `?${params}` : ''}`);
      setQueue(list);
    } catch {
      /* tolerate */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { queue, loading, refresh };
}