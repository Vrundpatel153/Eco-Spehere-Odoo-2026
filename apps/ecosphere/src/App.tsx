import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter, useLocation } from 'wouter';

import Dashboard from '@/pages/Dashboard';
import Environmental from '@/pages/Environmental';
import Social from '@/pages/Social';
import Governance from '@/pages/Governance';
import Gamification from '@/pages/Gamification';
import Reports from '@/pages/Reports';
import Settings from '@/pages/Settings';
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import ForgotPassword from '@/pages/auth/ForgotPassword';
import Profile from '@/pages/Profile';
import Notifications from '@/pages/Notifications';
import LayoutOverview from '@/pages/LayoutOverview';
import UserManagement from '@/pages/admin/UserManagement';

import { AuthProvider, useAuthContext } from '@/store/AuthContext';

const queryClient = new QueryClient();
const PUBLIC_PATHS = ['/login', '/register', '/forgot-password'];

function AppRoutes() {
  const { isAuthenticated, user } = useAuthContext();
  const [location] = useLocation();

  if (PUBLIC_PATHS.includes(location)) {
    return (
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/forgot-password" component={ForgotPassword} />
      </Switch>
    );
  }

  if (!isAuthenticated) return <Login />;

  // Each page handles its own <Layout> wrapper
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/environmental" component={Environmental} />
      <Route path="/social" component={Social} />
      <Route path="/governance" component={Governance} />
      <Route path="/gamification" component={Gamification} />
      <Route path="/reports" component={Reports} />
      <Route path="/settings" component={Settings} />
      <Route path="/profile" component={Profile} />
      <Route path="/notifications" component={Notifications} />
      <Route path="/layout-overview" component={LayoutOverview} />
      <Route path="/admin/users">
        {user?.role === 'admin' ? <UserManagement /> : <Dashboard />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <AppRoutes />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
