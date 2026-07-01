import React, { createContext, useContext, useState, useEffect } from 'react';

type UserRole = 'student' | 'teacher' | null;

interface User {
  name: string;
  role: UserRole;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  // Simplified login function that just takes role and user data
  login: (role: UserRole, userData: User) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check localStorage on load
    const storedAuth = localStorage.getItem('isLoggedIn');
    const storedRole = localStorage.getItem('userRole') as UserRole;
    const storedName = localStorage.getItem('userName');

    if (storedAuth === 'true' && storedRole) {
      setIsAuthenticated(true);
      setUser({ name: storedName || 'User', role: storedRole });
    }
    setIsLoading(false);
  }, []);

  const login = async (role: UserRole, userData: User) => {
    setIsAuthenticated(true);
    setUser(userData);
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userRole', role || '');
    localStorage.setItem('userName', userData.name);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.clear();
    window.location.href = '/auth';
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {!isLoading && children}
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