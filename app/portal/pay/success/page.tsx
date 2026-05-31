import { LinkButton } from "@/components/ui/link-button";
import { CheckCircle2 } from "lucide-react";

export default async function PaySuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ ticket?: string }>;
}) {
  const sp = await searchParams;
  return (
    <div className="max-w-md mx-auto text-center py-16">
      <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-400 mb-4" />
      <h1 className="font-heading text-2xl font-semibold mb-2">Payment received</h1>
      <p className="text-muted-foreground mb-8">
        Thanks. We&apos;ve been notified and will start work shortly. You&apos;ll get an email when your change is live.
      </p>
      <div className="flex gap-2 justify-center">
        {sp.ticket && (
          <LinkButton href={`/portal/tickets/${sp.ticket}`} variant="secondary">
            View ticket
          </LinkButton>
        )}
        <LinkButton href="/portal">Back to dashboard</LinkButton>
      </div>
    </div>
  );
}
