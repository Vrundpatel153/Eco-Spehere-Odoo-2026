import { createContext, useContext, ReactNode } from 'react';
import { useAuth, User, Session } from './useAuth';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: ReturnType<typeof useAuth>['login'];
  register: ReturnType<typeof useAuth>['register'];
  logout: ReturnType<typeof useAuth>['logout'];
  updateProfile: ReturnType<typeof useAuth>['updateProfile'];
  changePassword: ReturnType<typeof useAuth>['changePassword'];
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();

  return (
    <AuthContext.Provider 
      value={{
        user: auth.user,
        session: auth.session,
        isAuthenticated: !!auth.session,
        isLoading: auth.isLoading,
        login: auth.login,
        register: auth.register,
        logout: auth.logout,
        updateProfile: auth.updateProfile,
        changePassword: auth.changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
