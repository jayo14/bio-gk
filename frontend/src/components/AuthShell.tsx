import Link from 'next/link';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <main className="min-h-screen px-4 py-6 sm:px-8 bg-background flex flex-col justify-between">
      {/* Top Bar */}
      <div className="max-w-5xl w-full mx-auto flex items-center justify-between pb-4">
        <Link href="/" className="text-2xl font-black tracking-tight text-dark">
          gate<span className="text-primary">.</span>
        </Link>
        <Link
          href="/"
          className="text-xs font-bold text-secondary-text hover:text-dark transition flex items-center gap-1"
        >
          Back to home <span aria-hidden="true" className="text-primary">↗</span>
        </Link>
      </div>

      {/* Main Container */}
      <div className="max-w-5xl w-full mx-auto my-4 grid md:grid-cols-12 rounded-[2rem] border border-border overflow-hidden bg-surface shadow-xs">
        {/* Left Side: Brand Story Banner */}
        <aside className="md:col-span-5 bg-dark text-white p-8 sm:p-12 flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary-foreground bg-primary/20 border border-primary/30 px-3 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              Creator-First Gateway
            </span>
            <h2 className="text-3xl sm:text-4xl font-black mt-6 tracking-tight leading-tight text-white">
              Your attention.<br />
              <span className="text-primary-foreground/90 font-serif italic">Your rules.</span>
            </h2>
            <p className="mt-4 text-xs text-white/70 leading-relaxed max-w-xs">
              One transparent link for supporters who want to reach you with intention. No extra apps. No spam. Direct payouts to your bank.
            </p>
          </div>

          <div className="mt-12 pt-6 border-t border-white/10 relative z-10 text-[11px] text-white/60">
            Built for Nigerian creators, influencers & builders.
          </div>

          {/* Subtle geometric circles */}
          <div className="absolute -right-20 -bottom-20 w-64 h-64 rounded-full border border-white/5 pointer-events-none" />
          <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-primary/10 pointer-events-none" />
        </aside>

        {/* Right Side: Auth Form */}
        <section className="md:col-span-7 p-6 sm:p-12 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto">
            <div className="mb-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1.5">
                {eyebrow}
              </p>
              <h1 className="text-2xl sm:text-3xl font-black text-dark tracking-tight">
                {title}
              </h1>
              <p className="text-xs text-secondary-text mt-1.5 leading-relaxed">
                {description}
              </p>
            </div>

            {children}

            <div className="mt-6 pt-5 border-t border-border text-center text-xs text-secondary-text">
              {footer}
            </div>

            <p className="mt-5 text-center text-[10px] text-secondary-text/70">
              By continuing, you agree to our Terms and Privacy Policy.
            </p>
          </div>
        </section>
      </div>

      <div className="max-w-5xl w-full mx-auto py-2 text-center text-[11px] text-secondary-text">
        Bio Gatekeeper · The creator gateway
      </div>
    </main>
  );
}

export function AuthInput({
  label,
  id,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const inputId = id || props.name;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={inputId}>{label}</Label>
      <Input id={inputId} className={className} {...props} />
    </div>
  );
}
