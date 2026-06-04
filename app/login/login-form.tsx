"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Mode = "password" | "magic";

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [magicSent, setMagicSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createSupabaseBrowserClient();

    if (mode === "password") {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      setLoading(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      router.push(next ?? "/");
      router.refresh();
      return;
    }

    const redirectTo =
      `${window.location.origin}/auth/callback` +
      (next ? `?next=${encodeURIComponent(next)}` : "");
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setMagicSent(true);
    toast.success("Check your inbox for the magic link.");
  }

  if (magicSent) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="font-heading text-xl font-semibold mb-2">Magic link sent</h2>
        <p className="text-muted-foreground text-sm">
          We&apos;ve sent a sign-in link to <span className="text-foreground">{email}</span>.
          Open the email on this device and click the link.
        </p>
        <button
          type="button"
          onClick={() => setMagicSent(false)}
          className="text-xs text-primary mt-4 hover:underline"
        >
          ← Use a different method
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      {mode === "password" && (
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      )}

      <Button
        type="submit"
        disabled={loading || !email || (mode === "password" && !password)}
        className="w-full"
      >
        {loading ? (mode === "password" ? "Signing in..." : "Sending...") : (mode === "password" ? "Sign in" : "Send magic link")}
      </Button>

      <button
        type="button"
        onClick={() => setMode(mode === "password" ? "magic" : "password")}
        className="text-xs text-muted-foreground hover:text-foreground w-full text-center pt-2"
      >
        {mode === "password" ? "Use a magic link instead" : "Use a password instead"}
      </button>
    </form>
  );
}
