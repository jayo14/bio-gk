'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { signup } from '@/lib/api';
import { AuthShell } from '@/components/AuthShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icon } from '@/components/ui/icon';
import { toast } from '@/components/ui/sonner';

export default function SignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const cleanUsername = username.trim().toLowerCase();
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(cleanUsername)) {
      const msg = 'Username must be 3–30 characters and contain only letters, numbers, and underscores.';
      setError(msg);
      toast.error(msg);
      setLoading(false);
      return;
    }

    try {
      await signup({
        username: cleanUsername,
        display_name: displayName.trim() || cleanUsername,
        email: email.trim(),
        password,
      });
      toast.success(`Account created! Welcome, @${cleanUsername}.`);
      router.push('/dashboard');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to complete registration. Please check your inputs.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Creator onboarding"
      title="Claim your corner."
      description="Create your account and claim a bio link that is yours. Start immediately—no email verification required."
      footer={
        <>
          Already have an account?{' '}
          <Link href="/login" className="text-primary font-bold hover:underline inline-flex items-center gap-0.5">
            Log in <Icon name="north_east" size={13} />
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
          <Label htmlFor="username">Claim your handle</Label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-secondary-text select-none">
              gate/
            </span>
            <Input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              placeholder="chioma"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              className="pl-13 font-medium"
              required
            />
          </div>
          <p className="text-[11px] text-secondary-text">Letters, numbers, and underscores only.</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="displayName">Display name</Label>
          <Input
            id="displayName"
            name="displayName"
            type="text"
            placeholder="Chioma Adebayo"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
          />
        </div>

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
          <Label htmlFor="password">Password (at least 8 characters)</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Create a secure password"
              minLength={8}
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
            'Creating your account…'
          ) : (
            <span className="flex items-center justify-center gap-1.5">
              Create my account <Icon name="arrow_forward" size={16} />
            </span>
          )}
        </Button>
      </form>
    </AuthShell>
  );
}
