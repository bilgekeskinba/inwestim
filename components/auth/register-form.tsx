"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const interests = [
  "Residential",
  "Commercial",
  "Short-term rentals",
  "Mixed portfolio",
];

export function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formError, setFormError] = useState("");
  const router = useRouter();
  const STORAGE_KEY = "verifyEmail";

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name")?.toString().trim() ?? "";
    const email = formData.get("email")?.toString().trim() ?? "";
    const password = formData.get("password")?.toString() ?? "";
    const confirm = formData.get("confirm")?.toString() ?? "";

    if (!name || !email || !password || !confirm) {
      setFormError("Please fill in all required fields.");
      return;
    }

    if (password !== confirm) {
      setFormError("Passwords do not match.");
      return;
    }

    setFormError("");
    if (typeof window !== "undefined") {
      sessionStorage.setItem(STORAGE_KEY, email);
    }

    router.push("/verify-email");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Full name */}
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium text-slate-700">
          Full name
        </label>
        <div className="group relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <User className="h-5 w-5 text-slate-400 transition-colors group-focus-within:text-emerald-500" />
          </div>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="Jane Doe"
            className="w-full rounded-2xl border-2 border-slate-200/80 bg-white py-3.5 pl-12 pr-4 text-[15px] text-slate-900 shadow-sm placeholder:text-slate-400 transition-all duration-300 hover:border-slate-300 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
          />
        </div>
      </div>

      {/* Email */}
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-slate-700">
          Email
        </label>
        <div className="group relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <Mail className="h-5 w-5 text-slate-400 transition-colors group-focus-within:text-emerald-500" />
          </div>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="you@example.com"
            className="w-full rounded-2xl border-2 border-slate-200/80 bg-white py-3.5 pl-12 pr-4 text-[15px] text-slate-900 shadow-sm placeholder:text-slate-400 transition-all duration-300 hover:border-slate-300 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
          />
        </div>
      </div>

      {/* Password + Confirm */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <label
            htmlFor="password"
            className="text-sm font-medium text-slate-700"
          >
            Password
          </label>
          <div className="group relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <Lock className="h-5 w-5 text-slate-400 transition-colors group-focus-within:text-emerald-500" />
            </div>
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              placeholder="Create password"
              className="w-full rounded-2xl border-2 border-slate-200/80 bg-white py-3.5 pl-12 pr-12 text-[15px] text-slate-900 shadow-sm placeholder:text-slate-400 transition-all duration-300 hover:border-slate-300 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
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

        <div className="space-y-2">
          <label
            htmlFor="confirm"
            className="text-sm font-medium text-slate-700"
          >
            Confirm password
          </label>
          <div className="group relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <Lock className="h-5 w-5 text-slate-400 transition-colors group-focus-within:text-emerald-500" />
            </div>
            <input
              id="confirm"
              name="confirm"
              type={showConfirm ? "text" : "password"}
              required
              placeholder="Repeat password"
              className="w-full rounded-2xl border-2 border-slate-200/80 bg-white py-3.5 pl-12 pr-12 text-[15px] text-slate-900 shadow-sm placeholder:text-slate-400 transition-all duration-300 hover:border-slate-300 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((prev) => !prev)}
              className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 transition-colors hover:text-slate-600"
              aria-label={showConfirm ? "Hide password" : "Show password"}
            >
              {showConfirm ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Investment interest (optional) */}
      <div className="space-y-2">
        <label
          htmlFor="interest"
          className="flex items-center gap-2 text-sm font-medium text-slate-700"
        >
          Investment interest
          <span className="text-xs font-normal text-slate-400">(optional)</span>
        </label>
        <select
          id="interest"
          name="interest"
          defaultValue=""
          className="w-full rounded-2xl border-2 border-slate-200/80 bg-white px-4 py-3.5 text-[15px] text-slate-900 shadow-sm transition-all duration-300 hover:border-slate-300 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
        >
          <option value="" disabled>
            Select your interest
          </option>
          {interests.map((interest) => (
            <option key={interest} value={interest}>
              {interest}
            </option>
          ))}
        </select>
      </div>

      {/* Submit */}
      {formError ? (
        <p className="text-sm font-medium text-red-500">{formError}</p>
      ) : null}
      <Button
        type="submit"
        size="lg"
        className="group h-14 w-full rounded-full bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-base font-semibold text-white shadow-xl shadow-slate-900/25 transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl hover:shadow-slate-900/30 active:scale-[0.99]"
      >
        Create account
        <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
      </Button>

      {/* Sign in */}
      <p className="pt-2 text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link
          href="/sign-in"
          className="font-semibold text-emerald-600 transition-colors hover:text-emerald-700"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
