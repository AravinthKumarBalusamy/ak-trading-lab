import { useEffect, useRef } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useAuthStore } from "../store/authStore.js";
import { Card, CardContent } from "../components/ui/Card.js";
import { Loader2 } from "lucide-react";
import { User } from "@trading-lab/shared";

interface CallbackParams {
  request_token?: string;
}

export const AuthCallbackPage = () => {
  const search = useSearch({ from: "/auth/callback" }) as CallbackParams;
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const requestSent = useRef(false);

  useEffect(() => {
    const token = search.request_token;

    if (!token) {
      console.error("No request token provided in URL");
      navigate({ to: "/auth/login" }).catch((err) => {
        console.error("Navigation error:", err);
      });
      return;
    }

    if (requestSent.current) return;
    requestSent.current = true;

    fetch("/api/auth/callback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ requestToken: token }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Authentication exchange failed");
        return res.json() as Promise<{ token: string; user: User }>;
      })
      .then((data) => {
        localStorage.setItem("token", data.token);
        login(data.user);
        navigate({ to: "/" }).catch((err) => {
          console.error("Navigation error:", err);
        });
      })
      .catch((err) => {
        console.error("Auth callback error:", err);
        navigate({ to: "/auth/login" }).catch((navigationErr) => {
          console.error("Navigation error on auth failure:", navigationErr);
        });
      });
  }, [search, login, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen p-6">
      <Card className="w-full max-w-sm">
        <CardContent className="flex flex-col items-center justify-center p-12 space-y-4">
          <Loader2 className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-spin" />
          <h2 className="text-xl font-bold tracking-tight">
            Authenticating...
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            Exchanging Kite Connect credentials and generating session.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
