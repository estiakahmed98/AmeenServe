"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@local.test");
  const [password, setPassword] = useState("Admin#12345");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signIn("credentials", { email, password, callbackUrl: "/dashboard" });
  };

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <Input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="Email" />
        <Input value={password} type="password" onChange={(e)=>setPassword(e.target.value)} placeholder="Password" />
        <Button type="submit" className="w-full">Login</Button>
      </form>
    </div>
  );
}
