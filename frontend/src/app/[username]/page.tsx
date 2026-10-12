'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiRequest, PublicCreator, LeaderboardResponse, SupporterEntry } from '@/lib/api';

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
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!senderName.trim()) {
      setError('Please enter your name or a pseudonym.');
      return;
    }

    if (interactionType === 'priority_dm') {
      if (!messageBody.trim()) {
        setError('Please enter your priority message.');
        return;
      }
      if (messageBody.length > 2000) {
        setError('Message cannot exceed 2,000 characters.');
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
        setError('Minimum tip amount is ₦100.');
        return;
      }
    }

    setSubmitting(true);
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
        // Redirect to Paystack secure checkout
        window.location.href = response.authorization_url;
      } else {
        throw new Error('Unable to start payment session. Please try again.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not initialize payment.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen px-4 py-16 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#7c351c] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm font-semibold text-[#777067]">Loading creator profile…</p>
      </main>
    );
  }

  if (notFound || !creator) {
    return (
      <main className="min-h-screen px-5 py-24 flex items-center justify-center">
        <div className="max-w-md w-full bg-white border border-[#e6dfd5] rounded-3xl p-8 text-center shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-[#7c351c]">Bio Gatekeeper</p>
          <h1 className="mt-3 text-3xl font-black">Creator not found</h1>
          <p className="mt-2 text-sm text-[#777067]">The handle @{username} has not been claimed yet.</p>
          <div className="mt-6 flex flex-col gap-3">
            <Link href={`/signup?username=${encodeURIComponent(username)}`} className="w-full py-3 bg-[#7c351c] text-white font-bold rounded-full text-sm">
              Claim @{username} ↗
            </Link>
            <Link href="/" className="w-full py-3 border border-[#d8cec1] font-semibold rounded-full text-sm">
              Back to Home
            </Link>
          </div>
        </div>
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
    <main className="min-h-screen px-4 py-6 sm:py-10 max-w-lg mx-auto">
      {/* Top Header */}
      <header className="flex items-center justify-between mb-6">
        <Link href="/" className="text-xl font-black tracking-tight">
          gate<span className="text-[#7c351c]">.</span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            type="button"
            className="text-xs font-bold border border-[#d8cec1] bg-white px-3 py-1.5 rounded-full hover:bg-[#f3eee6] transition"
          >
            {copied ? 'Copied ✓' : 'Share link ↗'}
          </button>
        </div>
      </header>

      {/* Creator Profile Header Card */}
      <section className="bg-white border border-[#e6dfd5] rounded-[2rem] p-6 sm:p-7 shadow-sm">
        <div className="flex items-center gap-4">
          {creator.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={creator.avatar_url}
              alt={creator.display_name}
              className="w-20 h-20 rounded-full object-cover border-2 border-[#e6dfd5]"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-[#7c351c] text-white text-2xl font-black flex items-center justify-center shrink-0">
              {creator.display_name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase() || 'CX'}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h1 className="text-2xl font-black tracking-tight truncate">{creator.display_name}</h1>
              {creator.is_verified && (
                <span className="bg-[#285c2b] text-white text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1" title="Verified Creator">
                  ✓ Verified
                </span>
              )}
            </div>
            <p className="text-xs font-semibold text-[#777067] mt-0.5">@{creator.username} · Nigeria</p>
          </div>
        </div>

        {creator.bio_text && (
          <p className="mt-4 text-sm leading-6 text-[#201c18] break-words">{creator.bio_text}</p>
        )}

        {/* Interaction Type Tabs */}
        <div className="mt-6 grid grid-cols-2 gap-2 p-1 bg-[#f3eee6] rounded-2xl">
          <button
            type="button"
            onClick={() => setInteractionType('priority_dm')}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition ${
              interactionType === 'priority_dm'
                ? 'bg-white text-[#201c18] shadow-sm'
                : 'text-[#777067] hover:text-[#201c18]'
            }`}
          >
            Priority Message
          </button>
          <button
            type="button"
            onClick={() => setInteractionType('public_tip')}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition ${
              interactionType === 'public_tip'
                ? 'bg-white text-[#201c18] shadow-sm'
                : 'text-[#777067] hover:text-[#201c18]'
            }`}
          >
            Leave a Tip
          </button>
        </div>

        {/* Payment / Message Form */}
        <form onSubmit={handleCheckout} className="mt-5 space-y-4">
          {error && (
            <div className="p-3 bg-[#fff0ed] border border-[#f3c7bd] text-[#9a2c1b] text-xs rounded-xl font-medium" role="alert">
              {error}
            </div>
          )}

          {interactionType === 'priority_dm' && (
            <div className="p-4 bg-[#f8f5ef] rounded-2xl border border-[#e6dfd5]">
              <div className="flex items-center justify-between text-xs font-bold mb-2">
                <span className="text-[#777067]">Creator Rate</span>
                <span className="text-[#7c351c] text-sm">₦{(creator.min_message_fee_kobo / 100).toLocaleString()}</span>
              </div>
              <p className="text-xs text-[#777067] leading-relaxed">
                Send a guaranteed priority message. Reviewed directly by @{creator.username}.
              </p>
            </div>
          )}

          {interactionType === 'public_tip' && (
            <div>
              <label className="block text-xs font-bold text-[#777067] uppercase tracking-wider mb-2">
                Choose Tip Amount
              </label>
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
                        ? 'bg-[#7c351c] text-white border-[#7c351c]'
                        : 'bg-white border-[#e6dfd5] text-[#201c18] hover:bg-[#f8f5ef]'
                    }`}
                  >
                    ₦{(amountKobo / 100).toLocaleString()}
                  </button>
                ))}
              </div>
              <div className="mt-2.5">
                <input
                  type="number"
                  min="100"
                  placeholder="Or enter custom amount in ₦"
                  value={customTipNaira}
                  onChange={(e) => setCustomTipNaira(e.target.value)}
                  className="w-full text-xs py-2.5 px-3 border border-[#e6dfd5] rounded-xl bg-white focus:outline-none focus:border-[#7c351c]"
                />
              </div>
            </div>
          )}

          {/* Sender Details */}
          <div>
            <label className="block text-xs font-bold text-[#201c18] mb-1">
              Your Name or Alias <span className="text-[#7c351c]">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={80}
              placeholder="e.g. Tunde or Anonymous"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              className="w-full text-sm py-2.5 px-3.5 border border-[#e6dfd5] rounded-xl bg-white focus:outline-none focus:border-[#7c351c]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#201c18] mb-1">
              Your Email or Phone <span className="text-[#777067] font-normal">(for payment receipt)</span>
            </label>
            <input
              type="text"
              placeholder="you@example.com or 08012345678"
              value={senderContact}
              onChange={(e) => setSenderContact(e.target.value)}
              className="w-full text-sm py-2.5 px-3.5 border border-[#e6dfd5] rounded-xl bg-white focus:outline-none focus:border-[#7c351c]"
            />
          </div>

          {interactionType === 'priority_dm' && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-[#201c18]">
                  Your Message <span className="text-[#7c351c]">*</span>
                </label>
                <span className="text-[11px] text-[#777067]">{messageBody.length}/2,000</span>
              </div>
              <textarea
                required
                rows={4}
                maxLength={2000}
                placeholder="Write your thoughtful message here…"
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
                className="w-full text-sm p-3 border border-[#e6dfd5] rounded-xl bg-white focus:outline-none focus:border-[#7c351c] resize-none"
              ></textarea>
            </div>
          )}

          {/* Public Supporter Attribution Toggle */}
          <label className="flex items-start gap-2.5 p-3 rounded-xl bg-[#f8f5ef] border border-[#e6dfd5] cursor-pointer">
            <input
              type="checkbox"
              checked={isPublicAttribution}
              onChange={(e) => setIsPublicAttribution(e.target.checked)}
              className="mt-0.5 rounded text-[#7c351c] focus:ring-[#7c351c]"
            />
            <span className="text-xs text-[#201c18] leading-tight select-none">
              <strong className="block font-bold">Appear on the Odogwu Leaderboard</strong>
              Your name and support amount will be celebrated publicly. Your message text stays 100% private.
            </span>
          </label>

          {/* Pay Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 bg-[#7c351c] text-white font-bold rounded-full text-sm transition hover:bg-[#632814] disabled:opacity-50 cursor-pointer shadow-md"
          >
            {submitting ? 'Redirecting to Paystack…' : `Pay ${formattedAmount} via Paystack ↗`}
          </button>

          <p className="text-center text-[11px] text-[#777067] leading-relaxed">
            🔒 Secured by Paystack. Supports Cards, Bank Transfer, USSD, Apple Pay.
          </p>
        </form>
      </section>

      {/* Odogwu Leaderboard (Supporter Wall) */}
      {creator.public_supporter_wall_enabled && (
        <section className="mt-8 bg-white border border-[#e6dfd5] rounded-[2rem] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-black tracking-tight">Odogwu Wall 🏆</h2>
              <p className="text-xs text-[#777067]">Top supporters of @{creator.username}</p>
            </div>
            {/* Period Filters */}
            <div className="flex items-center gap-1 bg-[#f3eee6] p-1 rounded-xl text-[11px] font-bold">
              {(['weekly', 'monthly', 'all_time'] as const).map((period) => (
                <button
                  key={period}
                  type="button"
                  onClick={() => setLeaderboardPeriod(period)}
                  className={`px-2.5 py-1 rounded-lg capitalize transition ${
                    leaderboardPeriod === period ? 'bg-white text-[#201c18] shadow-xs' : 'text-[#777067]'
                  }`}
                >
                  {period === 'all_time' ? 'All-Time' : period === 'weekly' ? 'Week' : 'Month'}
                </button>
              ))}
            </div>
          </div>

          {leaderboard.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-[#d8cec1] rounded-2xl p-4">
              <p className="text-xs font-semibold text-[#777067]">No public supporters on the wall yet for this period.</p>
              <p className="text-[11px] text-[#777067] mt-1">Be the first to show support above!</p>
            </div>
          ) : (
            <div className="divide-y divide-[#f3eee6]">
              {leaderboard.map((item) => (
                <div key={`${item.rank}-${item.supporter_name}`} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                        item.rank === 1
                          ? 'bg-[#c89d55] text-white'
                          : item.rank === 2
                          ? 'bg-[#b0a79b] text-white'
                          : item.rank === 3
                          ? 'bg-[#a3704c] text-white'
                          : 'bg-[#f3eee6] text-[#777067]'
                      }`}
                    >
                      {item.rank}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-[#201c18]">{item.supporter_name}</p>
                      <p className="text-[10px] text-[#777067]">
                        {item.interaction_count} contribution{item.interaction_count > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-[#7c351c]">
                    ₦{(item.total_amount_kobo / 100).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Footer */}
      <footer className="mt-8 text-center text-xs text-[#777067] pb-8">
        <p>Private messages stay strictly private.</p>
        <p className="mt-1">
          Powered by <Link href="/" className="font-bold underline text-[#201c18]">Bio Gatekeeper</Link>
        </p>
      </footer>
    </main>
  );
}
