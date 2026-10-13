'use client';

import Link from 'next/link';
import { useState } from 'react';
import { AuthShell } from '@/components/AuthShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not process your request. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Account recovery"
      title={sent ? 'Check your next step.' : 'Forgot your password?'}
      description={
        sent
          ? 'If an account matches that address, password reset instructions are ready.'
          : 'Enter the email you signed up with and we will help you regain access.'
      }
      footer={
        <>
          Remembered it?{' '}
          <Link href="/login" className="text-primary font-bold hover:underline">
            Back to login ↗
          </Link>
        </>
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
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full mt-2">
            {loading ? 'Preparing reset instructions…' : 'Send reset instructions ↗'}
          </Button>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="p-3 bg-success/10 border border-success/20 text-success text-xs rounded-xl font-medium" role="status">
            Request received. For your security, this response does not disclose whether the email address is registered.
          </div>

          {devUrl && (
            <div className="p-4 bg-background border border-border rounded-2xl space-y-2">
              <p className="text-xs font-bold text-dark">Development Reset Link</p>
              <p className="text-[11px] text-secondary-text">
                Shown only when Django DEBUG is active.
              </p>
              <Button asChild className="w-full">
                <Link href={devUrl}>Set a new password ↗</Link>
              </Button>
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            className="w-full"
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
