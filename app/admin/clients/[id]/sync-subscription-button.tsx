"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { syncSubscription } from "./actions";

export function SyncSubscriptionButton({ clientId }: { clientId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleSync() {
    setLoading(true);
    try {
      const fd = new FormData();
      fd.set("clientId", clientId);
      const message = await syncSubscription(fd);
      toast.success(message);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sync failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleSync} disabled={loading} variant="ghost" size="sm">
      <RefreshCw className={`h-4 w-4${loading ? " animate-spin" : ""}`} />
      {loading ? "Syncing..." : "Sync from Stripe"}
    </Button>
  );
}
