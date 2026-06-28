import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Create Account | Inwestim",
  description:
    "Create your Inwestim account and start investing in carefully selected properties.",
};

export default function RegisterPage() {
  return (
    <AuthShell
      eyebrow="Get started"
      title={
        <>
          Create your{" "}
          <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
            free account
          </span>
        </>
      }
      subtitle="Join thousands of investors and start from just USDC 100."
    >
      <RegisterForm />
    </AuthShell>
  );
}
