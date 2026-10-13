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
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const cleanUsername = username.trim().toLowerCase();
  const isUsernameValid = cleanUsername.length >= 3 && /^[a-z0-9_]{3,30}$/.test(cleanUsername);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!isUsernameValid) {
      const msg = 'Username must be 3–30 characters and contain only letters, numbers, and underscores.';
      setError(msg);
      toast.error(msg);
      setLoading(false);
      return;
    }

    try {
      await signup({
        username: cleanUsername,
        display_name: fullName.trim() || cleanUsername,
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
      title="Create your account"
      description="Join Bio Gatekeeper and start earning from your influence."
      footer={
        <>
          Already have an account?{' '}
          <Link href="/login" className="text-primary font-bold hover:underline">
            Login
          </Link>
        </>
      }
      legalNote={
        <>
          By signing up, you agree to our{' '}
          <Link href="#" className="underline hover:text-dark">Terms of Service</Link>{' '}
          and{' '}
          <Link href="#" className="underline hover:text-dark">Privacy Policy</Link>.
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        {error && (
          <div className="p-3 bg-error/10 border border-error/20 text-error text-xs rounded-xl font-semibold" role="alert">
            {error}
          </div>
        )}

        {/* Full Name */}
        <div className="space-y-1.5">
          <Label htmlFor="fullName" className="text-xs font-bold text-dark">Full Name</Label>
          <Input
            id="fullName"
            name="fullName"
            type="text"
            placeholder="John Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="h-11 rounded-xl text-xs border-border bg-surface"
            required
          />
        </div>

        {/* Username */}
        <div className="space-y-1.5">
          <Label htmlFor="username" className="text-xs font-bold text-dark">Username</Label>
          <div className="relative">
            <Input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              placeholder="johndoe123"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              className="h-11 rounded-xl text-xs pr-10 border-border bg-surface"
              required
            />
            {isUsernameValid && (
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-success">
                <Icon name="check" size={16} />
              </span>
            )}
          </div>
          {isUsernameValid && (
            <p className="text-[11px] text-success font-semibold flex items-center gap-1 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" />
              Username available
            </p>
          )}
        </div>

        {/* Email Address */}
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

        {/* Password */}
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-xs font-bold text-dark">Password</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="••••••••••••"
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

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={loading}
          className="w-full h-11 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs shadow-xs mt-2"
        >
          {loading ? 'Creating account…' : 'Sign Up'}
        </Button>
      </form>
    </AuthShell>
  );
}
