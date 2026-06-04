import Link from "next/link";
import { ForgotPasswordForm } from "./forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-dvh flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <Link href="/" className="inline-flex items-center gap-2 mb-10">
          <span className="font-heading text-2xl font-semibold tracking-tight">NoBound</span>
          <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">portal</span>
        </Link>
        <h1 className="font-heading text-3xl font-semibold tracking-tight mb-2">
          Reset your password
        </h1>
        <p className="text-muted-foreground mb-8">
          We&apos;ll email you a link to set a new one.
        </p>
        <ForgotPasswordForm />
        <p className="text-xs text-muted-foreground mt-6 text-center">
          Remembered it?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
