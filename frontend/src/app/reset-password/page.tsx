'use client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { AuthInput, AuthShell } from '@/components/AuthShell';
import { apiRequest } from '@/lib/api';
function ResetForm() {
  const params=useSearchParams();const router=useRouter();const uid=params.get('uid')||'';const token=params.get('token')||'';
  const [password,setPassword]=useState('');const [confirm,setConfirm]=useState('');const [showPassword,setShowPassword]=useState(false);const [loading,setLoading]=useState(false);const [error,setError]=useState('');const [success,setSuccess]=useState(false);
  async function handleSubmit(event:React.FormEvent<HTMLFormElement>){event.preventDefault();setError('');if(password!==confirm){setError('Those passwords do not match.');return;}if(!uid||!token){setError('This reset link is incomplete. Request a new password reset link.');return;}setLoading(true);try{await apiRequest('/auth/reset-password/',{method:'POST',body:JSON.stringify({uid,token,password})});setSuccess(true);window.setTimeout(()=>router.push('/login'),1800);}catch(err){setError(err instanceof Error?err.message:'Could not reset your password. Request a new link.');}finally{setLoading(false);}}
  return <AuthShell eyebrow="Create a new password" title={success?'You’re back in control.':'Choose a new password.'} description={success?'Your password has been updated. Take a breath—we’re sending you back to sign in.':'Make it strong, memorable, and different from your old password.'} footer={<>Changed your mind? <Link href="/login">Back to login</Link></>}>
    {success?<div className="auth-success" role="status">Password updated successfully. Redirecting to login…</div>:<form className="auth-form" onSubmit={handleSubmit}>{error&&<div className="auth-error" role="alert">{error}</div>}<label className="field-label">New password<div className="password-wrap"><input className="auth-input" name="password" type={showPassword?'text':'password'} autoComplete="new-password" placeholder="At least 8 characters" minLength={8} value={password} onChange={e=>setPassword(e.target.value)} required/><button className="password-toggle" type="button" onClick={()=>setShowPassword(v=>!v)}>{showPassword?'Hide':'Show'}</button></div></label><AuthInput label="Confirm new password" name="confirm_password" type="password" autoComplete="new-password" placeholder="Enter it one more time" minLength={8} value={confirm} onChange={e=>setConfirm(e.target.value)} required/><button className="auth-submit" disabled={loading} type="submit">{loading?'Updating password…':<>Update password <span aria-hidden="true">↗</span></>}</button></form>}
  </AuthShell>;
}
export default function ResetPasswordPage(){return <Suspense fallback={<main className="auth-page"><p className="text-center text-sm">Loading secure reset form…</p></main>}><ResetForm/></Suspense>;}
