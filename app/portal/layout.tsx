import { requireClient } from "@/lib/auth";
import { AppShell } from "@/components/shared/app-shell";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireClient();
  return (
    <AppShell
      badgeLabel="client"
      userEmail={user.email ?? null}
      nav={[
        { href: "/portal", label: "Dashboard" },
        { href: "/portal/tickets", label: "Change requests" },
        { href: "/portal/tickets/new", label: "New request" },
      ]}
    >
      {children}
    </AppShell>
  );
}
