'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';

type PaymentVerification = {
  status: 'success' | 'pending' | 'failed' | 'abandoned';
  reference: string;
  amount_kobo?: number;
  creator_username?: string;
  creator_name?: string;
  interaction_type?: string;
  verified_at?: string;
  detail?: string;
};

function PaymentReturnContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get('reference') || '';

  const [verification, setVerification] = useState<PaymentVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const checkStatus = (ref: string) => {
    if (!ref) {
      setLoading(false);
      setError('No transaction reference found in return URL.');
      return;
    }

    setLoading(true);
    setError('');

    apiRequest<PaymentVerification>(`/payments/verify/${encodeURIComponent(ref)}/`)
      .then((data) => {
        setVerification(data);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Unable to verify payment status.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    checkStatus(reference);
  }, [reference]);

  return (
    <main className="min-h-screen px-4 py-16 sm:py-24 max-w-md mx-auto">
      {/* Top Header */}
      <header className="text-center mb-8">
        <Link href="/" className="text-2xl font-black tracking-tight">
          gate<span className="text-[#7c351c]">.</span>
        </Link>
      </header>

      <section className="bg-white border border-[#e6dfd5] rounded-[2rem] p-6 sm:p-8 text-center shadow-sm">
        {loading ? (
          <div className="py-8">
            <div className="w-12 h-12 border-4 border-[#7c351c] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-5 text-base font-bold text-[#201c18]">Verifying your transaction…</p>
            <p className="mt-1 text-xs text-[#777067] leading-relaxed">
              Contacting Paystack to verify settlement. Please hold on.
            </p>
          </div>
        ) : error ? (
          <div className="py-6">
            <div className="w-12 h-12 rounded-full bg-[#fff0ed] text-[#9a2c1b] text-xl font-black flex items-center justify-center mx-auto mb-4">
              ✕
            </div>
            <h1 className="text-2xl font-black text-[#201c18]">Verification Error</h1>
            <p className="mt-2 text-xs text-[#9a2c1b]">{error}</p>
            <div className="mt-6 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => checkStatus(reference)}
                className="py-3 px-5 bg-[#7c351c] text-white text-xs font-bold rounded-full hover:bg-[#632814] transition cursor-pointer"
              >
                Retry verification ↻
              </button>
              <Link
                href="/"
                className="py-3 px-5 border border-[#d8cec1] text-xs font-bold rounded-full hover:bg-[#f3eee6] transition"
              >
                Back to Home
              </Link>
            </div>
          </div>
        ) : verification?.status === 'success' ? (
          <div className="py-4">
            <div className="w-16 h-16 rounded-full bg-[#edf7ed] border border-[#cce6cd] text-[#285c2b] text-3xl font-black flex items-center justify-center mx-auto mb-4">
              ✓
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#285c2b]">Payment Verified</p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-black tracking-tight text-[#201c18]">
              Thank you for your support!
            </h1>
            <p className="mt-2 text-xs text-[#777067] leading-relaxed">
              Your {verification.interaction_type === 'priority_dm' ? 'priority message' : 'tip'} has been verified and securely delivered to{' '}
              <strong className="text-[#201c18]">@{verification.creator_username}</strong>.
            </p>

            {verification.amount_kobo && (
              <div className="mt-5 p-4 bg-[#f8f5ef] border border-[#e6dfd5] rounded-2xl text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#777067]">Amount Paid:</span>
                  <strong className="text-[#7c351c] font-black">
                    ₦{(verification.amount_kobo / 100).toLocaleString()}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#777067]">Creator:</span>
                  <span className="font-semibold text-[#201c18]">
                    {verification.creator_name || `@${verification.creator_username}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#777067]">Reference:</span>
                  <span className="font-mono text-[11px] text-[#777067]">{verification.reference}</span>
                </div>
              </div>
            )}

            <div className="mt-6 flex flex-col gap-2">
              {verification.creator_username && (
                <Link
                  href={`/${verification.creator_username}`}
                  className="py-3 px-5 bg-[#7c351c] text-white text-xs font-bold rounded-full hover:bg-[#632814] transition"
                >
                  Return to @{verification.creator_username}&apos;s profile ↗
                </Link>
              )}
              <Link
                href="/"
                className="py-3 px-5 border border-[#d8cec1] text-xs font-bold rounded-full hover:bg-[#f3eee6] transition"
              >
                Back to Home
              </Link>
            </div>
          </div>
        ) : (
          <div className="py-4">
            <div className="w-14 h-14 rounded-full bg-[#fff8eb] border border-[#f3dfbd] text-[#96631b] text-2xl font-black flex items-center justify-center mx-auto mb-4">
              ⏳
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#96631b]">
              Status: {verification?.status || 'Pending'}
            </p>
            <h1 className="mt-1 text-2xl font-black text-[#201c18]">Payment Not Completed</h1>
            <p className="mt-2 text-xs text-[#777067] leading-relaxed">
              We did not receive a completed payment confirmation from Paystack for this transaction.
            </p>

            <div className="mt-6 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => checkStatus(reference)}
                className="py-3 px-5 bg-[#7c351c] text-white text-xs font-bold rounded-full hover:bg-[#632814] transition cursor-pointer"
              >
                Re-check payment status ↻
              </button>
              <Link
                href="/"
                className="py-3 px-5 border border-[#d8cec1] text-xs font-bold rounded-full hover:bg-[#f3eee6] transition"
              >
                Back to Home
              </Link>
            </div>
          </div>
        )}
      </section>

      <p className="mt-6 text-center text-[11px] text-[#777067]">
        A browser redirect does not verify payment. All interactions are verified against Paystack servers.
      </p>
    </main>
  );
}

export default function PaymentReturnPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen px-4 py-24 flex items-center justify-center">
          <p className="text-xs font-bold text-[#777067]">Loading payment verification…</p>
        </main>
      }
    >
      <PaymentReturnContent />
    </Suspense>
  );
}
