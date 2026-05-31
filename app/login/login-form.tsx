"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function LoginForm({ next }: { next?: string }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
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
    setSent(true);
    toast.success("Check your inbox for the magic link.");
  }

  if (sent) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="font-heading text-xl font-semibold mb-2">Magic link sent</h2>
        <p className="text-muted-foreground text-sm">
          We&apos;ve sent a sign-in link to <span className="text-foreground">{email}</span>.
          Open the email on this device and click the link.
        </p>
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
      <Button type="submit" disabled={loading || !email} className="w-full">
        {loading ? "Sending..." : "Send magic link"}
      </Button>
    </form>
  );
}
