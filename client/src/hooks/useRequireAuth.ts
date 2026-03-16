import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

/**
 * Use in protected pages.
 * Waits for AuthContext to finish loading before redirecting to /login
 * so that a hard refresh doesn't kick users out.
 */
export function useRequireAuth() {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!auth.isLoading && !auth.user) {
      router.replace("/login");
    }
  }, [auth.user, auth.isLoading, router]);

  return auth;
}
