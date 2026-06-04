"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function ResetPasswordForm() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // After Supabase processes the email link, a session is available with
    // a temporary recovery token. We just need to verify there's a session.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setReady(true);
      } else {
        setErrorMsg("This reset link is no longer valid. Request a new one.");
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Passwords don't match.");
      return;
    }
    if (password.length < 8) {
      toast.error("Use at least 8 characters.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated. Signing you in…");
    router.push("/");
    router.refresh();
  }

  if (errorMsg) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6">
        <h2 className="font-heading text-xl font-semibold mb-2">Link expired</h2>
        <p className="text-muted-foreground text-sm mb-4">{errorMsg}</p>
        <Link
          href="/forgot-password"
          className="text-sm text-primary hover:underline"
        >
          Request a new reset link →
        </Link>
      </div>
    );
  }

  if (!ready) {
    return <p className="text-muted-foreground text-sm">Verifying your reset link…</p>;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm">Confirm new password</Label>
        <Input
          id="confirm"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </div>
      <Button
        type="submit"
        disabled={loading || !password || password !== confirm}
        className="w-full"
      >
        {loading ? "Updating…" : "Set new password"}
      </Button>
    </form>
  );
}
