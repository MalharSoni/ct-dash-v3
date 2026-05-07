"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function UnlockForm({ next }: { next: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim()) {
      toast.error("Enter the password");
      return;
    }
    setPending(true);
    try {
      const res = await fetch("/api/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message ?? "Wrong password");
        setPending(false);
        return;
      }
      toast.success("Welcome");
      // Redirect to the originally-requested path. router.push picks up the
      // freshly-set cookie because middleware will re-evaluate on next nav.
      const safe = next && next.startsWith("/") ? next : "/";
      router.push(safe);
      router.refresh();
    } catch {
      toast.error("Network error");
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          autoComplete="current-password"
        />
      </div>
      <Button type="submit" className="w-full" size="sm" disabled={pending}>
        {pending ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Lock size={14} />
        )}
        Unlock
      </Button>
    </form>
  );
}
