"use client";

import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";

export default function LogoutButton() {
  const handleLogout = async () => {
    try {
      await signOut({ callbackUrl: "/" });
    } catch (e) {
      // no-op
    }
  };

  return (
    <Button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white">
      Logout
    </Button>
  );
}
