"use client";

import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { raiseTicket, type RaiseState } from "./actions";

const initial: RaiseState = { ok: false };

export function RaiseForm() {
  const [state, action, pending] = useActionState(raiseTicket, initial);

  useEffect(() => {
    if (state.message && !state.ok) toast.error(state.message);
  }, [state]);

  return (
    <form action={action} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          required
          placeholder="e.g. Update homepage hero copy"
        />
        {state.fieldErrors?.title && (
          <p className="text-xs text-destructive">{state.fieldErrors.title}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">What needs to change?</Label>
        <Textarea
          id="description"
          name="description"
          rows={8}
          required
          placeholder="Describe the change. Links, screenshots welcome — paste in the description."
        />
        {state.fieldErrors?.description && (
          <p className="text-xs text-destructive">{state.fieldErrors.description}</p>
        )}
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Submitting..." : "Submit request"}
      </Button>
      <p className="text-xs text-muted-foreground text-center">
        We&apos;ll review and reply with a price within 24 hours.
      </p>
    </form>
  );
}
