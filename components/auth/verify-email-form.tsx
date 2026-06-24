"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Mail, CheckCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const CODE_LENGTH = 6;
const DEMO_CODE = "123456";
const STORAGE_KEY = "verifyEmail";

export function VerifyEmailForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    const storedEmail = typeof window !== "undefined" ? sessionStorage.getItem(STORAGE_KEY) : null;
    if (storedEmail) {
      setEmail(storedEmail);
    }
    inputRefs.current[0]?.focus();
  }, []);

  const code = digits.join("");
  const isComplete = digits.every((digit) => digit !== "");

  const updateDigit = (index: number, value: string) => {
    if (!/^[0-9]?$/.test(value)) return;
    setDigits((current) => {
      const next = [...current];
      next[index] = value;
      return next;
    });
    setError("");
    setResendMessage("");
    if (value && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && digits[index] === "") {
      if (index > 0) {
        inputRefs.current[index - 1]?.focus();
        setDigits((current) => {
          const next = [...current];
          next[index - 1] = "";
          return next;
        });
      }
    }

    if (event.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    if (event.key === "ArrowRight" && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").trim().slice(0, CODE_LENGTH);
    if (!/^[0-9]+$/.test(pasted)) return;

    const nextDigits = Array(CODE_LENGTH).fill("");
    for (let i = 0; i < pasted.length; i += 1) {
      nextDigits[i] = pasted[i];
    }

    setDigits(nextDigits);
    setError("");
    setResendMessage("");
    const nextIndex = Math.min(pasted.length, CODE_LENGTH - 1);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isComplete) {
      setError("Please enter the full 6-digit code.");
      return;
    }

    if (code !== DEMO_CODE) {
      setError("The code is invalid. Please try again.");
      return;
    }

    setError("");
    setIsSubmitting(true);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(STORAGE_KEY);
    }

    router.push("/sign-in?verified=true");
  };

  const handleResend = () => {
    setResendMessage("A new code has been sent to your email.");
    setError("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <p className="text-sm text-slate-500">
          We sent a 6-digit code to your email.
        </p>
        <div className="rounded-3xl border border-slate-200/70 bg-slate-50/80 p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-700">Email</p>
          <p className="mt-2 text-sm text-slate-500">{email || "No email available"}</p>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700" htmlFor="verification-code">
          Verification code
        </label>
        <div className="mt-4 flex items-center justify-center gap-3">
          {digits.map((digit, index) => (
            <input
              key={`verify-${index}`}
              ref={(element) => {
                inputRefs.current[index] = element;
              }}
              id={`verification-code-${index}`}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={digit}
              onChange={(event) => updateDigit(index, event.target.value)}
              onKeyDown={(event) => handleKeyDown(index, event)}
              onPaste={handlePaste}
              className="h-14 w-14 rounded-2xl border-2 border-slate-200/80 bg-white text-center text-xl font-semibold text-slate-900 shadow-sm transition-all duration-300 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
            />
          ))}
        </div>
      </div>

      {error ? (
        <p className="text-sm font-medium text-red-500">{error}</p>
      ) : null}

      {resendMessage ? (
        <p className="text-sm font-medium text-emerald-700">{resendMessage}</p>
      ) : null}

      <Button
        type="submit"
        disabled={!isComplete || isSubmitting}
        size="lg"
        className="group h-14 w-full rounded-full bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-base font-semibold text-white shadow-xl shadow-slate-900/25 transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl hover:shadow-slate-900/30 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-60"
      >
        Verify code
        <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
      </Button>

      <div className="flex flex-col gap-3 text-center text-sm text-slate-500 sm:flex-row sm:justify-between">
        <button
          type="button"
          onClick={handleResend}
          className="font-semibold text-emerald-600 transition-colors hover:text-emerald-700"
        >
          Resend code
        </button>
        <Link
          href="/register"
          className="font-semibold text-emerald-600 transition-colors hover:text-emerald-700"
        >
          Back to register
        </Link>
      </div>
    </form>
  );
}
