import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AuthVisual } from "@/components/auth/auth-visual";

interface AuthShellProps {
  eyebrow: string;
  title: React.ReactNode;
  subtitle: string;
  children: React.ReactNode;
}

export function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
}: AuthShellProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-white via-slate-50/40 to-white">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(16,185,129,0.08),transparent)]" />
      <div className="pointer-events-none absolute right-0 top-1/4 h-96 w-96 rounded-full bg-emerald-100/30 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-72 w-72 rounded-full bg-slate-100/50 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl items-center px-6 py-10 lg:px-8">
        <div className="grid w-full items-stretch gap-10 lg:grid-cols-2">
          {/* Side visual */}
          <AuthVisual />

          {/* Form panel */}
          <div className="flex flex-col justify-center">
            {/* Back to home */}
            <Link
              href="/"
              className="mb-8 inline-flex w-fit items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to home
            </Link>

            {/* Glass card */}
            <div className="rounded-3xl border border-slate-200/70 bg-white/70 p-8 shadow-xl shadow-slate-200/50 backdrop-blur-xl sm:p-10">
              {/* Mobile brand */}
              <div className="mb-8 flex items-center gap-2 lg:hidden">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900">
                  <span className="text-xl font-bold text-white">I</span>
                </div>
                <span className="text-xl font-semibold tracking-tight text-slate-900">
                  Inwestim
                </span>
              </div>

              <span className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">
                {eyebrow}
              </span>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                {title}
              </h1>
              <p className="mt-3 leading-relaxed text-slate-500">{subtitle}</p>

              <div className="mt-8">{children}</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
