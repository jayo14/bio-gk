/* eslint-disable @next/next/no-img-element */
'use client';

import Link from 'next/link';
import { BrandLogo } from '@/components/BrandLogo';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-dark selection:bg-primary/20 selection:text-primary">
      {/* 1. Header / Navigation Bar */}
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo */}
          <BrandLogo />

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/"
              className="relative py-1 text-sm font-bold text-dark group"
            >
              Home
              <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-primary rounded-full mx-auto w-5" />
            </Link>
            <a
              href="#for-creators"
              className="text-sm font-semibold text-secondary-text hover:text-dark transition"
            >
              For Creators
            </a>
            <a
              href="#how-it-works"
              className="text-sm font-semibold text-secondary-text hover:text-dark transition"
            >
              For Supporters
            </a>
            <a
              href="#features"
              className="text-sm font-semibold text-secondary-text hover:text-dark transition"
            >
              Features
            </a>
            <a
              href="#faqs"
              className="text-sm font-semibold text-secondary-text hover:text-dark transition"
            >
              FAQs
            </a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-bold text-dark hover:text-primary transition px-3 py-2"
            >
              Login
            </Link>
            <Button
              asChild
              className="rounded-full px-6 py-2.5 text-sm font-bold shadow-xs hover:shadow-md transition"
            >
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* 2. Hero Section */}
        <section className="pt-10 sm:pt-14 pb-16 lg:pb-24">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: Copy & Actions */}
            <div className="lg:col-span-6 xl:col-span-6 z-10">
              {/* Eyebrow Pill */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold mb-6">
                <Icon name="auto_awesome" fill size={15} />
                <span>Monetize Your Attention</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-[58px] xl:text-[62px] font-black text-dark tracking-tight leading-[1.08] mb-6">
                Get Closer to Your Favourite Creators
              </h1>

              {/* Subheading */}
              <p className="text-secondary-text text-base sm:text-lg leading-relaxed max-w-lg mb-8">
                Pay to send a message, drop a tip, or get VIP access. Support your favourite creators directly.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 mb-10">
                <Button
                  asChild
                  size="lg"
                  className="rounded-full px-8 py-3.5 text-sm font-bold shadow-md hover:shadow-lg transition flex items-center gap-2"
                >
                  <Link href="/signup">
                    Get Started <Icon name="arrow_forward" size={18} />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="rounded-full px-8 py-3.5 text-sm font-bold shadow-2xs hover:bg-[#F3F1FA] border-border text-dark"
                >
                  <Link href="/chioma_x">Explore Creators</Link>
                </Button>
              </div>

              {/* Social Proof */}
              <div className="flex items-center gap-4">
                <div className="flex -space-x-2.5 overflow-hidden">
                  <img
                    className="inline-block h-10 w-10 rounded-full ring-2 ring-surface object-cover shadow-xs"
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
                    alt="Supporter"
                    loading="lazy"
                  />
                  <img
                    className="inline-block h-10 w-10 rounded-full ring-2 ring-surface object-cover shadow-xs"
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80"
                    alt="Supporter"
                    loading="lazy"
                  />
                  <img
                    className="inline-block h-10 w-10 rounded-full ring-2 ring-surface object-cover shadow-xs"
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80"
                    alt="Supporter"
                    loading="lazy"
                  />
                  <img
                    className="inline-block h-10 w-10 rounded-full ring-2 ring-surface object-cover shadow-xs"
                    src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80"
                    alt="Supporter"
                    loading="lazy"
                  />
                  <img
                    className="inline-block h-10 w-10 rounded-full ring-2 ring-surface object-cover shadow-xs"
                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80"
                    alt="Supporter"
                    loading="lazy"
                  />
                </div>
                <p className="text-xs text-secondary-text font-medium leading-snug">
                  Trusted by <strong className="text-dark font-bold">10K+ supporters</strong><br />
                  and creators in Nigeria
                </p>
              </div>
            </div>

            {/* Right Column: Phone Mockup + Floating Feature Cards */}
            <div className="lg:col-span-6 xl:col-span-6 relative flex flex-col items-center">
              {/* Soft Lavender Oval Glow in Background */}
              <div
                aria-hidden="true"
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[460px] h-[340px] sm:h-[460px] bg-primary/10 rounded-full blur-3xl -z-10 pointer-events-none"
              />

              {/* Handwritten Note + Curved Arrow (Top Right) */}
              <div className="hidden sm:block absolute -top-4 right-2 sm:right-6 md:right-10 z-20 text-dark">
                <div className="font-handwriting text-xl sm:text-2xl text-dark leading-none rotate-[-4deg]">
                  <p>Real people.</p>
                  <p>Real support.</p>
                  <p>Real value.</p>
                </div>
                {/* Curved SVG Arrow pointing to phone */}
                <svg
                  className="w-14 h-12 text-dark mt-1 -rotate-6"
                  viewBox="0 0 54 48"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M48 6 C 36 24, 18 28, 6 36" />
                  <path d="M12 28 L 6 36 L 14 42" />
                </svg>
              </div>

              {/* Grid Wrapper for Phone + Floating Cards */}
              <div className="relative w-full max-w-[540px] flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-4">
                {/* Sleek Smartphone Mockup Frame */}
                <div className="relative w-[285px] sm:w-[295px] rounded-[44px] bg-dark p-[7px] shadow-[0_30px_70px_-15px_rgba(23,21,43,0.35)] border-4 border-[#25223A] shrink-0">
                  {/* Dynamic Island / Top Speaker */}
                  <div className="absolute top-3.5 left-1/2 -translate-x-1/2 w-20 h-4 bg-dark rounded-full z-30" />

                  {/* Inner Screen */}
                  <div className="rounded-[37px] bg-surface overflow-hidden border border-border/80 flex flex-col pb-4 text-dark select-none">
                    {/* Status Bar */}
                    <div className="px-6 pt-3 pb-1 flex items-center justify-between text-[11px] font-bold text-dark">
                      <span>9:41</span>
                      <div className="flex items-center gap-1.5">
                        <Icon name="signal_cellular_alt" size={13} />
                        <Icon name="wifi" size={13} />
                        <Icon name="battery_full" size={13} />
                      </div>
                    </div>

                    {/* In-Mockup Nav Bar */}
                    <div className="px-4 py-2 flex items-center justify-between text-secondary-text">
                      <Icon name="arrow_back" size={18} className="cursor-pointer" />
                      <Icon name="share" size={18} className="cursor-pointer" />
                    </div>

                    {/* Creator Profile Section */}
                    <div className="text-center px-4 pt-1 pb-3">
                      <img
                        src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=240&q=80"
                        alt="chioma_x"
                        className="w-16 h-16 rounded-full mx-auto object-cover ring-2 ring-primary/20 shadow-xs"
                      />
                      <div className="mt-2.5 flex items-center justify-center gap-1">
                        <span className="font-black text-sm text-dark">chioma_x</span>
                        <Icon name="verified" fill size={15} className="text-primary" />
                      </div>
                      <p className="text-[10px] text-secondary-text font-medium mt-0.5">
                        Lifestyle Creator • Lagos, Nigeria
                      </p>

                      {/* Primary In-App CTA */}
                      <div className="mt-3">
                        <div className="w-full py-2 px-3 bg-primary text-white text-[11px] font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-2xs">
                          <Icon name="mail" fill size={14} />
                          <span>Send Paid Message</span>
                        </div>
                      </div>
                    </div>

                    {/* Stats Strip */}
                    <div className="grid grid-cols-3 text-center py-2 border-y border-border/60 mx-3.5">
                      <div>
                        <span className="text-[11px] font-black text-dark block">₦24,500</span>
                        <span className="text-[8px] text-secondary-text block">Total Earnings</span>
                      </div>
                      <div className="border-x border-border/60">
                        <span className="text-[11px] font-black text-dark block">12</span>
                        <span className="text-[8px] text-secondary-text block">Interactions</span>
                      </div>
                      <div>
                        <span className="text-[11px] font-black text-dark block">3</span>
                        <span className="text-[8px] text-secondary-text block">Leaderboard Rank</span>
                      </div>
                    </div>

                    {/* Top Supporters Preview */}
                    <div className="px-4 pt-3 pb-1">
                      <div className="flex items-center justify-between text-[10px] font-bold text-dark mb-2">
                        <span>Top Supporters (This Week)</span>
                        <Icon name="crown" fill size={13} className="text-amber-500" />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] py-1 border-b border-border/40">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-secondary-text w-3">1.</span>
                            <img
                              src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=60&q=80"
                              alt="Segun"
                              className="w-4 h-4 rounded-full object-cover"
                            />
                            <span className="font-semibold text-dark">Segun D.</span>
                          </div>
                          <span className="font-black text-dark">₦5,000</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] py-1 border-b border-border/40">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-secondary-text w-3">2.</span>
                            <img
                              src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=60&q=80"
                              alt="Tolu"
                              className="w-4 h-4 rounded-full object-cover"
                            />
                            <span className="font-semibold text-dark">Tolu</span>
                          </div>
                          <span className="font-black text-dark">₦5,000</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] py-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-secondary-text w-3">3.</span>
                            <img
                              src="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=60&q=80"
                              alt="Bayo"
                              className="w-4 h-4 rounded-full object-cover"
                            />
                            <span className="font-semibold text-dark">Bayo</span>
                          </div>
                          <span className="font-black text-dark">₦2,500</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Tips */}
                    <div className="px-4 pt-2">
                      <span className="text-[10px] font-bold text-dark block mb-1.5">Quick Tips</span>
                      <div className="grid grid-cols-3 gap-1.5 text-center">
                        <div className="py-1 rounded-full border border-primary text-primary bg-primary/5 text-[10px] font-bold">
                          ₦2,000
                        </div>
                        <div className="py-1 rounded-full border border-border text-dark text-[10px] font-bold">
                          ₦5,000
                        </div>
                        <div className="py-1 rounded-full border border-border text-dark text-[10px] font-bold">
                          ₦10,000
                        </div>
                      </div>
                    </div>

                    {/* Bottom Home Indicator */}
                    <div className="mt-4 mx-auto w-24 h-1 bg-dark/20 rounded-full" />
                  </div>
                </div>

                {/* 3 Floating Cards (beside mockup on larger screens) */}
                <div className="w-full sm:w-auto flex flex-col gap-3 z-20">
                  <div className="bg-surface/95 backdrop-blur-md rounded-2xl p-3.5 shadow-sm border border-border flex items-center gap-3 hover:border-primary/40 transition">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Icon name="credit_card" size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-dark leading-snug">Support directly</p>
                      <p className="text-[11px] text-secondary-text leading-snug">with a payment</p>
                    </div>
                  </div>

                  <div className="bg-surface/95 backdrop-blur-md rounded-2xl p-3.5 shadow-sm border border-border flex items-center gap-3 hover:border-primary/40 transition">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Icon name="crown" size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-dark leading-snug">Get noticed</p>
                      <p className="text-[11px] text-secondary-text leading-snug">on the leaderboard</p>
                    </div>
                  </div>

                  <div className="bg-surface/95 backdrop-blur-md rounded-2xl p-3.5 shadow-sm border border-border flex items-center gap-3 hover:border-primary/40 transition">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Icon name="forum" size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-dark leading-snug">Access exclusive</p>
                      <p className="text-[11px] text-secondary-text leading-snug">interactions</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Four Feature Highlights Grid */}
        <section id="features" className="py-16 border-t border-border/60">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
            {/* Feature 1: Paid Messages */}
            <div>
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-5">
                <Icon name="bolt" fill size={26} />
              </div>
              <h3 className="font-black text-dark text-lg mb-2">Paid Messages</h3>
              <p className="text-secondary-text text-xs sm:text-sm leading-relaxed">
                Send a priority message and get a response from your favourite creator.
              </p>
            </div>

            {/* Feature 2: Quick Tips */}
            <div>
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-5">
                <Icon name="redeem" size={26} />
              </div>
              <h3 className="font-black text-dark text-lg mb-2">Quick Tips</h3>
              <p className="text-secondary-text text-xs sm:text-sm leading-relaxed">
                Show your support with preset amounts. Simple, fast, and secure.
              </p>
            </div>

            {/* Feature 3: Odogwu Wall */}
            <div>
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-5">
                <Icon name="crown" size={26} />
              </div>
              <h3 className="font-black text-dark text-lg mb-2">Odogwu Wall</h3>
              <p className="text-secondary-text text-xs sm:text-sm leading-relaxed">
                Top supporters get recognised on the creator&apos;s profile. It&apos;s public.
              </p>
            </div>

            {/* Feature 4: WhatsApp Access */}
            <div>
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-5">
                <Icon name="chat" size={26} />
              </div>
              <h3 className="font-black text-dark text-lg mb-2">WhatsApp Access</h3>
              <p className="text-secondary-text text-xs sm:text-sm leading-relaxed">
                Get exclusive chat access (when available) and connect directly.
              </p>
            </div>
          </div>
        </section>

        {/* 4. For Creators Section (Split Grid with Photo Collage) */}
        <section id="for-creators" className="py-20 border-t border-border/60">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left Column: Creator Selling Proposition */}
            <div className="lg:col-span-5">
              <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-4">
                For Creators
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-dark tracking-tight leading-tight mb-4">
                Turn Your Attention Into Income
              </h2>
              <p className="text-secondary-text text-sm sm:text-base leading-relaxed mb-8">
                Set your own prices, receive payments directly, and grow your community with real supporters.
              </p>

              {/* Bullet Checklist */}
              <div className="space-y-3.5 mb-8">
                <div className="flex items-center gap-3">
                  <Icon name="check_circle" fill size={20} className="text-primary shrink-0" />
                  <span className="text-xs sm:text-sm font-bold text-dark">No app download needed</span>
                </div>
                <div className="flex items-center gap-3">
                  <Icon name="check_circle" fill size={20} className="text-primary shrink-0" />
                  <span className="text-xs sm:text-sm font-bold text-dark">Secure payments with Paystack</span>
                </div>
                <div className="flex items-center gap-3">
                  <Icon name="check_circle" fill size={20} className="text-primary shrink-0" />
                  <span className="text-xs sm:text-sm font-bold text-dark">Automatic notifications</span>
                </div>
                <div className="flex items-center gap-3">
                  <Icon name="check_circle" fill size={20} className="text-primary shrink-0" />
                  <span className="text-xs sm:text-sm font-bold text-dark">Full control over your content and privacy</span>
                </div>
              </div>

              {/* Start Button */}
              <Button
                asChild
                size="lg"
                className="rounded-full px-8 py-3.5 text-sm font-bold shadow-md hover:shadow-lg transition inline-flex items-center gap-2"
              >
                <Link href="/signup">
                  Start as a Creator <Icon name="arrow_forward" size={18} />
                </Link>
              </Button>
            </div>

            {/* Right Column: Visual Photo Collage */}
            <div className="lg:col-span-7">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                {/* Tall Featured Image (Left) */}
                <div className="sm:col-span-7 relative h-[420px] sm:h-[480px] rounded-3xl overflow-hidden shadow-sm">
                  <img
                    src="https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=800&q=80"
                    alt="Nigerian Creator with Braids"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {/* Floating Overlay Badge: Verified Creator */}
                  <div className="absolute bottom-4 left-4 right-4 bg-surface/95 backdrop-blur-md border border-border p-3.5 rounded-2xl shadow-md flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Icon name="check_circle" fill size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-xs text-dark leading-tight">Verified Creator</p>
                      <p className="text-[10px] text-secondary-text leading-tight mt-0.5">Real creators. Real people.</p>
                    </div>
                  </div>
                </div>

                {/* Two Stacked Images (Right) */}
                <div className="sm:col-span-5 flex flex-col gap-4">
                  {/* Top Stacked Image with Top Supporters Badge */}
                  <div className="relative h-[200px] sm:h-[232px] rounded-3xl overflow-hidden shadow-sm">
                    <img
                      src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80"
                      alt="Creator smiling"
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute bottom-3 right-3 bg-primary text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1.5">
                      <Icon name="crown" fill size={14} />
                      <span>Top Supporters</span>
                    </div>
                  </div>

                  {/* Bottom Stacked Image: Creator in Sunglasses */}
                  <div className="relative h-[200px] sm:h-[232px] rounded-3xl overflow-hidden shadow-sm">
                    <img
                      src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80"
                      alt="Creator man in black hoodie"
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. How It Works Section */}
        <section id="how-it-works" className="py-20 border-t border-border/60">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-3">
              How It Works
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-dark tracking-tight mb-3">
              Simple. Secure. Seamless.
            </h2>
            <p className="text-secondary-text text-sm sm:text-base leading-relaxed">
              Get started in minutes and start supporting your favourite creators.
            </p>
          </div>

          {/* 4 Steps Timeline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {/* Step 1 */}
            <div className="relative flex flex-col items-start">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-black flex items-center justify-center shrink-0">
                  1
                </span>
                <Icon name="person" size={26} className="text-dark" />
              </div>
              <h4 className="font-bold text-dark text-base mt-4">Visit a Creator&apos;s Link</h4>
              <p className="text-secondary-text text-xs leading-relaxed mt-2">
                Open their bio link on Instagram, TikTok, Snapchat or WhatsApp.
              </p>
              {/* Desktop arrow connector */}
              <div className="hidden lg:block absolute top-1 -right-4 text-border">
                <Icon name="arrow_forward" size={18} className="text-secondary-text/40" />
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative flex flex-col items-start">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-black flex items-center justify-center shrink-0">
                  2
                </span>
                <Icon name="credit_card" size={26} className="text-dark" />
              </div>
              <h4 className="font-bold text-dark text-base mt-4">Make a Payment</h4>
              <p className="text-secondary-text text-xs leading-relaxed mt-2">
                Choose your preferred interaction and complete payment securely with Paystack.
              </p>
              {/* Desktop arrow connector */}
              <div className="hidden lg:block absolute top-1 -right-4 text-border">
                <Icon name="arrow_forward" size={18} className="text-secondary-text/40" />
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative flex flex-col items-start">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-black flex items-center justify-center shrink-0">
                  3
                </span>
                <Icon name="chat" size={26} className="text-dark" />
              </div>
              <h4 className="font-bold text-dark text-base mt-4">Get Your Access</h4>
              <p className="text-secondary-text text-xs leading-relaxed mt-2">
                Your message is delivered, or you get access (where available).
              </p>
              {/* Desktop arrow connector */}
              <div className="hidden lg:block absolute top-1 -right-4 text-border">
                <Icon name="arrow_forward" size={18} className="text-secondary-text/40" />
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex flex-col items-start">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-black flex items-center justify-center shrink-0">
                  4
                </span>
                <Icon name="crown" size={26} className="text-dark" />
              </div>
              <h4 className="font-bold text-dark text-base mt-4">Enjoy the Experience</h4>
              <p className="text-secondary-text text-xs leading-relaxed mt-2">
                Get a response, show your support, and see your name on the leaderboard (if public).
              </p>
            </div>
          </div>
        </section>

        {/* 6. Ready to Get Started Bottom Banner */}
        <section className="my-16">
          <div className="rounded-[2.2rem] bg-dark text-white p-8 sm:p-12 lg:p-14 relative overflow-hidden shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-8">
            {/* Background Mesh Lines Decoration */}
            <div
              aria-hidden="true"
              className="absolute right-0 bottom-0 top-0 w-2/3 pointer-events-none opacity-20"
            >
              <svg viewBox="0 0 400 200" fill="none" className="w-full h-full object-cover">
                <path d="M0 200 C 150 150, 250 80, 400 50" stroke="currentColor" strokeWidth="1.5" className="text-primary" />
                <path d="M0 200 C 120 120, 280 60, 400 20" stroke="currentColor" strokeWidth="1.5" className="text-primary" />
                <path d="M50 200 C 180 140, 300 40, 400 0" stroke="currentColor" strokeWidth="1.5" className="text-primary" />
              </svg>
            </div>

            {/* Left Content */}
            <div className="relative z-10">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/80 mb-2">
                <Icon name="star" fill size={14} className="text-amber-400" />
                <span>Ready to Get Started?</span>
              </div>
              <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Support. Connect. Be Seen.
              </h3>
              <p className="text-secondary-text text-xs sm:text-sm mt-2">
                Join thousands of fans already supporting their favourite creators.
              </p>
            </div>

            {/* Right Action Button */}
            <div className="relative z-10 shrink-0">
              <Button
                asChild
                size="lg"
                className="rounded-full px-8 py-3.5 text-sm font-bold shadow-md hover:shadow-lg transition flex items-center gap-2 bg-primary hover:bg-primary-hover text-white"
              >
                <Link href="/signup">
                  Get Started <Icon name="arrow_forward" size={18} />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* 7. Footer */}
      <footer id="faqs" className="border-t border-border/60 bg-surface/50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-border/60">
            {/* Logo */}
            <BrandLogo />

            {/* Navigation Links */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm font-semibold text-secondary-text">
              <Link href="/" className="hover:text-dark transition">Home</Link>
              <a href="#for-creators" className="hover:text-dark transition">For Creators</a>
              <a href="#how-it-works" className="hover:text-dark transition">For Supporters</a>
              <a href="#features" className="hover:text-dark transition">Features</a>
              <a href="#faqs" className="hover:text-dark transition">FAQs</a>
            </div>

            {/* Social Icons */}
            <div className="flex items-center gap-4 text-dark/70">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="hover:text-primary transition"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a
                href="https://tiktok.com"
                target="_blank"
                rel="noreferrer"
                aria-label="TikTok"
                className="hover:text-primary transition"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                </svg>
              </a>
              <a
                href="https://x.com"
                target="_blank"
                rel="noreferrer"
                aria-label="X"
                className="hover:text-primary transition"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a
                href="https://whatsapp.com"
                target="_blank"
                rel="noreferrer"
                aria-label="WhatsApp"
                className="hover:text-primary transition"
              >
                <Icon name="chat" size={17} />
              </a>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-secondary-text">
            <span>© 2025 Bio Gatekeeper. All rights reserved.</span>
            <span>Built for creators. Powered by community.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
