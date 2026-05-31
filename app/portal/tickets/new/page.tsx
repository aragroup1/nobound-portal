import { PageHeader } from "@/components/shared/page-header";
import { RaiseForm } from "./raise-form";
import { LinkButton } from "@/components/ui/link-button";
import { ArrowLeft } from "lucide-react";

export default function NewTicketPage() {
  return (
    <>
      <PageHeader
        title="New change request"
        description="Tell us what needs to change. We'll come back with a price you can approve and pay."
        action={
          <LinkButton href="/portal/tickets" variant="ghost">
            <ArrowLeft className="h-4 w-4" /> Back
          </LinkButton>
        }
      />
      <div className="max-w-2xl">
        <RaiseForm />
      </div>
    </>
  );
}
