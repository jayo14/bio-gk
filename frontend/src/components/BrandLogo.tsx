import Link from 'next/link';

export function BrandLogo({ className = '' }: { className?: string }) {
  return (
    <Link href="/" className={`inline-flex items-center gap-2.5 group select-none ${className}`}>
      <span className="w-8 h-8 rounded-lg bg-dark text-white flex items-center justify-center font-black text-xs tracking-tighter shadow-2xs group-hover:bg-primary transition-colors">
        BG
      </span>
      <span className="font-black text-dark text-lg tracking-tight">
        Bio Gatekeeper
      </span>
    </Link>
  );
}
