import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Notification, Role, User } from '../types';
import { api, getSessionRole, getSessionUser, setSessionRole } from '../lib/api';

interface AppCtx {
  user: User;
  role: Role;
  setRole: (r: Role) => void;
  notifications: Notification[];
  unread: number;
  refreshNotifications: () => void;
  markAllRead: () => void;
}

const Ctx = createContext<AppCtx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>(() => getSessionRole());
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const user = useMemo(() => getSessionUser(), [role]);

  const refreshNotifications = useCallback(async () => {
    try {
      const list = await api.notifications(user.id);
      setNotifications(list);
    } catch {
      /* offline tolerant */
    }
  }, [user.id]);

  useEffect(() => {
    void refreshNotifications();
  }, [refreshNotifications]);

  const setRole = (r: Role) => {
    setSessionRole(r);
    setRoleState(r);
  };

  const unread = notifications.filter((n) => !n.read).length;

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await Promise.all(notifications.filter((n) => !n.read).map((n) => api.markRead(n.id).catch(() => null)));
    void refreshNotifications();
  };

  return (
    <Ctx.Provider value={{ user, role, setRole, notifications, unread, refreshNotifications, markAllRead }}>
      {children}
    </Ctx.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}