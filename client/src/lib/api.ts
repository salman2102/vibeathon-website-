import type { ApiEnvelope, Role } from '../types';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

/** Demo session — the active role is carried on every request for auth-lite demo mode. */
export function getSessionRole(): Role {
  const r = localStorage.getItem('cleargov.role');
  return (r as Role) || 'CITIZEN';
}

export function setSessionRole(role: Role) {
  localStorage.setItem('cleargov.role', role);
}

export function getSessionUser() {
  const role = getSessionRole();
  if (role === 'REVIEWER') return { id: 'u-reviewer', name: 'R. Priya', email: 'priya@demo.cleargov', role };
  if (role === 'ADMIN') return { id: 'u-admin', name: 'K. Malathi', email: 'admin@demo.cleargov', role, department: 'Operations Command Center' };
  return { id: 'u-citizen', name: 'Salman', email: 'salman@demo.cleargov', role };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (!(init?.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  headers.set('x-role', getSessionRole());
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    /* no body */
  }
  if (!res.ok) {
    const msg =
      json && typeof json === 'object' && 'error' in json
        ? ((json as { error: { message: string } }).error.message ?? res.statusText)
        : res.statusText;
    throw new Error(msg);
  }
  return (json as ApiEnvelope<T>).data;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body ?? {}) }),
  upload: <T>(path: string, form: FormData) => request<T>(path, { method: 'POST', body: form }),
  health: () => request<import('../types').Health>('/api/health'),
  scenarios: () => request<import('../types').Scenario[]>('/api/meta/scenarios'),
  analytics: () => request<import('../types').Analytics>('/api/analytics'),
  audit: (applicationId?: string) => request<import('../types').AuditEvent[]>(`/api/audit${applicationId ? `/${applicationId}` : ''}`),
  notifications: (userId: string) => request<import('../types').Notification[]>(`/api/notifications?userId=${encodeURIComponent(userId)}`),
  markRead: (id: string) => request<import('../types').Notification>(`/api/notifications/${id}/read`, { method: 'POST' }),
  reset: () => request<{ message: string }>('/api/demo/reset', { method: 'POST' }),
};