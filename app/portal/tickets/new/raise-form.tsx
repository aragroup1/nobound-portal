"use client";

import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Siren, Wrench } from "lucide-react";
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
        <Label htmlFor="type">Request type</Label>
        <Select name="type" defaultValue="modification">
          <SelectTrigger id="type" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="modification">
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div>Modification</div>
                  <div className="text-xs text-muted-foreground">
                    Standard change — copy, design, layout, content
                  </div>
                </div>
              </div>
            </SelectItem>
            <SelectItem value="emergency">
              <div className="flex items-center gap-2">
                <Siren className="h-4 w-4 text-rose-400" />
                <div>
                  <div>Emergency</div>
                  <div className="text-xs text-muted-foreground">
                    Site is broken or offline — we&apos;ll prioritise
                  </div>
                </div>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
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
