'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { toast } from '@/components/ui/sonner';

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
        if (data.status === 'success') {
          toast.success('Payment verified successfully! Thank you for your support.');
        } else if (data.status === 'failed') {
          toast.error('Payment verification failed.');
        }
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : 'Unable to verify payment status.';
        setError(msg);
        toast.error(msg);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    checkStatus(reference);
  }, [reference]);

  return (
    <main className="min-h-screen px-4 py-16 sm:py-24 max-w-md mx-auto bg-background flex flex-col justify-between">
      <div>
        {/* Top Header */}
        <header className="text-center mb-8">
          <Link href="/" className="text-2xl font-black tracking-tight text-dark">
            gate<span className="text-primary">.</span>
          </Link>
        </header>

        <Card className="p-6 sm:p-8 text-center shadow-xs border-border bg-surface rounded-[2rem]">
          <CardContent className="p-0">
            {loading ? (
              <div className="py-8">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="mt-5 text-base font-bold text-dark">Verifying your transaction…</p>
                <p className="mt-1 text-xs text-secondary-text leading-relaxed">
                  Contacting Paystack to verify settlement. Please hold on.
                </p>
              </div>
            ) : error ? (
              <div className="py-4">
                <div className="w-14 h-14 rounded-full bg-error/10 border border-error/20 text-error flex items-center justify-center mx-auto mb-4">
                  <Icon name="cancel" fill size={32} />
                </div>
                <Badge variant="error" className="mb-2 uppercase tracking-widest text-[10px]">
                  Verification Error
                </Badge>
                <h1 className="mt-1 text-2xl font-black text-dark">Unable to Verify</h1>
                <p className="mt-2 text-xs text-error leading-relaxed">{error}</p>
                <div className="mt-6 flex flex-col gap-2">
                  <Button
                    type="button"
                    onClick={() => checkStatus(reference)}
                    className="w-full gap-2"
                  >
                    <Icon name="refresh" size={16} /> Retry verification
                  </Button>
                  <Button variant="outline" asChild className="w-full gap-2">
                    <Link href="/">
                      <Icon name="arrow_back" size={16} /> Back to Home
                    </Link>
                  </Button>
                </div>
              </div>
            ) : verification?.status === 'success' ? (
              <div className="py-4">
                <div className="w-16 h-16 rounded-full bg-success/10 border border-success/20 text-success flex items-center justify-center mx-auto mb-4">
                  <Icon name="check_circle" fill size={36} />
                </div>
                <Badge variant="success" className="mb-2 uppercase tracking-widest text-[10px]">
                  Payment Verified
                </Badge>
                <h1 className="mt-1 text-2xl sm:text-3xl font-black tracking-tight text-dark">
                  Thank you for your support!
                </h1>
                <p className="mt-2 text-xs text-secondary-text leading-relaxed">
                  Your {verification.interaction_type === 'priority_dm' ? 'priority message' : 'tip'} has been verified and securely delivered to{' '}
                  <strong className="text-dark">@{verification.creator_username}</strong>.
                </p>

                {verification.amount_kobo && (
                  <div className="mt-5 p-4 bg-background border border-border rounded-2xl text-left text-xs space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-secondary-text">Amount Paid:</span>
                      <strong className="text-primary font-black text-sm">
                        ₦{(verification.amount_kobo / 100).toLocaleString()}
                      </strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-secondary-text">Creator:</span>
                      <span className="font-semibold text-dark">
                        {verification.creator_name || `@${verification.creator_username}`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-secondary-text">Reference:</span>
                      <span className="font-mono text-[11px] text-secondary-text">{verification.reference}</span>
                    </div>
                  </div>
                )}

                <div className="mt-6 flex flex-col gap-2">
                  {verification.creator_username && (
                    <Button asChild className="w-full gap-2">
                      <Link href={`/${verification.creator_username}`}>
                        Return to @{verification.creator_username}&apos;s profile <Icon name="north_east" size={16} />
                      </Link>
                    </Button>
                  )}
                  <Button variant="outline" asChild className="w-full gap-2">
                    <Link href="/">
                      <Icon name="arrow_back" size={16} /> Back to Home
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="py-4">
                <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto mb-4">
                  <Icon name="schedule" fill size={32} />
                </div>
                <Badge variant="secondary" className="mb-2 uppercase tracking-widest text-[10px]">
                  Status: {verification?.status || 'Pending'}
                </Badge>
                <h1 className="mt-1 text-2xl font-black text-dark">Payment Not Completed</h1>
                <p className="mt-2 text-xs text-secondary-text leading-relaxed">
                  We did not receive a completed payment confirmation from Paystack for this transaction.
                </p>

                <div className="mt-6 flex flex-col gap-2">
                  <Button
                    type="button"
                    onClick={() => checkStatus(reference)}
                    className="w-full gap-2"
                  >
                    <Icon name="refresh" size={16} /> Re-check payment status
                  </Button>
                  <Button variant="outline" asChild className="w-full gap-2">
                    <Link href="/">
                      <Icon name="arrow_back" size={16} /> Back to Home
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <p className="mt-8 text-center text-[11px] text-secondary-text">
        A browser redirect does not verify payment. All interactions are verified against Paystack servers.
      </p>
    </main>
  );
}

export default function PaymentReturnPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen px-4 py-24 flex items-center justify-center bg-background">
          <p className="text-xs font-bold text-secondary-text">Loading payment verification…</p>
        </main>
      }
    >
      <PaymentReturnContent />
    </Suspense>
  );
}
