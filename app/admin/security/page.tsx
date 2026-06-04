import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { MfaSetup } from "./mfa-setup";

export default async function SecurityPage() {
  await requireAdmin();
  return (
    <>
      <PageHeader
        title="Security"
        description="Protect your admin account with two-factor authentication."
      />
      <div className="max-w-2xl">
        <MfaSetup />
      </div>
    </>
  );
}
