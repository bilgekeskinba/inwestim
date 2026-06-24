import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <nav className="relative z-20 flex items-center justify-between px-6 py-6 md:px-12 lg:px-20">
      <div className="flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
          <span className="text-xl font-bold text-white">I</span>
        </div>
        <span className="text-xl font-semibold tracking-tight text-white">
          Inwestim
        </span>
      </div>

      <div className="hidden items-center gap-8 md:flex">
        <Link
          href="/properties"
          className="text-sm font-medium text-white/80 transition-colors hover:text-white"
        >
          Properties
        </Link>
        <Link
          href="/#how-it-works"
          className="text-sm font-medium text-white/80 transition-colors hover:text-white"
        >
          How It Works
        </Link>
        <Link
          href="/#about"
          className="text-sm font-medium text-white/80 transition-colors hover:text-white"
        >
          About
        </Link>
        <Link
          href="/#contact"
          className="text-sm font-medium text-white/80 transition-colors hover:text-white"
        >
          Contact
        </Link>
      </div>

      <div className="hidden items-center gap-4 md:flex">
        <Button
          asChild
          variant="ghost"
          className="text-white/90 hover:bg-white/10 hover:text-white"
        >
          <Link href="/sign-in">Sign In</Link>
        </Button>
        <Button
          asChild
          className="rounded-full bg-white px-6 text-sm font-semibold text-slate-900 shadow-lg shadow-black/20 transition-all hover:bg-white/90 hover:shadow-xl"
        >
          <Link href="/register">Get Started</Link>
        </Button>
      </div>

      <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm md:hidden">
        <svg
          className="h-5 w-5 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>
    </nav>
  );
}
