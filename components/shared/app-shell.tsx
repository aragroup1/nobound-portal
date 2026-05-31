import Link from "next/link";
import { SignOutButton } from "./sign-out-button";

interface NavItem {
  href: string;
  label: string;
}

export function AppShell({
  nav,
  userEmail,
  badgeLabel,
  children,
}: {
  nav: NavItem[];
  userEmail: string | null;
  badgeLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh flex flex-col">
      <header className="border-b border-border bg-background/60 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-3">
            <span className="font-heading text-xl font-semibold tracking-tight">NoBound</span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground rounded-full border border-border px-2 py-0.5">
              {badgeLabel}
            </span>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            {userEmail && (
              <span className="text-xs text-muted-foreground hidden sm:inline">{userEmail}</span>
            )}
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10">{children}</main>
    </div>
  );
}
