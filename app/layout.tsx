import type { Metadata, Viewport } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { publicPath } from '@/components/publicPath';
import './css/style.css';

/**
 * Both families are reduced to the glyphs used by this site and served
 * from the same origin. This keeps the original type design without a
 * late cross-origin font swap on the first screen.
 */
const sansFontPath = publicPath('/fonts/openhex-sans-vf.woff2');
const latinFontPath = publicPath('/fonts/openhex-latin-vf.woff2');
const localFontFaces = `
  @font-face {
    font-family: 'OpenHex Sans';
    src: url('${sansFontPath}') format('woff2');
    font-style: normal;
    font-weight: 100 900;
    font-display: swap;
  }
  @font-face {
    font-family: 'OpenHex Latin';
    src: url('${latinFontPath}') format('woff2');
    font-style: normal;
    font-weight: 100 900;
    font-display: swap;
    size-adjust: 106%;
  }
  @font-face {
    font-family: 'OpenHex Latin Fallback';
    src: local('Arial');
    ascent-override: 90%;
    descent-override: 22.43%;
    line-gap-override: 0%;
    size-adjust: 113.72%;
  }
`;

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
    <html lang="zh-CN" className="scroll-smooth">
      <head>
        <link
          rel="preload"
          href={sansFontPath}
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href={latinFontPath}
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <style>{localFontFaces}</style>
      </head>
      <body className="bg-paper text-ink antialiased">
        <NextIntlClientProvider messages={messages} locale="zh-CN">
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
