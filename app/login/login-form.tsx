"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Mode = "password" | "magic";
type Step = "credentials" | "mfa" | "magic_sent";

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [mode, setMode] = useState<Mode>("password");
  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    if (mode === "magic") {
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
      setStep("magic_sent");
      toast.success("Check your inbox for the magic link.");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      setLoading(false);
      toast.error(error.message);
      return;
    }

    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal && aal.nextLevel === "aal2" && aal.currentLevel !== "aal2") {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const verified = factors?.totp?.find((f) => f.status === "verified");
      if (verified) {
        setFactorId(verified.id);
        setStep("mfa");
        setLoading(false);
        return;
      }
    }

    setLoading(false);
    router.push(next ?? "/");
    router.refresh();
  }

  async function handleMfa(e: React.FormEvent) {
    e.preventDefault();
    if (!factorId) return;
    setLoading(true);
    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code: code.trim(),
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    router.push(next ?? "/");
    router.refresh();
  }

  if (step === "magic_sent") {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="font-heading text-xl font-semibold mb-2">Magic link sent</h2>
        <p className="text-muted-foreground text-sm">
          We&apos;ve sent a sign-in link to <span className="text-foreground">{email}</span>.
          Open the email on this device and click the link.
        </p>
        <button
          type="button"
          onClick={() => setStep("credentials")}
          className="text-xs text-primary mt-4 hover:underline"
        >
          ← Use a different method
        </button>
      </div>
    );
  }

  if (step === "mfa") {
    return (
      <form onSubmit={handleMfa} className="space-y-4">
        <div>
          <h2 className="font-heading text-xl font-semibold">Two-factor code</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Open your authenticator app and enter the 6-digit code for NoBound Admin.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="mfa-code">Code</Label>
          <Input
            id="mfa-code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            autoFocus
            placeholder="123456"
            className="text-2xl font-mono tracking-[0.4em] text-center"
          />
        </div>
        <Button type="submit" disabled={loading || code.length !== 6} className="w-full">
          {loading ? "Verifying…" : "Verify & sign in"}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleCredentials} className="space-y-4">
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
        {loading
          ? mode === "password" ? "Signing in…" : "Sending…"
          : mode === "password" ? "Sign in" : "Send magic link"}
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
