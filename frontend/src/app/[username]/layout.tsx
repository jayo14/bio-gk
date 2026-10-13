import type { Metadata } from 'next';
import { getPublicCreator } from '@/lib/api';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://biogatekeeper.ng';

type Props = {
  params: Promise<{ username: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const cleanUsername = username?.toLowerCase();

  try {
    const creator = await getPublicCreator(cleanUsername);
    const title = `${creator.display_name} (@${creator.username})`;
    const description =
      creator.bio_text ||
      `Support ${creator.display_name} on Bio Gatekeeper. Send paid priority messages, tips, and appear on the Odogwu wall.`;

    const images = creator.avatar_url
      ? [{ url: creator.avatar_url, width: 400, height: 400, alt: creator.display_name }]
      : [];

    return {
      title,
      description,
      alternates: {
        canonical: `/${cleanUsername}`,
      },
      openGraph: {
        title: `${title} | Bio Gatekeeper`,
        description,
        url: `${BASE_URL}/${cleanUsername}`,
        siteName: 'Bio Gatekeeper',
        images,
        type: 'profile',
      },
      twitter: {
        card: 'summary',
        title: `${title} | Bio Gatekeeper`,
        description,
        images: creator.avatar_url ? [creator.avatar_url] : [],
      },
    };
  } catch {
    return {
      title: `@${cleanUsername}`,
      description: `Support @${cleanUsername} on Bio Gatekeeper.`,
      alternates: {
        canonical: `/${cleanUsername}`,
      },
    };
  }
}

export default async function CreatorLayout({ params, children }: Props) {
  const { username } = await params;
  const cleanUsername = username?.toLowerCase();

  let jsonLd = null;
  try {
    const creator = await getPublicCreator(cleanUsername);
    jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'ProfilePage',
      mainEntity: {
        '@type': 'Person',
        name: creator.display_name,
        alternateName: `@${creator.username}`,
        description: creator.bio_text,
        image: creator.avatar_url,
        url: `${BASE_URL}/${cleanUsername}`,
      },
    };
  } catch {
    jsonLd = null;
  }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  );
}
