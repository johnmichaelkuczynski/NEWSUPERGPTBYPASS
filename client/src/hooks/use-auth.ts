import { useQuery } from "@tanstack/react-query";

interface AuthUser {
  id: string;
  username: string;
  email: string | null;
  displayName: string | null;
}

interface AuthResponse {
  authenticated: boolean;
  user: AuthUser | null;
}

export function useAuth() {
  const { data, isLoading } = useQuery<AuthResponse>({
    queryKey: ["/api/auth/user"],
  });

  return {
    user: data?.user ?? null,
    isAuthenticated: !!data?.authenticated,
    isLoading,
  };
}
