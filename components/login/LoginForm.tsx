"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3000";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = useMutation({
    mutationKey: ["verify-login"],
    mutationFn: async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => {
      const res = await axios.post(
        `${API_BASE}/api/auth/login`,
        { email, password },
        {
          validateStatus: () => true, // we handle non-2xx
        }
      );
      if (res.status >= 200 && res.status < 300) return true;
      throw new Error(res.data?.message || "Invalid email or password");
    },
    onSuccess: () => {
      router.replace("/users");
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
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

      {login.isError && (
        <p className="text-sm text-red-600 mt-2">
          {(login.error as Error).message}
        </p>
      )}
    </form>
  );
}
