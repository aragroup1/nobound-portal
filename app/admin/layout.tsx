import { requireAdmin } from "@/lib/auth";
import { AppShell } from "@/components/shared/app-shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireAdmin();
  return (
    <AppShell
      badgeLabel="admin"
      userEmail={user.email ?? null}
      nav={[
        { href: "/admin/clients", label: "Clients" },
        { href: "/admin/tickets", label: "Tickets" },
        { href: "/admin/security", label: "Security" },
      ]}
    >
      {children}
    </AppShell>
  );
}
