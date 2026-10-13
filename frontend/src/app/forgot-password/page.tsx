'use client';

import Link from 'next/link';
import { useState } from 'react';
import { AuthShell } from '@/components/AuthShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icon } from '@/components/ui/icon';
import { toast } from '@/components/ui/sonner';
import { apiRequest } from '@/lib/api';

type ForgotResponse = { detail: string; development_reset_url?: string };

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [devUrl, setDevUrl] = useState('');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await apiRequest<ForgotResponse>('/auth/forgot-password/', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim() }),
      });
      setSent(true);
      setDevUrl(result.development_reset_url || '');
      toast.success('Password reset link prepared.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not process your request. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  // Soft purple envelope illustration with paper plane matching Screen 5
  const envelopeIllustration = (
    <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center relative">
      <div className="w-16 h-12 rounded-xl bg-primary/20 border-2 border-primary/40 flex items-center justify-center shadow-xs">
        <Icon name="mail" fill size={28} className="text-primary" />
      </div>
      {/* Paper airplane accent */}
      <span className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow-sm">
        <Icon name="send" size={16} />
      </span>
    </div>
  );

  return (
    <AuthShell
      title="Forgot your password?"
      description="Enter your email address and we'll send you a password reset link."
      illustration={envelopeIllustration}
      centerHeader
      backHref="/login"
      footer={
        <Link href="/login" className="text-xs font-bold text-primary hover:underline">
          Back to login
        </Link>
      }
    >
      {!sent ? (
        <form className="space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="p-3 bg-error/10 border border-error/20 text-error text-xs rounded-xl font-semibold" role="alert">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-bold text-dark">Email Address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 rounded-xl text-xs border-border bg-surface"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs shadow-xs mt-2"
          >
            {loading ? 'Sending link…' : 'Send Reset Link'}
          </Button>
        </form>
      ) : (
        <div className="space-y-4 text-center">
          <div className="p-4 bg-success/10 border border-success/20 text-success text-xs rounded-xl font-semibold leading-relaxed" role="status">
            Instructions sent! If an account exists for {email}, a reset link has been dispatched.
          </div>

          {devUrl && (
            <div className="p-4 bg-background border border-border rounded-xl text-left space-y-2">
              <p className="text-xs font-bold text-dark">Development Reset Link</p>
              <p className="text-[11px] text-secondary-text">
                Visible only during local development (DEBUG=True).
              </p>
              <Button asChild className="w-full h-10 text-xs">
                <Link href={devUrl} className="flex items-center justify-center gap-1.5">
                  Set a new password <Icon name="arrow_forward" size={16} />
                </Link>
              </Button>
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            className="w-full h-11 rounded-xl text-xs"
            onClick={() => {
              setSent(false);
              setDevUrl('');
              setError('');
            }}
          >
            Try another email
          </Button>
        </div>
      )}
    </AuthShell>
  );
}
