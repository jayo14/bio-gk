'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiRequest, PublicCreator, LeaderboardResponse, SupporterEntry } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { BrandLogo } from '@/components/BrandLogo';
import { Icon } from '@/components/ui/icon';
import { toast } from '@/components/ui/sonner';

export default function CreatorProfilePage() {
  const params = useParams();
  const username = typeof params?.username === 'string' ? params.username.toLowerCase() : '';

  const [creator, setCreator] = useState<PublicCreator | null>(null);
  const [leaderboard, setLeaderboard] = useState<SupporterEntry[]>([]);
  const [leaderboardPeriod, setLeaderboardPeriod] = useState<'weekly' | 'monthly' | 'all_time'>('weekly');
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  // Interaction Form State
  const [interactionType, setInteractionType] = useState<'priority_dm' | 'public_tip' | 'whatsapp_pass'>('priority_dm');
  const [senderName, setSenderName] = useState('');
  const [senderContact, setSenderContact] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [selectedTipAmountKobo, setSelectedTipAmountKobo] = useState<number>(200000);
  const [customTipNaira, setCustomTipNaira] = useState<string>('');
  const [isPublicAttribution, setIsPublicAttribution] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch Creator Profile
  useEffect(() => {
    if (!username) return;
    let active = true;
    setLoading(true);

    apiRequest<PublicCreator>(`/creators/${encodeURIComponent(username)}/`)
      .then((data) => {
        if (!active) return;
        setCreator(data);
        if (data.tip_presets_kobo && data.tip_presets_kobo.length > 0) {
          setSelectedTipAmountKobo(data.tip_presets_kobo[0]);
        }
        setLeaderboardPeriod(data.leaderboard_period || 'weekly');
      })
      .catch(() => {
        if (active) setNotFound(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [username]);

  // Fetch Leaderboard when period or creator changes
  useEffect(() => {
    if (!username || notFound) return;
    let active = true;

    apiRequest<LeaderboardResponse>(`/creators/${encodeURIComponent(username)}/leaderboard/?period=${leaderboardPeriod}`)
      .then((data) => {
        if (active) setLeaderboard(data.leaderboard || []);
      })
      .catch(() => {
        if (active) setLeaderboard([]);
      });

    return () => {
      active = false;
    };
  }, [username, leaderboardPeriod, notFound]);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success('Profile link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!senderName.trim()) {
      const msg = 'Please enter your name or a pseudonym.';
      setError(msg);
      toast.error(msg);
      return;
    }

    if (interactionType === 'priority_dm') {
      if (!messageBody.trim()) {
        const msg = 'Please enter your priority message.';
        setError(msg);
        toast.error(msg);
        return;
      }
      if (messageBody.length > 2000) {
        const msg = 'Message cannot exceed 2,000 characters.';
        setError(msg);
        toast.error(msg);
        return;
      }
    }

    let finalAmountKobo = creator ? creator.min_message_fee_kobo : 250000;
    if (interactionType === 'public_tip') {
      if (customTipNaira && !isNaN(Number(customTipNaira))) {
        finalAmountKobo = Math.round(Number(customTipNaira) * 100);
      } else {
        finalAmountKobo = selectedTipAmountKobo;
      }

      if (finalAmountKobo < 10000) {
        const msg = 'Minimum tip amount is ₦100.';
        setError(msg);
        toast.error(msg);
        return;
      }
    }

    setSubmitting(true);
    toast.info('Initializing secure Paystack checkout…');
    try {
      const response = await apiRequest<{ authorization_url: string; reference: string }>('/payments/initialize/', {
        method: 'POST',
        body: JSON.stringify({
          username,
          sender_name: senderName.trim(),
          sender_contact: senderContact.trim(),
          message_body: interactionType === 'priority_dm' ? messageBody.trim() : '',
          interaction_type: interactionType,
          amount_kobo: finalAmountKobo,
          public_attribution: isPublicAttribution,
        }),
      });

      if (response.authorization_url) {
        window.location.href = response.authorization_url;
      } else {
        throw new Error('Unable to start payment session. Please try again.');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not initialize payment.';
      setError(msg);
      toast.error(msg);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen px-4 py-16 flex flex-col items-center justify-center bg-background">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-bold text-secondary-text">Loading creator profile…</p>
      </main>
    );
  }

  if (notFound || !creator) {
    return (
      <main className="min-h-screen px-4 py-8 max-w-md mx-auto flex flex-col justify-between bg-background">
        <header className="flex items-center justify-between">
          <BrandLogo />
        </header>

        <div className="flex flex-col items-center text-center my-auto px-4">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
              <Icon name="sentiment_dissatisfied" size={32} />
            </div>
          </div>
          <h1 className="text-2xl font-black text-dark tracking-tight">Creator not found</h1>
          <p className="mt-2 text-xs text-secondary-text max-w-xs leading-relaxed">
            The profile you&apos;re looking for might have been removed or doesn&apos;t exist.
          </p>
          <div className="mt-8 w-full flex flex-col gap-2.5">
            <Button asChild className="w-full h-11 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary-hover shadow-xs">
              <Link href="/">Go Back Home</Link>
            </Button>
            <Button asChild variant="outline" className="w-full h-11 rounded-xl border-border text-xs font-bold text-dark">
              <Link href={`/signup?username=${encodeURIComponent(username)}`}>
                Claim @{username}
              </Link>
            </Button>
          </div>
        </div>

        <footer className="text-center text-[10px] text-secondary-text/60 py-4">
          © 2025 Bio Gatekeeper
        </footer>
      </main>
    );
  }

  const tipPresets = creator.tip_presets_kobo && creator.tip_presets_kobo.length > 0
    ? creator.tip_presets_kobo
    : [200000, 500000, 1000000];

  const currentAmountKobo = interactionType === 'priority_dm'
    ? creator.min_message_fee_kobo
    : (customTipNaira ? Math.round(Number(customTipNaira) * 100) : selectedTipAmountKobo);

  const formattedAmount = `₦${(currentAmountKobo / 100).toLocaleString()}`;

  return (
    <main className="min-h-screen px-4 py-6 sm:py-10 max-w-lg mx-auto bg-background">
      {/* Top Header */}
      <header className="flex items-center justify-between mb-6">
        <BrandLogo />
        <Button
          onClick={handleCopyLink}
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
        >
          {copied ? (
            <>
              <Icon name="check" size={15} className="text-success" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Icon name="share" size={15} />
              <span>Share link</span>
            </>
          )}
        </Button>
      </header>

      {/* Creator Profile Header Card */}
      <Card className="p-6 sm:p-7 border-border bg-surface shadow-xs">
        <div className="flex items-center gap-4">
          {creator.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={creator.avatar_url}
              alt={creator.display_name}
              className="w-20 h-20 rounded-full object-cover border border-border"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-primary text-primary-foreground text-2xl font-black flex items-center justify-center shrink-0 shadow-xs">
              {creator.display_name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase() || 'CX'}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-black tracking-tight text-dark truncate">
                {creator.display_name}
              </h1>
              {creator.is_verified && (
                <Badge variant="success" className="text-[10px] gap-1">
                  <Icon name="verified" fill size={13} />
                  <span>Verified</span>
                </Badge>
              )}
            </div>
            <p className="text-xs font-semibold text-secondary-text mt-0.5">
              @{creator.username} · Nigeria
            </p>
          </div>
        </div>

        {creator.bio_text && (
          <p className="mt-4 text-xs leading-relaxed text-dark break-words">
            {creator.bio_text}
          </p>
        )}

        {/* Interaction Type Tabs */}
        <div className="mt-6 grid grid-cols-2 gap-2 p-1 bg-background rounded-2xl border border-border">
          <button
            type="button"
            onClick={() => setInteractionType('priority_dm')}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition ${
              interactionType === 'priority_dm'
                ? 'bg-surface text-dark shadow-xs'
                : 'text-secondary-text hover:text-dark'
            }`}
          >
            Priority Message
          </button>
          <button
            type="button"
            onClick={() => setInteractionType('public_tip')}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition ${
              interactionType === 'public_tip'
                ? 'bg-surface text-dark shadow-xs'
                : 'text-secondary-text hover:text-dark'
            }`}
          >
            Leave a Tip
          </button>
        </div>

        {/* Payment / Message Form */}
        <form onSubmit={handleCheckout} className="mt-5 space-y-4">
          {error && (
            <div className="p-3 bg-error/10 border border-error/20 text-error text-xs rounded-xl font-medium" role="alert">
              {error}
            </div>
          )}

          {interactionType === 'priority_dm' && (
            <div className="p-4 bg-background rounded-2xl border border-border">
              <div className="flex items-center justify-between text-xs font-bold mb-1">
                <span className="text-secondary-text">Creator Rate</span>
                <span className="text-primary text-sm font-black">
                  ₦{(creator.min_message_fee_kobo / 100).toLocaleString()}
                </span>
              </div>
              <p className="text-[11px] text-secondary-text leading-relaxed">
                Send a guaranteed priority message. Reviewed directly by @{creator.username}.
              </p>
            </div>
          )}

          {interactionType === 'public_tip' && (
            <div className="space-y-2">
              <Label className="text-secondary-text uppercase tracking-wider text-[10px]">
                Choose Tip Amount
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {tipPresets.map((amountKobo) => (
                  <button
                    key={amountKobo}
                    type="button"
                    onClick={() => {
                      setSelectedTipAmountKobo(amountKobo);
                      setCustomTipNaira('');
                    }}
                    className={`py-2.5 text-center text-xs font-bold rounded-xl border transition ${
                      selectedTipAmountKobo === amountKobo && !customTipNaira
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-surface border-border text-dark hover:bg-background'
                    }`}
                  >
                    ₦{(amountKobo / 100).toLocaleString()}
                  </button>
                ))}
              </div>
              <Input
                type="number"
                min="100"
                placeholder="Or enter custom amount in ₦"
                value={customTipNaira}
                onChange={(e) => setCustomTipNaira(e.target.value)}
                className="text-xs h-10"
              />
            </div>
          )}

          {/* Sender Details */}
          <div className="space-y-1.5">
            <Label htmlFor="sender_name">
              Your Name or Alias <span className="text-primary">*</span>
            </Label>
            <Input
              id="sender_name"
              type="text"
              required
              maxLength={80}
              placeholder="e.g. Tunde or Anonymous"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sender_contact">
              Your Email or Phone <span className="text-secondary-text font-normal">(for payment receipt)</span>
            </Label>
            <Input
              id="sender_contact"
              type="text"
              placeholder="you@example.com or 08012345678"
              value={senderContact}
              onChange={(e) => setSenderContact(e.target.value)}
            />
          </div>

          {interactionType === 'priority_dm' && (
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label htmlFor="message_body">
                  Your Message <span className="text-primary">*</span>
                </Label>
                <span className="text-[10px] text-secondary-text">{messageBody.length}/2,000</span>
              </div>
              <Textarea
                id="message_body"
                required
                rows={4}
                maxLength={2000}
                placeholder="Write your thoughtful message here…"
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
              />
            </div>
          )}

          {/* Public Supporter Attribution Toggle */}
          <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-background border border-border cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isPublicAttribution}
              onChange={(e) => setIsPublicAttribution(e.target.checked)}
              className="mt-0.5 rounded text-primary focus:ring-primary accent-primary"
            />
            <span className="text-xs text-dark leading-snug">
              <strong className="block font-bold">Appear on the Odogwu Leaderboard</strong>
              Your name and support amount will be celebrated publicly. Your message text stays 100% private.
            </span>
          </label>

          {/* Pay Button */}
          <Button
            type="submit"
            disabled={submitting}
            className="w-full h-12 text-sm"
          >
            {submitting ? (
              'Redirecting to Paystack…'
            ) : (
              <span className="flex items-center justify-center gap-1.5">
                <span>Pay {formattedAmount} via Paystack</span>
                <Icon name="arrow_forward" size={16} />
              </span>
            )}
          </Button>

          <p className="text-center text-[10px] text-secondary-text leading-relaxed flex items-center justify-center gap-1">
            <Icon name="lock" size={12} className="text-secondary-text" />
            <span>Secured by Paystack. Cards, Bank Transfer, USSD & Apple Pay.</span>
          </p>
        </form>
      </Card>

      {/* Odogwu Leaderboard (Supporter Wall) */}
      {creator.public_supporter_wall_enabled && (
        <Card className="mt-8 p-6 border-border bg-surface shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-base font-black tracking-tight text-dark">Odogwu Wall</h2>
                <Icon name="crown" fill size={16} className="text-amber-500" />
              </div>
              <p className="text-[11px] text-secondary-text">Top supporters of @{creator.username}</p>
            </div>
            {/* Period Filters */}
            <div className="flex items-center gap-1 bg-background p-1 rounded-xl border border-border text-[11px] font-bold">
              {(['weekly', 'monthly', 'all_time'] as const).map((period) => (
                <button
                  key={period}
                  type="button"
                  onClick={() => setLeaderboardPeriod(period)}
                  className={`px-2.5 py-1 rounded-lg capitalize transition ${
                    leaderboardPeriod === period ? 'bg-surface text-dark shadow-xs' : 'text-secondary-text'
                  }`}
                >
                  {period === 'all_time' ? 'All' : period === 'weekly' ? 'Week' : 'Month'}
                </button>
              ))}
            </div>
          </div>

          {leaderboard.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-border rounded-2xl p-4 bg-background/50">
              <p className="text-xs font-semibold text-dark">No public supporters on the wall yet.</p>
              <p className="text-[11px] text-secondary-text mt-1">Be the first to show support above!</p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {leaderboard.map((item) => (
                <div key={`${item.rank}-${item.supporter_name}`} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                        item.rank === 1
                          ? 'bg-primary text-primary-foreground shadow-xs'
                          : item.rank === 2
                          ? 'bg-dark text-white'
                          : item.rank === 3
                          ? 'bg-secondary-text text-white'
                          : 'bg-background text-secondary-text border border-border'
                      }`}
                    >
                      {item.rank}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-dark">{item.supporter_name}</p>
                      <p className="text-[10px] text-secondary-text">
                        {item.interaction_count} contribution{item.interaction_count > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-primary">
                    ₦{(item.total_amount_kobo / 100).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Footer */}
      <footer className="mt-8 text-center text-xs text-secondary-text pb-8">
        <p>Private messages stay strictly private.</p>
        <p className="mt-1">
          Powered by{' '}
          <Link href="/" className="font-bold text-dark hover:text-primary transition underline underline-offset-2">
            Bio Gatekeeper
          </Link>
        </p>
      </footer>
    </main>
  );
}
