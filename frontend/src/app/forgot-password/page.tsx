'use client';
import Link from 'next/link';
import { useState } from 'react';
import { AuthInput, AuthShell } from '@/components/AuthShell';
import { apiRequest } from '@/lib/api';
type ForgotResponse = { detail: string; development_reset_url?: string };
export default function ForgotPasswordPage() {
  const [email,setEmail] = useState(''); const [loading,setLoading] = useState(false); const [sent,setSent] = useState(false); const [error,setError] = useState(''); const [devUrl,setDevUrl] = useState('');
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); setError('');setLoading(true);try { const result=await apiRequest<ForgotResponse>('/auth/forgot-password/',{method:'POST',body:JSON.stringify({email:email.trim()})});setSent(true);setDevUrl(result.development_reset_url||''); } catch(err) {setError(err instanceof Error?err.message:'Could not process your request. Try again.');}finally{setLoading(false);} }
  return <AuthShell eyebrow="Account recovery" title={sent?'Check your next step.':'Forgot your password?'} description={sent?'If an account matches that address, reset instructions are ready. In development, use the secure reset link below.':'It happens. Enter the email you signed up with and we’ll help you get back in.'} footer={<>Remembered it? <Link href="/login">Back to login</Link></>}>
    {!sent ? <form className="auth-form" onSubmit={handleSubmit}>{error&&<div className="auth-error" role="alert">{error}</div>}<AuthInput label="Email address" name="email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} required/><button className="auth-submit" disabled={loading} type="submit">{loading?'Preparing reset…':<>Send reset instructions <span aria-hidden="true">↗</span></>}</button></form> : <div className="auth-form"><div className="auth-success" role="status">Request received. For privacy, this page does not confirm whether the email has an account.</div>{devUrl && <div className="dev-reset-box"><p className="dev-reset-title">Development reset link</p><p className="field-hint">Email delivery is not configured yet. This link is shown only while Django DEBUG is enabled.</p><Link className="auth-submit dev-reset-link" href={devUrl}>Set a new password ↗</Link></div>}<button type="button" className="auth-submit auth-secondary" onClick={()=>{setSent(false);setDevUrl('');setError('');}}>Try another email</button></div>}
    <span className="footer-note">Reset links expire after one hour and can only be used once.</span>
  </AuthShell>;
}
