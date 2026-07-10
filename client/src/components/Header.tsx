import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface HeaderProps {
  provider: string;
  onProviderChange: (provider: string) => void;
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

  if (isLoading) {
    return null;
  }

  if (isAuthenticated && user) {
    return (
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-700" data-testid="text-user-name">
          {user.displayName || user.username}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          data-testid="button-logout"
        >
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

export default function Header({ provider, onProviderChange, onShowApiKeys }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 bg-white shadow-sm border-b border-gray-200 z-40">
      <div className="max-w-full mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">GPT Bypass</h1>
            <span className="text-sm text-gray-500 font-medium">AI Text Rewriter</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">LLM Provider:</label>
              <Select value={provider} onValueChange={onProviderChange}>
                <SelectTrigger className="w-40" data-testid="select-provider">
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">Zhi 1</SelectItem>
                  <SelectItem value="anthropic">Zhi 2</SelectItem>
                  <SelectItem value="deepseek">Zhi 3</SelectItem>
                  <SelectItem value="perplexity">Zhi 4</SelectItem>
                  <SelectItem value="venice">Zhi 5</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onShowApiKeys}
              data-testid="button-api-keys"
            >
              <i className="fas fa-key mr-2"></i>API Keys
            </Button>
            <a href="mailto:zhi@zhisystems.org" data-testid="link-contact">
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
