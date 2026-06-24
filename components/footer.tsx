"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Mail,
  Send,
  CheckCircle,
  Youtube,
  Facebook,
  Instagram,
  Linkedin,
  ArrowUpRight,
} from "lucide-react";

// Custom X (Twitter) icon
function XIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

// Custom Telegram icon
function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

const footerLinks = {
  invest: {
    title: "Invest",
    links: [
      { label: "About Us", href: "#" },
      { label: "Properties", href: "/properties" },
      { label: "Exchange", href: "#" },
      { label: "Press Kit", href: "#" },
      { label: "Listing Application", href: "#" },
      { label: "Business Partnership", href: "#" },
    ],
  },
  legal: {
    title: "Legal",
    links: [
      { label: "Key Risks", href: "#" },
      { label: "Property Documents", href: "#" },
      { label: "Terms of Use", href: "#" },
      { label: "Privacy Policy", href: "#" },
      { label: "Cookies", href: "#" },
    ],
  },
  help: {
    title: "Help",
    links: [
      { label: "Info Center", href: "#" },
      { label: "F.A.Q.", href: "#" },
      { label: "Support", href: "#" },
      { label: "How it works?", href: "/#how-it-works" },
    ],
  },
};

const socialLinks = [
  { label: "YouTube", href: "https://youtube.com", icon: Youtube },
  { label: "Telegram", href: "https://telegram.org", icon: TelegramIcon },
  { label: "Facebook", href: "https://facebook.com", icon: Facebook },
  { label: "X", href: "https://x.com", icon: XIcon },
  { label: "Instagram", href: "https://instagram.com", icon: Instagram },
  { label: "LinkedIn", href: "https://linkedin.com", icon: Linkedin },
];

export function Footer() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email");
      return;
    }

    // TODO: Connect to backend/newsletter service
    setIsSubmitted(true);
    setEmail("");

    // Reset success message after 5 seconds
    setTimeout(() => {
      setIsSubmitted(false);
    }, 5000);
  };

  return (
    <footer className="relative overflow-hidden border-t border-border/40 bg-gradient-to-b from-slate-50/80 to-white">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.03),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(20,184,166,0.03),transparent_50%)]" />

      {/* Main Footer Content */}
      <div className="relative mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-24">
        <div className="grid gap-16 lg:grid-cols-12 lg:gap-12">
          {/* Left Side - Brand & Newsletter */}
          <div className="lg:col-span-5">
            {/* Logo with elegant styling */}
            <Link href="/" className="group inline-block">
              <h2 className="font-sans text-4xl font-bold tracking-tight text-slate-900 transition-colors group-hover:text-slate-700">
                inwestim
              </h2>
            </Link>

            {/* Brand Text with refined typography */}
            <p className="mt-8 text-xl font-medium leading-relaxed text-slate-800">
              Discover top-performing properties for{" "}
              <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                maximum income.
              </span>
            </p>

            {/* Description with better spacing */}
            <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-slate-500">
              Join thousands of global investors using Inwestim to tap into
              high-growth, income-generating properties - starting from just USD
              100.
            </p>

            {/* Premium Email Input */}
            <form onSubmit={handleSubmit} className="mt-10">
              <div className="group relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-5">
                  <Mail className="h-5 w-5 text-slate-400 transition-colors group-focus-within:text-emerald-500" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  placeholder="Enter your email"
                  className="h-14 w-full rounded-2xl border-2 border-slate-200/80 bg-white pl-14 pr-16 text-[15px] text-slate-900 shadow-sm placeholder:text-slate-400 transition-all duration-300 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 hover:border-slate-300"
                />
                <button
                  type="submit"
                  className="absolute inset-y-2 right-2 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/30 hover:scale-105 active:scale-95"
                  aria-label="Subscribe"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <p className="mt-3 text-sm font-medium text-red-500">{error}</p>
              )}

              {/* Success Message */}
              {isSubmitted && (
                <div className="mt-4 flex items-center gap-2.5 text-sm font-medium text-emerald-600">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100">
                    <CheckCircle className="h-3.5 w-3.5" />
                  </div>
                  <span>Thanks! We&apos;ll keep you updated.</span>
                </div>
              )}
            </form>
          </div>

          {/* Right Side - Link Columns with elegant spacing */}
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:col-span-7 lg:justify-items-end">
            {/* Invest Column */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-900">
                {footerLinks.invest.title}
              </h3>
              <ul className="mt-6 space-y-4">
                {footerLinks.invest.links.map((link, index) => (
                  <li key={`invest-${link.label}-${index}`}>
                    <Link
                      href={link.href}
                      className="group/link inline-flex items-center gap-1 text-[15px] text-slate-500 transition-all duration-200 hover:text-slate-900"
                    >
                      <span className="relative">
                        {link.label}
                        <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-emerald-500 transition-all duration-300 group-hover/link:w-full" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal Column */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-900">
                {footerLinks.legal.title}
              </h3>
              <ul className="mt-6 space-y-4">
                {footerLinks.legal.links.map((link, index) => (
                  <li key={`legal-${link.label}-${index}`}>
                    <Link
                      href={link.href}
                      className="group/link inline-flex items-center gap-1 text-[15px] text-slate-500 transition-all duration-200 hover:text-slate-900"
                    >
                      <span className="relative">
                        {link.label}
                        <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-emerald-500 transition-all duration-300 group-hover/link:w-full" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Help Column */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-900">
                {footerLinks.help.title}
              </h3>
              <ul className="mt-6 space-y-4">
                {footerLinks.help.links.map((link, index) => (
                  <li key={`help-${link.label}-${index}`}>
                    <Link
                      href={link.href}
                      className="group/link inline-flex items-center gap-1 text-[15px] text-slate-500 transition-all duration-200 hover:text-slate-900"
                    >
                      <span className="relative">
                        {link.label}
                        <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-emerald-500 transition-all duration-300 group-hover/link:w-full" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Elegant Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl border-t border-slate-200/80" />
        </div>
        <div className="relative flex justify-center">
          <div className="h-2 w-24 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="relative">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 px-6 py-8 sm:flex-row lg:px-8">
          {/* Copyright with refined styling */}
          <p className="text-sm text-slate-500">
            <span className="font-medium text-slate-700">Inwestim</span>{" "}
            © {new Date().getFullYear()} | All Rights Reserved
          </p>

          {/* Premium Social Icons */}
          <div className="flex items-center gap-3">
            {socialLinks.map((social) => (
              <Link
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-500 shadow-sm transition-all duration-300 hover:border-emerald-200 hover:bg-gradient-to-br hover:from-emerald-50 hover:to-teal-50 hover:text-emerald-600 hover:shadow-md hover:shadow-emerald-500/10 hover:-translate-y-0.5"
                aria-label={social.label}
              >
                <social.icon className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
