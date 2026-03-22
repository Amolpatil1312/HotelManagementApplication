import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getApiBase } from '../config';
import { AuthUser } from '../types/types';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isAdmin: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, displayName: string, role: string, token?: string, restaurantName?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem('authToken');
      const storedUser = localStorage.getItem('authUser');

      if (!token || !storedUser) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${getApiBase()}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          setUser(JSON.parse(storedUser));
        } else if (response.status === 401) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('authUser');
        }
      } catch {
        // Network error — keep stored user to allow offline-ish usage
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, []);

  const login = async (username: string, password: string) => {
    const response = await fetch(`${getApiBase()}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const text = await response.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error('Server returned invalid response. Check your server connection.');
    }

    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    const authUser: AuthUser = {
      token: data.token,
      username: data.username,
      role: data.role,
      displayName: data.displayName,
      restaurantId: data.restaurantId,
    };

    localStorage.setItem('authToken', authUser.token);
    localStorage.setItem('authUser', JSON.stringify(authUser));
    setUser(authUser);
  };

  const register = async (
    username: string,
    password: string,
    displayName: string,
    role: string,
    token?: string,
    restaurantName?: string
  ) => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };

    // Only send auth header when admin is adding staff (not for new restaurant registration)
    if (!restaurantName) {
      const authToken = token || localStorage.getItem('authToken');
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
    }

    const body: any = { username, password, displayName, role };
    if (restaurantName) {
      body.restaurantName = restaurantName;
    }

    const response = await fetch(`${getApiBase()}/api/auth/register`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const text = await response.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error('Server returned invalid response. Check your server connection.');
    }

    if (!response.ok) {
      throw new Error(data.error || 'Registration failed');
    }

    // Auto-login if token is returned (new restaurant admin registration)
    if (data.token) {
      const authUser: AuthUser = {
        token: data.token,
        username: data.username,
        role: data.role,
        displayName: data.displayName,
        restaurantId: data.restaurantId,
      };
      localStorage.setItem('authToken', authUser.token);
      localStorage.setItem('authUser', JSON.stringify(authUser));
      setUser(authUser);
    }

    return data;
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    setUser(null);
  };

  const isAdmin = user?.role === 'ADMIN';
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, isAuthenticated, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
