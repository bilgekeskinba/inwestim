"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Connect to authentication backend
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Email */}
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="text-sm font-medium text-slate-700"
        >
          Email
        </label>
        <div className="group relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <Mail className="h-5 w-5 text-slate-400 transition-colors group-focus-within:text-emerald-500" />
          </div>
          <input
            id="email"
            type="email"
            required
            placeholder="you@example.com"
            className="h-13 w-full rounded-2xl border-2 border-slate-200/80 bg-white py-3.5 pl-12 pr-4 text-[15px] text-slate-900 shadow-sm placeholder:text-slate-400 transition-all duration-300 hover:border-slate-300 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
          />
        </div>
      </div>

      {/* Password */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label
            htmlFor="password"
            className="text-sm font-medium text-slate-700"
          >
            Password
          </label>
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-emerald-600 transition-colors hover:text-emerald-700"
          >
            Forgot password?
          </Link>
        </div>
        <div className="group relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <Lock className="h-5 w-5 text-slate-400 transition-colors group-focus-within:text-emerald-500" />
          </div>
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            required
            placeholder="Enter your password"
            className="h-13 w-full rounded-2xl border-2 border-slate-200/80 bg-white py-3.5 pl-12 pr-12 text-[15px] text-slate-900 shadow-sm placeholder:text-slate-400 transition-all duration-300 hover:border-slate-300 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 transition-colors hover:text-slate-600"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Submit */}
      <Button
        type="submit"
        size="lg"
        className="group h-14 w-full rounded-full bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-base font-semibold text-white shadow-xl shadow-slate-900/25 transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl hover:shadow-slate-900/30 active:scale-[0.99]"
      >
        Sign In
        <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
      </Button>

      {/* Create account */}
      <p className="pt-2 text-center text-sm text-slate-500">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-semibold text-emerald-600 transition-colors hover:text-emerald-700"
        >
          Create account
        </Link>
      </p>
    </form>
  );
}
