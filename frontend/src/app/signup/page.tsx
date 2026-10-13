'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AuthShell } from '@/components/AuthShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signup } from '@/lib/api';

export default function SignupPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [usernameEdited, setUsernameEdited] = useState(false);

  const onDisplayName = (value: string) => {
    setDisplayName(value);
    if (!usernameEdited) {
      setUsername(
        value
          .toLowerCase()
          .replace(/[^a-z0-9_]+/g, '_')
          .replace(/^_+|_+$/g, '')
          .slice(0, 24)
      );
    }
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signup({
        display_name: displayName.trim(),
        username: username.trim().toLowerCase(),
        email: email.trim(),
        password,
      });
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create your account. Please try again.');
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
          <Link href="/login" className="text-primary font-bold hover:underline">
            Log in ↗
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
          <Label htmlFor="display_name">Display name</Label>
          <Input
            id="display_name"
            name="display_name"
            autoComplete="name"
            placeholder="e.g. Chioma X."
            value={displayName}
            onChange={(e) => onDisplayName(e.target.value)}
            maxLength={80}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="username">Public handle</Label>
          <Input
            id="username"
            name="username"
            autoComplete="username"
            placeholder="chioma_x"
            value={username}
            onChange={(e) => {
              setUsernameEdited(true);
              setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''));
            }}
            minLength={3}
            maxLength={24}
            pattern="[a-z0-9_]{3,24}"
            required
          />
          <p className="text-[11px] text-secondary-text">
            Your link: <span className="font-semibold text-dark">gate.ng/{username || 'yourhandle'}</span>
          </p>
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

        <Button type="submit" disabled={loading} className="w-full mt-2">
          {loading ? 'Creating your account…' : 'Create my account ↗'}
        </Button>
      </form>
    </AuthShell>
  );
}
