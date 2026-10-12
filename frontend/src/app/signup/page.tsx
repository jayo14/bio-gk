'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AuthInput, AuthShell } from '@/components/AuthShell';
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
    if (!usernameEdited) setUsername(value.toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 24));
  };
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setLoading(true);
    try { await signup({ display_name: displayName.trim(), username: username.trim().toLowerCase(), email: email.trim(), password }); router.push('/dashboard'); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not create your account. Try again.'); }
    finally { setLoading(false); }
  }
  return <AuthShell eyebrow="Creator onboarding" title="Claim your corner." description="Create your account and claim a link that is yours. You can start right away—no email verification required." footer={<>Already have an account? <Link href="/login">Log in</Link></>}>
    <form className="auth-form" onSubmit={handleSubmit}>
      {error && <div className="auth-error" role="alert">{error}</div>}
      <AuthInput label="Display name" name="display_name" autoComplete="name" placeholder="e.g. Chioma X." value={displayName} onChange={e=>onDisplayName(e.target.value)} maxLength={80} required />
      <AuthInput label="Your public handle" name="username" autoComplete="username" placeholder="chioma_x" value={username} onChange={e=>{setUsernameEdited(true);setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g,''));}} minLength={3} maxLength={24} pattern="[a-z0-9_]{3,24}" required aria-describedby="handle-hint" />
      <span className="field-hint" id="handle-hint">Your link will look like gate.ng/{username || 'yourname'}.</span>
      <AuthInput label="Email address" name="email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} required />
      <label className="field-label">Password<div className="password-wrap"><input className="auth-input" name="password" type={showPassword?'text':'password'} autoComplete="new-password" placeholder="At least 8 characters" minLength={8} value={password} onChange={e=>setPassword(e.target.value)} required/><button className="password-toggle" type="button" onClick={()=>setShowPassword(v=>!v)}>{showPassword?'Hide':'Show'}</button></div><span className="field-hint">Use 8 characters or more.</span></label>
      <button className="auth-submit" type="submit" disabled={loading}>{loading?'Creating your account…':<>Create my account <span aria-hidden="true">↗</span></>}</button>
    </form>
    <span className="footer-note">No email verification. You can sign in as soon as your account is created.</span>
  </AuthShell>;
}
