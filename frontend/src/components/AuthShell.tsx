'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { BrandLogo } from '@/components/BrandLogo';
import { Icon } from '@/components/ui/icon';

export function AuthShell({
  title,
  description,
  illustration,
  backHref = '/',
  centerHeader = false,
  children,
  footer,
  legalNote,
}: {
  title: string;
  description: string;
  illustration?: ReactNode;
  backHref?: string;
  centerHeader?: boolean;
  children: ReactNode;
  footer?: ReactNode;
  legalNote?: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-between selection:bg-primary/20 selection:text-primary">
      {/* Top Mobile Bar */}
      <header className="w-full max-w-md mx-auto px-4 sm:px-6 pt-4 pb-2 flex items-center justify-between">
        <Link
          href={backHref}
          className="w-9 h-9 -ml-2 rounded-full flex items-center justify-center text-dark hover:text-primary hover:bg-surface transition"
          aria-label="Go back"
        >
          <Icon name="arrow_back" size={20} />
        </Link>
        <BrandLogo />
        <div className="w-9" aria-hidden="true" />
      </header>

      {/* Main Form Container */}
      <main className="w-full max-w-md mx-auto px-5 sm:px-6 py-6 flex-1 flex flex-col justify-center">
        {illustration && (
          <div className="flex justify-center mb-6">
            {illustration}
          </div>
        )}

        {/* Header */}
        <div className={`mb-6 ${centerHeader ? 'text-center' : 'text-left'}`}>
          <h1 className="text-2xl font-black text-dark tracking-tight leading-tight">
            {title}
          </h1>
          <p className="text-xs text-secondary-text mt-1.5 leading-relaxed">
            {description}
          </p>
        </div>

        {/* Form Body */}
        {children}

        {/* Footer */}
        {footer && (
          <div className="mt-6 text-center text-xs text-secondary-text">
            {footer}
          </div>
        )}

        {/* Legal Disclaimer */}
        {legalNote && (
          <div className="mt-5 text-center text-[10px] text-secondary-text/80 leading-relaxed">
            {legalNote}
          </div>
        )}
      </main>

      {/* Subtle bottom spacing/watermark */}
      <footer className="w-full max-w-md mx-auto py-4 text-center text-[10px] text-secondary-text/60">
        © 2025 Bio Gatekeeper · Protected & Secured
      </footer>
    </div>
  );
}
