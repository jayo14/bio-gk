'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { login } from '@/lib/api';
import { AuthShell } from '@/components/AuthShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icon } from '@/components/ui/icon';
import { toast } from '@/components/ui/sonner';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login({ email: email.trim(), password });
      toast.success('Welcome back! Signed in successfully.');
      router.push('/dashboard');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Invalid credentials. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Good to have you back."
      description="Sign in to manage your creator page, inbox, and Paystack payouts."
      footer={
        <>
          New to Bio Gatekeeper?{' '}
          <Link href="/signup" className="text-primary font-bold hover:underline inline-flex items-center gap-0.5">
            Create an account <Icon name="north_east" size={13} />
          </Link>
        </>
      }
    >
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

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="text-[11px] font-bold text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-12"
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

        <Button type="submit" disabled={loading} className="w-full mt-2">
          {loading ? (
            'Signing you in…'
          ) : (
            <span className="flex items-center justify-center gap-1.5">
              Sign in <Icon name="arrow_forward" size={16} />
            </span>
          )}
        </Button>
      </form>
    </AuthShell>
  );
}
