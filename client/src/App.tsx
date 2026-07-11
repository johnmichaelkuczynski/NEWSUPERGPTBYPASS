import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Admin from "@/pages/Admin";
import NotFound from "@/pages/not-found";
import { useAuth } from "@/hooks/use-auth";

const IS_PROD = import.meta.env.PROD;

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  // In development, skip the gate so the OAuth redirect issue doesn't block work
  if (!IS_PROD) return <>{children}</>;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-400">Loading…</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/admin" component={Admin} />
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AuthGate>
          <Router />
        </AuthGate>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
