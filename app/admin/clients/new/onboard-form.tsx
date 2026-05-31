"use client";

import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { onboardClient, type OnboardState } from "./actions";

const initial: OnboardState = { ok: false };

export function OnboardForm() {
  const [state, action, pending] = useActionState(onboardClient, initial);

  useEffect(() => {
    if (state.message && !state.ok) toast.error(state.message);
  }, [state]);

  return (
    <form action={action} className="space-y-6">
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
        <PlanToggle name="has_hosting" label="Hosting" price="£10 / month" />
        <PlanToggle name="has_seo" label="SEO" price="£100 / month" />
      </div>

      <Field
        label="Start date"
        name="started_at"
        type="date"
        placeholder=""
      />

      <div className="space-y-2">
        <Label htmlFor="notes">Internal notes</Label>
        <Textarea id="notes" name="notes" rows={3} placeholder="Anything to remember about this client" />
      </div>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Creating account & Stripe customer..." : "Create client & send welcome email"}
      </Button>
    </form>
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

function PlanToggle({ name, label, price }: { name: string; label: string; price: string }) {
  return (
    <label htmlFor={name} className="flex items-center justify-between gap-4 cursor-pointer">
      <div>
        <div className="font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{price}</div>
      </div>
      <Switch id={name} name={name} />
    </label>
  );
}
