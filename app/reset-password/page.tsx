import Link from "next/link";
import { ResetPasswordForm } from "./reset-password-form";

export default function ResetPasswordPage() {
  return (
    <main className="min-h-dvh flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <Link href="/" className="inline-flex items-center gap-2 mb-10">
          <span className="font-heading text-2xl font-semibold tracking-tight">NoBound</span>
          <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">portal</span>
        </Link>
        <h1 className="font-heading text-3xl font-semibold tracking-tight mb-2">
          Set a new password
        </h1>
        <p className="text-muted-foreground mb-8">
          Make it long. Don&apos;t reuse one from another site.
        </p>
        <ResetPasswordForm />
      </div>
    </main>
  );
}
