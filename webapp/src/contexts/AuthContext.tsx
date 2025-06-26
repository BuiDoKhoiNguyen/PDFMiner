import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import { authApi } from '../utils/api';

interface User {
  username: string;
  email: string;
  fullName: string;
  role: string;
  permissions: string[];
}

interface JwtPayload {
  sub: string;
  exp: number;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (userData: {
    username: string;
    password: string;
    email: string;
    fullName: string;
  }) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if token exists and is valid
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // Check if token is expired
        const decoded = jwtDecode<JwtPayload>(token);
        const currentTime = Date.now() / 1000;
        
        if (decoded.exp < currentTime) {
          // Token expired
          localStorage.removeItem('token');
          setUser(null);
          setIsLoading(false);
        } else {
          // Token valid, fetch user data
          fetchUserData();
        }
      } catch (error) {
        // Invalid token
        localStorage.removeItem('token');
        setUser(null);
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await authApi.getCurrentUser();
      setUser(response.data);
    } catch (error) {
      setError('Failed to fetch user data');
      localStorage.removeItem('token');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authApi.login(username, password);
      localStorage.setItem('token', response.data.token);
      await fetchUserData();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Login failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: {
    username: string;
    password: string;
    email: string;
    fullName: string;
  }) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authApi.register(userData);
      localStorage.setItem('token', response.data.token);
      await fetchUserData();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Registration failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  // Check if user has specific permission
  const hasPermission = (permission: string) => {
    return user?.permissions?.includes(permission) || false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
