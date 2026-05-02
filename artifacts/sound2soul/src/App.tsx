import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { RootLayout } from "@/components/layout/RootLayout";
import NotFound from "@/pages/not-found";
import { Redirect } from "wouter";

// Pages
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import Pricing from "@/pages/pricing";
import Explore from "@/pages/explore";
import CreatorOnboarding from "@/pages/creator/onboarding";
import CreatorDashboard from "@/pages/creator/dashboard";
import CreatorUpload from "@/pages/creator/upload";
import CreatorProfile from "@/pages/creator/profile";
import TrackDetail from "@/pages/track";
import Library from "@/pages/library";
import Leaderboard from "@/pages/leaderboard";
import AdminDashboard from "@/pages/admin";
import SoulRadio from "@/pages/radio";
import CollectionPage from "@/pages/collection";
import SoulWrapped from "@/pages/creator/wrapped";

const queryClient = new QueryClient();

const ProtectedRoute = ({ component: Component, role, ...rest }: any) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div></div>;
  if (!user) return <Redirect to="/login" />;
  if (role && user.role !== role && user.role !== 'admin') return <Redirect to="/explore" />;
  return <Component {...rest} />;
};

function Router() {
  return (
    <RootLayout>
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/login" component={Login} />
        <Route path="/signup" component={Signup} />
        <Route path="/pricing" component={Pricing} />
        <Route path="/explore" component={Explore} />
        <Route path="/leaderboard" component={Leaderboard} />
        <Route path="/track/:slug" component={TrackDetail} />
        <Route path="/radio/:tag" component={SoulRadio} />
        <Route path="/radio" component={SoulRadio} />
        <Route path="/collection/:slug" component={CollectionPage} />

        {/* Listener Routes */}
        <Route path="/library">
          {() => <ProtectedRoute component={Library} />}
        </Route>

        {/* Creator Routes — specific paths MUST come before /creator/:slug wildcard */}
        <Route path="/creator/wrapped">
          {() => <ProtectedRoute component={SoulWrapped} role="creator" />}
        </Route>
        <Route path="/creator/dashboard">
          {() => <ProtectedRoute component={CreatorDashboard} role="creator" />}
        </Route>
        <Route path="/creator/onboarding">
          {() => <ProtectedRoute component={CreatorOnboarding} role="creator" />}
        </Route>
        <Route path="/creator/upload">
          {() => <ProtectedRoute component={CreatorUpload} role="creator" />}
        </Route>
        <Route path="/creator/:slug" component={CreatorProfile} />

        {/* Admin Routes */}
        <Route path="/admin">
          {() => <ProtectedRoute component={AdminDashboard} role="admin" />}
        </Route>

        <Route component={NotFound} />
      </Switch>
    </RootLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
