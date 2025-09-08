"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

type LoginPayload = { email: string; password: string };
type LoginResponse = { userId: number; name: string; email: string };

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = useMutation<LoginResponse, Error, LoginPayload>({
    mutationKey: ["verify-login"],
    mutationFn: async (payload) => {
      const res = await axios.post<LoginResponse>(
        `${API_BASE}/api/auth/login`,
        payload,
        { validateStatus: () => true }
      );
      if (res.status >= 200 && res.status < 300) {
        return res.data; // ← return the actual payload so `login.data` is the user object
      }
      // if your API returns `{ message: string }` on error, try to surface it:
      const msg =
        (res.data as unknown as { message?: string })?.message ||
        "Invalid email or password";
      throw new Error(msg);
    },
    onSuccess: (user) => {
      // `user` is the same as `login.data`
      sessionStorage.setItem("currentUser", JSON.stringify(user)); // Very bad practice for production apps! Use cookies or secure storage instead.
      // Also set a simple cookie that middleware can check server-side
      // Note: for production, prefer an HttpOnly secure session cookie from the server.
      document.cookie = `logged_in=true; Path=/; Max-Age=${60 * 60 * 24 * 7}; SameSite=Lax`;
      router.replace("/users");
    },
  });

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        // If you want the value immediately here, use mutateAsync:
        // const user = await login.mutateAsync({ email, password });
        // console.log("Logged in as:", user);
        login.mutate({ email, password });
      }}
      className="max-w-sm space-y-4"
    >
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={login.isPending}>
        {login.isPending ? "Signing in..." : "Sign in"}
      </Button>

      {/* Example: read the stored response */}
      {login.isSuccess && (
        <p className="text-sm text-muted-foreground mt-2">
          Welcome, {login.data.name} ({login.data.email})
        </p>
      )}

      {login.isError && (
        <p className="text-sm text-red-600 mt-2">
          {(login.error as Error).message}
        </p>
      )}
    </form>
  );
}
