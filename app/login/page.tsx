import Link from "next/link";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const sp = await searchParams;
  return (
    <main className="min-h-dvh flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <Link href="/" className="inline-flex items-center gap-2 mb-10">
          <span className="font-heading text-2xl font-semibold tracking-tight">NoBound</span>
          <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">portal</span>
        </Link>
        <h1 className="font-heading text-3xl font-semibold tracking-tight mb-2">
          Sign in to your account
        </h1>
        <p className="text-muted-foreground mb-8">
          We&apos;ll email you a magic link — no password required.
        </p>
        <LoginForm next={sp.next} />
      </div>
    </main>
  );
}
