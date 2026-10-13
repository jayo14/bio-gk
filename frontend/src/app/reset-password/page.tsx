'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { AuthShell } from '@/components/AuthShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icon } from '@/components/ui/icon';
import { toast } from '@/components/ui/sonner';
import { apiRequest } from '@/lib/api';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (password !== confirm) {
      const msg = 'Passwords do not match.';
      setError(msg);
      toast.error(msg);
      return;
    }

    if (!token) {
      const msg = 'Missing reset token. Please request a new password reset link.';
      setError(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);
    try {
      await apiRequest('/auth/reset-password/', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      });
      setSuccess(true);
      toast.success('Password updated successfully! Redirecting to login…');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not reset your password. The link may have expired.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  // Circular purple lock illustration matching Screen 4
  const lockIllustration = (
    <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center relative">
      <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center shadow-md">
        <Icon name="lock" fill size={28} />
      </div>
      <span className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-success text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
        ✓
      </span>
    </div>
  );

  return (
    <AuthShell
      title="Reset your password"
      description="Enter your new password below."
      illustration={lockIllustration}
      centerHeader
      backHref="/login"
      footer={
        <Link href="/login" className="text-xs font-bold text-primary hover:underline">
          Back to login
        </Link>
      }
    >
      {success ? (
        <div className="p-4 bg-success/10 border border-success/20 text-success text-xs rounded-xl font-medium text-center" role="status">
          Password updated successfully. Redirecting to login…
        </div>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="p-3 bg-error/10 border border-error/20 text-error text-xs rounded-xl font-semibold" role="alert">
              {error}
            </div>
          )}

          {/* New Password */}
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-bold text-dark">New Password</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="••••••••"
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 rounded-xl text-xs pr-10 border-border bg-surface"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-text hover:text-dark transition p-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <Icon name={showPassword ? 'visibility_off' : 'visibility'} size={18} />
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div className="space-y-1.5">
            <Label htmlFor="confirm_password" className="text-xs font-bold text-dark">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirm_password"
                name="confirm_password"
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="••••••••"
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="h-11 rounded-xl text-xs pr-10 border-border bg-surface"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-text hover:text-dark transition p-1"
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
              >
                <Icon name={showConfirm ? 'visibility_off' : 'visibility'} size={18} />
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs shadow-xs mt-2"
          >
            {loading ? 'Resetting password…' : 'Reset Password'}
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
          <p className="text-xs font-bold text-secondary-text">Loading password reset…</p>
        </main>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
