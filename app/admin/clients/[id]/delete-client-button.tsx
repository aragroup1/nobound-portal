"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";
import { deleteClient } from "./actions";

export function DeleteClientButton({
  clientId,
  clientName,
  compact = false,
}: {
  clientId: string;
  clientName: string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          compact ? (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Delete ${clientName}`}
              title={`Delete ${clientName}`}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          ) : (
            <Button variant="destructive" size="sm">
              <Trash2 className="h-4 w-4" /> Delete client
            </Button>
          )
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {clientName}?</DialogTitle>
          <DialogDescription>
            This cancels their Stripe subscription, removes their Stripe customer record,
            deletes their portal account, and removes all their tickets and invoices from
            our database. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <form action={deleteClient}>
            <input type="hidden" name="clientId" value={clientId} />
            <Button type="submit" variant="destructive">
              <Trash2 className="h-4 w-4" /> Yes, delete permanently
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
