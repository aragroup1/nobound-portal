"use client";

import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Link2, Copy, ExternalLink, Check } from "lucide-react";
import { generatePaymentLink } from "./actions";

export function PaymentLinkButton({ clientId }: { clientId: string }) {
  const [link, setLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    try {
      const fd = new FormData();
      fd.set("clientId", clientId);
      const url = await generatePaymentLink(fd);
      setLink(url);
      toast.success("Payment link ready — copy and send it to the client.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate link.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Copied.");
    setTimeout(() => setCopied(false), 2000);
  }

  if (!link) {
    return (
      <Button onClick={handleGenerate} disabled={loading} variant="secondary">
        <Link2 className="h-4 w-4" /> {loading ? "Generating..." : "Generate payment link"}
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input value={link} readOnly className="font-mono text-xs" />
        <Button onClick={handleCopy} variant="secondary" size="sm">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ variant: "secondary", size: "sm" })}
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
      <p className="text-xs text-muted-foreground">
        Send this link to the client via WhatsApp / email / wherever. Single-use; if they
        don&apos;t complete it, click Generate again for a new one.
      </p>
    </div>
  );
}
