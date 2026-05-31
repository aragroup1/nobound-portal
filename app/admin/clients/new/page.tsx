import { PageHeader } from "@/components/shared/page-header";
import { OnboardForm } from "./onboard-form";
import { LinkButton } from "@/components/ui/link-button";
import { ArrowLeft } from "lucide-react";

export default function NewClientPage() {
  return (
    <>
      <PageHeader
        title="Onboard new client"
        description="Creates their account, sets up their Stripe customer, and emails them a payment link."
        action={
          <LinkButton href="/admin/clients" variant="ghost">
            <ArrowLeft className="h-4 w-4" /> Back
          </LinkButton>
        }
      />
      <div className="max-w-2xl">
        <OnboardForm />
      </div>
    </>
  );
}
