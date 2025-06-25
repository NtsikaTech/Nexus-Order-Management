
import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { getAuthToken, getCurrentUser, logout as authLogout } from '../services/authService';
import { AdminUser } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';

interface AuthContextType {
  isAuthenticated: boolean;
  user: AdminUser | null; // User object now includes role
  isLoading: boolean;
  login: (loggedInUser: AdminUser) => void; // Accepts full user object
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const checkAuthStatus = useCallback(async () => {
    setIsLoading(true);
    const token = getAuthToken(); // Token presence implies potential authentication
    if (token) {
      try {
        const currentUser = await getCurrentUser(); // Fetches user details including role
        if (currentUser) {
          setUser(currentUser);
          setIsAuthenticated(true);
        } else {
          authLogout(); 
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        console.error("Failed to fetch current user:", error);
        authLogout();
        setIsAuthenticated(false);
        setUser(null);
      }
    } else {
      setIsAuthenticated(false);
      setUser(null);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  // Login function now expects the full user object
  const login = (loggedInUser: AdminUser) => {
    // Token is handled by authService.login which stores userId
    // authService.getCurrentUser then fetches the user based on stored ID
    setUser(loggedInUser);
    setIsAuthenticated(true);
  };

  const logout = () => {
    authLogout();
    setUser(null);
    setIsAuthenticated(false);
  };
  
  if (isLoading) {
    return <div className="h-screen flex items-center justify-center"><LoadingSpinner message="Authenticating..." /></div>;
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
