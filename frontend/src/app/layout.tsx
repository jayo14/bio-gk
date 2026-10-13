import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://biogatekeeper.ng';

export const viewport: Viewport = {
  themeColor: '#5B45E0',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'Bio Gatekeeper — Get Closer to Your Favourite Creators',
    template: '%s | Bio Gatekeeper',
  },
  description:
    'Mobile-first creator monetization for Nigerian & African creators. Paid priority messages, quick tips, and public Odogwu leaderboard with direct Paystack bank payouts.',
  keywords: [
    'Bio Gatekeeper',
    'creator monetization',
    'Nigerian creators',
    'Paystack monetization',
    'paid DMs',
    'priority message',
    'creator tip jar',
    'Odogwu wall',
    'African creators',
    'bio link Nigeria',
  ],
  authors: [{ name: 'Bio Gatekeeper', url: BASE_URL }],
  creator: 'Bio Gatekeeper',
  publisher: 'Bio Gatekeeper',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Bio Gatekeeper — Get Closer to Your Favourite Creators',
    description:
      'Support your favourite creators directly. Send priority messages and tips without downloading any app.',
    url: BASE_URL,
    siteName: 'Bio Gatekeeper',
    locale: 'en_NG',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bio Gatekeeper — Get Closer to Your Favourite Creators',
    description:
      'Support your favourite creators directly. Send priority messages and tips without downloading any app.',
    creator: '@BioGatekeeper',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${BASE_URL}/#organization`,
      name: 'Bio Gatekeeper',
      url: BASE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${BASE_URL}/icon.png`,
      },
      description: 'Mobile-first creator monetization platform for African independent creators.',
      sameAs: [
        'https://instagram.com',
        'https://twitter.com',
        'https://tiktok.com',
      ],
    },
    {
      '@type': 'WebSite',
      '@id': `${BASE_URL}/#website`,
      url: BASE_URL,
      name: 'Bio Gatekeeper',
      publisher: {
        '@id': `${BASE_URL}/#organization`,
      },
      description: 'Direct creator monetization with Paystack checkout.',
    },
    {
      '@type': 'SoftwareApplication',
      name: 'Bio Gatekeeper',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Any Web Browser',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'NGN',
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        {children}
        <Toaster position="top-right" closeButton />
      </body>
    </html>
  );
}
