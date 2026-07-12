import Login from '@/pages/auth/Login';
import { useAuthContext } from '@/store/AuthContext';

/**
 * Renders children when authenticated.
 * Renders Login inline (no redirect) when not authenticated,
 * so the correct page appears on the very first render cycle.
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthContext();

  if (!isAuthenticated) {
    return <Login />;
  }

  return <>{children}</>;
}
