import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function Home() {
  return (
    <main className="min-h-screen px-4 py-6 sm:px-8 bg-background flex flex-col justify-between">
      {/* Navigation */}
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between py-2">
        <Link href="/" className="text-2xl font-black tracking-tight text-dark">
          gate<span className="text-primary">.</span>
        </Link>
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/signup">Create your page ↗</Link>
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="mx-auto grid w-full max-w-6xl items-center gap-12 py-12 md:py-20 md:grid-cols-12">
        <div className="md:col-span-7">
          <Badge variant="secondary" className="mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-primary mr-1.5" />
            Direct Monetization for Nigerian Creators
          </Badge>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-dark leading-[1.05]">
            Make your inbox work <span className="text-primary">for you.</span>
          </h1>
          <p className="mt-6 max-w-lg text-base sm:text-lg leading-relaxed text-secondary-text">
            A clean bio link for independent creators to receive paid priority messages and quick tips. In-app checkout via Paystack with zero app downloads.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link href="/signup">Claim your free handle ↗</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/login">Creator Sign In</Link>
            </Button>
          </div>
          <div className="mt-6 flex items-center gap-6 text-xs text-secondary-text">
            <span>✓ Paystack Automated Splits</span>
            <span>✓ Odogwu Supporter Wall</span>
            <span>✓ No App Install Required</span>
          </div>
        </div>

        {/* Live Preview Card */}
        <div className="md:col-span-5 flex justify-center">
          <Card className="w-full max-w-sm p-6 shadow-md border-border bg-surface">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-primary text-primary-foreground text-2xl font-black flex items-center justify-center shadow-xs">
                CX
              </div>
              <div className="mt-4 flex items-center gap-1.5">
                <p className="text-xl font-black text-dark">Chioma X.</p>
                <span className="text-success text-xs font-bold" title="Verified Creator">✓</span>
              </div>
              <p className="text-xs font-semibold text-secondary-text mt-0.5">@chioma_x · Nigeria</p>
              <p className="mt-3 text-xs leading-relaxed text-secondary-text max-w-[260px]">
                Lifestyle & Lagos moments. For serious enquiries and thoughtful messages. ✨
              </p>
            </div>

            <div className="mt-6 space-y-3">
              <div className="rounded-2xl border border-border bg-background p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-dark">Priority message</p>
                    <p className="text-[11px] text-secondary-text mt-0.5">Guaranteed review within 24h</p>
                  </div>
                  <span className="text-sm font-black text-primary">₦2,500</span>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-secondary-text mb-2 text-center">
                  Quick Tips
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {['₦2,000', '₦5,000', '₦10,000'].map((amt) => (
                    <div
                      key={amt}
                      className="rounded-xl border border-border bg-background py-2 text-center text-xs font-extrabold text-dark"
                    >
                      {amt}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <p className="mt-5 text-center text-[10px] text-secondary-text">
              🔒 Powered by Paystack · 90% direct to creator
            </p>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="mx-auto w-full max-w-6xl border-t border-border py-6 text-xs text-secondary-text flex flex-col sm:flex-row items-center justify-between gap-4">
        <span>BIO GATEKEEPER · Built for creators, designed for trust.</span>
        <div className="flex items-center gap-4">
          <Link href="/login" className="hover:text-dark transition">Login</Link>
          <Link href="/signup" className="hover:text-dark transition">Get Started</Link>
        </div>
      </footer>
    </main>
  );
}
