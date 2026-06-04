"use client";

import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { KeyRound, Copy, Check } from "lucide-react";
import { resetPassword } from "./actions";

export function ResetPasswordButton({ clientId }: { clientId: string }) {
  const [password, setPassword] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleReset() {
    if (!confirm("Generate a new password? The old one will stop working.")) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.set("clientId", clientId);
      const pw = await resetPassword(fd);
      setPassword(pw);
      toast.success("New password generated.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!password) return;
    await navigator.clipboard.writeText(password);
    setCopied(true);
    toast.success("Copied.");
    setTimeout(() => setCopied(false), 2000);
  }

  if (!password) {
    return (
      <Button onClick={handleReset} disabled={loading} variant="secondary" size="sm">
        <KeyRound className="h-4 w-4" /> {loading ? "Resetting..." : "Reset password"}
      </Button>
    );
  }

  return (
    <div className="flex gap-2">
      <Input value={password} readOnly className="font-mono" />
      <Button onClick={handleCopy} variant="secondary" size="sm">
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  );
}
