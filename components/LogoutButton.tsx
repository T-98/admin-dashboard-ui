"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = () => {
    try {
      // Clear client-side session
      sessionStorage.removeItem("currentUser");
      // Expire the simple auth cookie used by middleware
      document.cookie = "logged_in=; Path=/; Max-Age=0; SameSite=Lax";
    } catch {
      // noop
    }
    router.replace("/login");
  };

  return (
    <Button variant="default" onClick={handleLogout} aria-label="Log out">
      Log out
    </Button>
  );
}

