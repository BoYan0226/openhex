import type { Metadata, Viewport } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { Space_Grotesk } from 'next/font/google';
import { publicPath } from '@/components/publicPath';
import './css/style.css';

/**
 * Display typeface from the design — used for the LIVE watermark, the
 * "Live Agent" wordmark, and the big 01/02 step/persona numerals. CJK
 * body copy uses native CJK fonts so the first paint already has the
 * final glyph metrics and never shifts after a remote font loads.
 */
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('landing.metadata');
  return {
    metadataBase: new URL('https://www.openhex.tech'),
    title: t('title'),
    description: t('description'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      images: [publicPath('/landing/bee-mascot.png')],
      type: 'website',
    },
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const messages = await getMessages();
  return (
    <html lang="zh-CN" className={`${spaceGrotesk.variable} scroll-smooth`}>
      <body className="bg-paper text-ink antialiased">
        <NextIntlClientProvider messages={messages} locale="zh-CN">
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
