'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AuthInput, AuthShell } from '@/components/AuthShell';
import { login } from '@/lib/api';
export default function LoginPage() {
  const router = useRouter(); const [email,setEmail] = useState(''); const [password,setPassword] = useState(''); const [showPassword,setShowPassword] = useState(false); const [loading,setLoading] = useState(false); const [error,setError] = useState('');
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); setError(''); setLoading(true); try { await login({email:email.trim(),password}); router.push('/dashboard'); } catch(err) { setError(err instanceof Error?err.message:'Unable to sign in. Try again.'); } finally { setLoading(false); } }
  return <AuthShell eyebrow="Welcome back" title="Good to have you back." description="Sign in to manage your creator page, messages and supporters." footer={<>New to Gate? <Link href="/signup">Create an account</Link></>}>
    <form className="auth-form" onSubmit={handleSubmit}>{error && <div className="auth-error" role="alert">{error}</div>}<AuthInput label="Email address" name="email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} required /><label className="field-label"><span className="password-row"><span>Password</span><Link href="/forgot-password">Forgot password?</Link></span><div className="password-wrap"><input className="auth-input" name="password" type={showPassword?'text':'password'} autoComplete="current-password" placeholder="Enter your password" value={password} onChange={e=>setPassword(e.target.value)} required/><button className="password-toggle" type="button" onClick={()=>setShowPassword(v=>!v)}>{showPassword?'Hide':'Show'}</button></div></label><button className="auth-submit" type="submit" disabled={loading}>{loading?'Signing you in…':<>Sign in <span aria-hidden="true">↗</span></>}</button></form><span className="footer-note">Your account, your audience, your rules.</span>
  </AuthShell>;
}
