'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { AuthAwareCtaButton } from './AuthAwareCtaButton';
import { BookDemoButton } from './BookDemoButton';
import { LANDING_PLATFORM_DOC_URL } from './landingLinks';

interface NavItem {
  slug: string;
  label: string;
}

/**
 * Top nav (2026 landing redesign).
 *
 *  - 64px tall, full-bleed, translucent cream with backdrop blur
 *  - Logo block (icon + wordmark + 迷境智塔旗下 tagline) anchored left
 *  - Nav links centred against the viewport (true geometric centre,
 *    independent of the logo / right-slot widths)
 *  - Right slot: ghost "看 60 秒演示" + brand-amber "创建我的 Live Agent"
 *    (CTA hands off to the webapp via AuthAwareCtaButton)
 */
export function LandingNav() {
  const t = useTranslations('landing.nav');
  const items = t.raw('items') as NavItem[];

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 h-16 border-b border-line bg-paper/80 backdrop-blur-[6px]">
      <div className="relative mx-auto flex h-full max-w-[1240px] 2xl:max-w-[1440px] items-center px-5">
        {/* Logo: icon + wordmark + 迷境智塔旗下 tagline */}
        <a href="/" className="flex shrink-0 items-center" aria-label="OpenHex">
          <Image
            src="/landing/logo-icon.svg"
            alt=""
            width={52}
            height={52}
            priority
            className="h-[44px] w-[44px] shrink-0"
          />
          <div className="inline-grid grid-cols-[max-content] grid-rows-[max-content] place-items-start leading-[0]">
            <Image
              src="/landing/logo-wordmark.svg"
              alt="OpenHex"
              width={114}
              height={24}
              priority
              className="col-start-1 row-start-1 block h-[21px] w-[104px]"
            />
            <p className="col-start-1 row-start-1 ml-[3px] mt-[20px] whitespace-nowrap text-[9px] font-medium leading-[1.5] tracking-[8.4px] text-ink/70">
              迷境智塔旗下
            </p>
          </div>
        </a>

        {/* Centred nav links — absolutely positioned to the viewport. */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 lg:block">
          <div className="pointer-events-auto flex h-9 items-center gap-1">
            {items.map(item => (
              <a
                key={item.slug}
                href={`#${item.slug}`}
                className="flex h-9 items-center justify-center rounded-[10px] px-4 text-[14px] font-medium text-ink/80 transition-colors hover:bg-ink/5 hover:text-ink"
              >
                {item.label}
              </a>
            ))}
            {/* 技术文档 — external docs site, sits after 适合谁 */}
            <a
              href={LANDING_PLATFORM_DOC_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-9 items-center justify-center rounded-[10px] px-4 text-[14px] font-medium text-ink/80 transition-colors hover:bg-ink/5 hover:text-ink"
            >
              {t('docsLink')}
            </a>
          </div>
        </div>

        {/* Right slot: ghost demo link + brand CTA. */}
        <div className="ml-auto flex items-center gap-2">
          <BookDemoButton className="hidden h-9 items-center rounded-[10px] px-3 text-[14px] font-medium text-ink/70 transition-colors hover:bg-ink/5 hover:text-ink sm:inline-flex">
            {t('demoCta')}
          </BookDemoButton>
          <AuthAwareCtaButton
            path="/login"
            className="inline-flex h-9 items-center rounded-full bg-honey px-4 text-[13px] font-semibold text-ink shadow-[0_2px_10px_rgba(241,212,34,0.4)] transition-colors hover:bg-honey-soft"
          >
            {t('primaryCta')}
          </AuthAwareCtaButton>
        </div>
      </div>
    </nav>
  );
}
