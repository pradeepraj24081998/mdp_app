import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  roles: string[];
  permissions: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (perm: string) => boolean;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const res = await apiClient.get('/auth/me/');
      if (res.data.success) {
        setUser(res.data.data.user);
        setRoles(res.data.data.roles || []);
        setPermissions(res.data.data.permissions || []);
      }
    } catch {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
      setRoles([]);
      setPermissions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      fetchProfile();
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await apiClient.post('/auth/login/', { email, password });
    if (res.data.success) {
      const { access, refresh, user: u, roles: r, permissions: p } = res.data.data;
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      setUser(u);
      setRoles(r || []);
      setPermissions(p || []);
    } else {
      throw new Error(res.data.message || 'Login failed');
    }
  };

  const logout = async () => {
    const refresh = localStorage.getItem('refresh_token');
    try {
      if (refresh) {
        await apiClient.post('/auth/logout/', { refresh });
      }
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
      setRoles([]);
      setPermissions([]);
      window.location.href = '/login';
    }
  };

  const hasPermission = (perm: string) => {
    if (roles.includes('SUPER_ADMIN') || roles.includes('ADMIN')) return true;
    return permissions.includes(perm);
  };

  const hasRole = (role: string) => {
    if (roles.includes('SUPER_ADMIN')) return true;
    return roles.includes(role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        roles,
        permissions,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        hasPermission,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
