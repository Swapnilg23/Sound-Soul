import React, { createContext, useContext, useEffect, useState } from 'react';
import { useGetMe, setAuthTokenGetter, UserWithProfile } from '@workspace/api-client-react';

interface AuthContextType {
  user: UserWithProfile | null;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('sound2soul_token'));
  
  useEffect(() => {
    setAuthTokenGetter(() => localStorage.getItem('sound2soul_token'));
  }, []);

  const { data: user, isLoading: isUserLoading, refetch } = useGetMe({
    query: {
      enabled: !!token,
      retry: false,
    }
  });

  const login = (newToken: string) => {
    localStorage.setItem('sound2soul_token', newToken);
    setToken(newToken);
    refetch();
  };

  const logout = () => {
    localStorage.removeItem('sound2soul_token');
    setToken(null);
  };

  const isLoading = isUserLoading && !!token;

  return (
    <AuthContext.Provider value={{ user: user || null, isLoading, login, logout }}>
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
