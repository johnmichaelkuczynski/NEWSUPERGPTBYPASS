import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import zhiLogo from "@assets/zhi_logoc_1787767286486.png";

interface HeaderProps {
  onShowApiKeys?: () => void;
}

function AuthControls() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      queryClient.setQueryData(["/api/auth/user"], { authenticated: false, user: null });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    } catch {
      toast({ title: "Logout failed", variant: "destructive" });
    }
  };

  if (isLoading) return null;

  if (isAuthenticated && user) {
    return (
      <div className="flex items-center space-x-3">
        <span className="text-sm text-gray-700" data-testid="text-user-name">
          {user.displayName || user.username}
        </span>
        <Button variant="outline" size="sm" onClick={handleLogout} data-testid="button-logout">
          <i className="fas fa-sign-out-alt mr-2"></i>Log out
        </Button>
      </div>
    );
  }

  return (
    <a href="/api/auth/google" data-testid="link-login-google">
      <Button variant="outline" size="sm">
        <i className="fab fa-google mr-2"></i>Sign in with Google
      </Button>
    </a>
  );
}

export default function Header({}: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 bg-white shadow-sm border-b border-gray-200 z-40">
      <div className="max-w-full mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <a
              href="https://zhisystems.ai/"
              target="_blank"
              rel="noreferrer"
              aria-label="Visit Zhi Systems"
              className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm transition-opacity hover:opacity-80"
              data-testid="link-zhi-logo"
            >
              <img src={zhiLogo} alt="Zhi Systems" className="h-7 w-7 object-contain" />
            </a>
            <h1 className="text-2xl font-bold text-gray-900">Text Transformer</h1>
            <span className="text-sm text-gray-500 font-medium">Direct, practical writing</span>
          </div>
          <div className="flex items-center space-x-4">
            <a href="mailto:johnmichaelkuczynski@gmail.com" data-testid="link-contact">
              <Button variant="outline" size="sm">
                <i className="fas fa-envelope mr-2"></i>Contact Us
              </Button>
            </a>
            <AuthControls />
          </div>
        </div>
      </div>
    </header>
  );
}
