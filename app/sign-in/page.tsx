import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignInForm } from "@/components/auth/sign-in-form";

export const metadata: Metadata = {
  title: "Sign In | Inwestim",
  description: "Sign in to your Inwestim account to manage your investments.",
};

export default function SignInPage() {
  return (
    <AuthShell
      eyebrow="Welcome back"
      title={
        <>
          Sign in to{" "}
          <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
            Inwestim
          </span>
        </>
      }
      subtitle="Access your portfolio and continue building long-term wealth."
    >
      <Suspense fallback={<div className="h-20" />}>
        <SignInForm />
      </Suspense>
    </AuthShell>
  );
}
