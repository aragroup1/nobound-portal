"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Copy, Check, ExternalLink, Plus } from "lucide-react";
import { onboardClient, type OnboardState } from "./actions";

const initial: OnboardState = { ok: false };

export function OnboardForm() {
  const [state, action, pending] = useActionState(onboardClient, initial);
  const [hasHosting, setHasHosting] = useState(false);
  const [hasSeo, setHasSeo] = useState(false);

  useEffect(() => {
    if (state.message && !state.ok) toast.error(state.message);
  }, [state]);

  if (state.ok && state.result) {
    return <SuccessPanel result={state.result} />;
  }

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="has_hosting" value={hasHosting ? "on" : "off"} />
      <input type="hidden" name="has_seo" value={hasSeo ? "on" : "off"} />
      <Field label="Full name" name="name" required error={state.fieldErrors?.name} />
      <Field label="Email" name="email" type="email" required error={state.fieldErrors?.email} />
      <Field label="Business name" name="business_name" placeholder="Optional" />
      <Field
        label="Website URL"
        name="website_url"
        type="url"
        placeholder="https://example.com"
        error={state.fieldErrors?.website_url}
      />

      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="text-sm font-medium">Plan</div>
        <PlanToggle
          label="Hosting"
          price="£15 / month"
          checked={hasHosting}
          onCheckedChange={setHasHosting}
        />
        <PlanToggle
          label="SEO"
          price="£100 / month"
          checked={hasSeo}
          onCheckedChange={setHasSeo}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="build_cost">Build cost</Label>
        <Input
          id="build_cost"
          name="build_cost"
          type="number"
          min="0"
          step="0.01"
          placeholder="e.g. 199"
        />
        <p className="text-xs text-muted-foreground">
          One-off build fee in pounds. Added to the first checkout. Leave blank if there is no build cost.
        </p>
      </div>

      <Field label="Start date" name="started_at" type="date" />

      <div className="space-y-2">
        <Label htmlFor="password">Password (optional)</Label>
        <Input
          id="password"
          name="password"
          type="text"
          minLength={8}
          autoComplete="off"
          placeholder="Leave blank to auto-generate a strong one"
        />
        <p className="text-xs text-muted-foreground">
          Sets the client&apos;s portal login password. We&apos;ll show it once after creating
          the account so you can copy and send it.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Internal notes</Label>
        <Textarea id="notes" name="notes" rows={3} placeholder="Anything to remember about this client" />
      </div>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Creating account & Stripe customer..." : "Create client"}
      </Button>
    </form>
  );
}

function SuccessPanel({
  result,
}: {
  result: NonNullable<OnboardState["result"]>;
}) {
  return (
    <div className="space-y-6">
      <Card className="border-emerald-500/30 bg-emerald-500/5">
        <CardContent className="pt-6 space-y-5">
          <div>
            <div className="text-sm font-medium text-emerald-300">Client created.</div>
            <p className="text-sm text-muted-foreground mt-1">
              Send the credentials and the payment link to the client via WhatsApp, SMS, or
              email — whatever works. Once they pay, their subscription activates automatically.
            </p>
          </div>

          <SecretRow label="Portal login URL" value={result.loginUrl} />
          <SecretRow label="Password" value={result.password} mono />
          <SecretRow label="Payment link (Stripe Checkout)" value={result.checkoutUrl} />
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Link
          href={`/admin/clients/${result.clientId}`}
          className={buttonVariants({ variant: "secondary" })}
        >
          View client
        </Link>
        <Link href="/admin/clients/new" className={buttonVariants()}>
          <Plus className="h-4 w-4" /> Onboard another
        </Link>
      </div>
    </div>
  );
}

function SecretRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success("Copied.");
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
        {label}
      </div>
      <div className="flex gap-2">
        <Input
          value={value}
          readOnly
          className={mono ? "font-mono" : "font-mono text-xs"}
        />
        <Button onClick={copy} variant="secondary" size="sm" type="button">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
        {value.startsWith("http") && (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: "secondary", size: "sm" })}
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
  error,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  error?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <Input id={name} name={name} type={type} required={required} placeholder={placeholder} />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function PlanToggle({
  label,
  price,
  checked,
  onCheckedChange,
}: {
  label: string;
  price: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 cursor-pointer">
      <div>
        <div className="font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{price}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </label>
  );
}
