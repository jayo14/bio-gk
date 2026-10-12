import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Bio Gatekeeper', description: 'A better way to reach the creators you support.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
