"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ShieldCheck, ShieldAlert, Trash2, Copy, Check } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Factor = { id: string; status: string; friendly_name?: string | null };
type EnrollState = {
  factorId: string;
  qrCode: string;
  secret: string;
  uri: string;
};

export function MfaSetup() {
  const [factors, setFactors] = useState<Factor[] | null>(null);
  const [enroll, setEnroll] = useState<EnrollState | null>(null);
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState(false);
  const supabase = createSupabaseBrowserClient();

  async function refreshFactors() {
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) {
      toast.error(error.message);
      return;
    }
    setFactors(data.totp ?? []);
  }

  useEffect(() => {
    refreshFactors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startEnroll() {
    setPending(true);
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: `NoBound Admin (${new Date().toISOString().slice(0, 10)})`,
    });
    setPending(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setEnroll({
      factorId: data.id,
      qrCode: data.totp.qr_code,
      secret: data.totp.secret,
      uri: data.totp.uri,
    });
  }

  async function verify() {
    if (!enroll) return;
    setPending(true);
    const { data: challenge, error: chalErr } = await supabase.auth.mfa.challenge({
      factorId: enroll.factorId,
    });
    if (chalErr || !challenge) {
      setPending(false);
      toast.error(chalErr?.message ?? "Failed to start challenge.");
      return;
    }
    const { error: verErr } = await supabase.auth.mfa.verify({
      factorId: enroll.factorId,
      challengeId: challenge.id,
      code: code.trim(),
    });
    setPending(false);
    if (verErr) {
      toast.error(verErr.message);
      return;
    }
    toast.success("Authenticator app verified. MFA is now active.");
    setEnroll(null);
    setCode("");
    refreshFactors();
  }

  async function unenroll(factorId: string) {
    if (!confirm("Remove this authenticator? You'll only have your password protecting your admin account.")) return;
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Authenticator removed.");
    refreshFactors();
  }

  async function copySecret() {
    if (!enroll) return;
    await navigator.clipboard.writeText(enroll.secret);
    setCopied(true);
    toast.success("Secret copied.");
    setTimeout(() => setCopied(false), 2000);
  }

  if (factors === null) {
    return <p className="text-muted-foreground text-sm">Loading…</p>;
  }

  const verifiedFactors = factors.filter((f) => f.status === "verified");

  if (enroll) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Scan with your authenticator app</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <ol className="text-sm text-muted-foreground space-y-2 list-decimal pl-5">
            <li>Open Google Authenticator, 1Password, Authy, or any TOTP app.</li>
            <li>Scan this QR code, or paste the secret below if you can&apos;t scan.</li>
            <li>Enter the 6-digit code from your app to verify and finish setup.</li>
          </ol>

          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div
              className="bg-white p-3 rounded-xl"
              dangerouslySetInnerHTML={{ __html: enroll.qrCode }}
            />
            <div className="flex-1 space-y-3">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Secret
              </div>
              <div className="flex gap-2">
                <Input value={enroll.secret} readOnly className="font-mono text-xs" />
                <Button onClick={copySecret} variant="secondary" size="sm" type="button">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mfa-code">6-digit code from your app</Label>
            <Input
              id="mfa-code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="123456"
              className="text-2xl font-mono tracking-[0.4em] text-center"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={verify} disabled={pending || code.length !== 6}>
              {pending ? "Verifying…" : "Verify & enable"}
            </Button>
            <Button onClick={() => { setEnroll(null); setCode(""); }} variant="ghost">
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Two-factor authentication</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {verifiedFactors.length === 0 ? (
          <div className="flex items-start gap-3 text-sm">
            <ShieldAlert className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-foreground">Not yet enabled.</p>
              <p className="text-muted-foreground mt-1">
                Set up an authenticator app (Google Authenticator, 1Password, Authy) so a
                stolen password isn&apos;t enough to get into your admin.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 text-sm">
            <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-foreground">MFA is active.</p>
              <p className="text-muted-foreground mt-1">
                You&apos;ll be asked for a 6-digit code from your authenticator on every
                sign-in.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {verifiedFactors.map((f) => (
            <div
              key={f.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/40 px-4 py-3"
            >
              <div>
                <div className="font-medium text-sm">{f.friendly_name ?? "Authenticator"}</div>
                <div className="text-xs text-muted-foreground">Active</div>
              </div>
              <Button
                onClick={() => unenroll(f.id)}
                variant="ghost"
                size="sm"
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4" /> Remove
              </Button>
            </div>
          ))}
        </div>

        <Button onClick={startEnroll} disabled={pending}>
          {pending
            ? "Loading…"
            : verifiedFactors.length === 0
              ? "Set up authenticator app"
              : "Add another authenticator"}
        </Button>
      </CardContent>
    </Card>
  );
}
