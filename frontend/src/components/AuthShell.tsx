import Link from 'next/link';
import type { InputHTMLAttributes, ReactNode } from 'react';

export function AuthShell({ eyebrow, title, description, children, footer }: { eyebrow: string; title: string; description: string; children: ReactNode; footer: ReactNode }) {
  return <main className="auth-page">
    <div className="auth-topbar"><Link href="/" className="brand-mark">gate<span>.</span></Link><Link href="/" className="back-home">Back to home <span aria-hidden="true">↗</span></Link></div>
    <div className="auth-layout">
      <aside className="auth-story"><div className="story-badge"><span className="story-dot"/> CREATOR-FIRST BY DESIGN</div><h2>Your attention.<br/><em>Your rules.</em></h2><p>One simple link for people who want to reach you with intention. No extra app. No noisy inbox.</p><div className="story-bottom"><div className="mini-avatars"><span>O</span><span>A</span><span>K</span><b>+</b></div><span>Made for creators building on their own terms.</span></div><div className="story-orbit orbit-one"/><div className="story-orbit orbit-two"/></aside>
      <section className="auth-card-wrap"><div className="auth-card"><div className="mobile-brand"><span className="brand-mark">gate<span>.</span></span><span className="mobile-brand-tag">Creator tools, made simple</span></div><div className="auth-heading"><p className="auth-eyebrow">{eyebrow}</p><h1>{title}</h1><p>{description}</p></div>{children}<div className="auth-card-footer">{footer}</div></div><p className="auth-legal">By continuing, you agree to our <a href="#terms">Terms</a> and <a href="#privacy">Privacy Policy</a>.</p></section>
    </div>
  </main>;
}

export function AuthInput({ label, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return <label className="field-label">{label}<input className="auth-input" {...props}/></label>;
}
