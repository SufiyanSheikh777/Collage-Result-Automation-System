import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole, CollegeInfo, User } from '@/types/auth';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  activeCollege: CollegeInfo;
  setActiveCollege: (college: CollegeInfo) => void;
  login: (role: UserRole, userData: User) => Promise<void>;
  logout: () => void;
}

const DEFAULT_COLLEGE: CollegeInfo = {
  id: 1,
  name: "Somaiya Polytechnic",
  shortName: "Somaiya Polytechnic",
  msbteCode: "0540",
  region: "Mumbai",
  instituteType: "Unaided / Private"
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [activeCollege, setActiveCollegeState] = useState<CollegeInfo>(DEFAULT_COLLEGE);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check localStorage on load
    const storedAuth = localStorage.getItem('isLoggedIn');
    const storedRole = localStorage.getItem('userRole') as UserRole;
    const storedName = localStorage.getItem('userName');
    const storedUserJson = localStorage.getItem('userData');
    const storedCollegeJson = localStorage.getItem('activeCollege');

    if (storedCollegeJson) {
      try {
        setActiveCollegeState(JSON.parse(storedCollegeJson));
      } catch (e) {
        console.warn('Failed parsing stored college', e);
      }
    }

    if (storedAuth === 'true' && storedRole) {
      let parsedUser: Partial<User> = {};
      if (storedUserJson) {
        try {
          parsedUser = JSON.parse(storedUserJson);
        } catch (e) {}
      }

      setIsAuthenticated(true);
      setUser({
        name: storedName || 'User',
        role: storedRole,
        ...parsedUser
      });

      if (parsedUser.college) {
        setActiveCollegeState(parsedUser.college);
      }
    }
    setIsLoading(false);
  }, []);

  const setActiveCollege = (college: CollegeInfo) => {
    setActiveCollegeState(college);
    localStorage.setItem('activeCollege', JSON.stringify(college));
  };

  const login = async (role: UserRole, userData: User) => {
    setIsAuthenticated(true);
    setUser(userData);
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userRole', role || '');
    localStorage.setItem('userName', userData.name);
    localStorage.setItem('userData', JSON.stringify(userData));

    if (userData.college) {
      setActiveCollege(userData.college);
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userData');
    window.location.href = '/auth';
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, activeCollege, setActiveCollege, login, logout }}>
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