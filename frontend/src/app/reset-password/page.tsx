'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { AuthShell } from '@/components/AuthShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiRequest } from '@/lib/api';

function ResetForm() {
  const params = useSearchParams();
  const router = useRouter();
  const uid = params.get('uid') || '';
  const token = params.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (!uid || !token) {
      setError('Incomplete reset link. Please request a new password reset link.');
      return;
    }

    setLoading(true);
    try {
      await apiRequest('/auth/reset-password/', {
        method: 'POST',
        body: JSON.stringify({ uid, token, password }),
      });
      setSuccess(true);
      window.setTimeout(() => router.push('/login'), 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reset your password. Please request a new link.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Create a new password"
      title={success ? 'You are back in control.' : 'Choose a new password.'}
      description={
        success
          ? 'Your password has been updated. Redirecting you to sign in…'
          : 'Make it strong and at least 8 characters long.'
      }
      footer={
        <>
          Changed your mind?{' '}
          <Link href="/login" className="text-primary font-bold hover:underline">
            Back to login ↗
          </Link>
        </>
      }
    >
      {success ? (
        <div className="p-4 bg-success/10 border border-success/20 text-success text-xs rounded-xl font-medium" role="status">
          Password updated successfully. Redirecting to login…
        </div>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="p-3 bg-error/10 border border-error/20 text-error text-xs rounded-xl font-semibold" role="alert">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="password">New password</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-16"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-secondary-text hover:text-dark transition"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirm_password">Confirm new password</Label>
            <Input
              id="confirm_password"
              name="confirm_password"
              type="password"
              autoComplete="new-password"
              placeholder="Confirm password"
              minLength={8}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full mt-2">
            {loading ? 'Updating password…' : 'Update password ↗'}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen px-4 py-24 flex items-center justify-center bg-background">
          <p className="text-xs font-bold text-secondary-text">Loading secure reset form…</p>
        </main>
      }
    >
      <ResetForm />
    </Suspense>
  );
}
