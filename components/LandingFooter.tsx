import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { appUrl } from './AuthAwareCtaButton';
import { BookDemoButton } from './BookDemoButton';
import { ContactButton } from './ContactButton';
import { CONSUMER_CONTACTS_URL, LANDING_PLATFORM_DOC_URL } from './landingLinks';

interface FooterColumn {
  title: string;
  links: string[];
}

/**
 * Footer (2026 landing redesign) — dark band. Left: logo + tagline +
 * one-line description. Right: three link columns wired to real targets
 * (平台 → in-page anchors; 开始 → app / consumer / demo modal / docs;
 * 公司 → mailto). Links to other sites open in a new tab; the 预约演示
 * entry opens the booking modal. Bottom: legal entity + ICP filing.
 */
const HREFS: string[][] = [
  // 平台
  ['#live-four', '#capabilities', '#how-it-works', '#connectors'],
  // 开始
  [appUrl('/login'), CONSUMER_CONTACTS_URL, '__demo__', LANDING_PLATFORM_DOC_URL],
  // 公司 — all open the contact popup
  ['__contact__', '__contact__', '__contact__'],
];

function FooterLink({ href, label }: { href: string; label: string }) {
  const cls = 'text-[13px] text-white/55 transition-colors hover:text-white';
  if (href === '__demo__') {
    return <BookDemoButton className={cls}>{label}</BookDemoButton>;
  }
  if (href === '__contact__') {
    return <ContactButton className={cls}>{label}</ContactButton>;
  }
  const external = href.startsWith('http');
  return (
    <a
      href={href}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className={cls}
    >
      {label}
    </a>
  );
}

export function LandingFooter() {
  const t = useTranslations('landing.footer');
  const columns = t.raw('columns') as FooterColumn[];
  const year = 2026;

  return (
    <footer className="snap-end border-t border-line-dark bg-night text-white/70">
      <div className="mx-auto max-w-[1240px] px-6 py-14 2xl:max-w-[1440px]">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          {/* Brand block */}
          <div className="max-w-[360px]">
            <div className="flex items-center gap-2">
              <Image
                src="/landing/logo-icon.svg"
                alt=""
                width={36}
                height={36}
                className="h-9 w-9 brightness-0 invert"
              />
              <span className="font-display text-[18px] font-semibold text-white">
                {t('brand')}
              </span>
              <span className="ml-1 text-[11px] tracking-[2px] text-white/45">{t('brandTag')}</span>
            </div>
            <p className="mt-4 text-[13px] leading-[22px] text-white/55">{t('brandDesc')}</p>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 sm:gap-16">
            {columns.map((col, ci) => (
              <div key={col.title}>
                <p className="mb-4 text-[13px] font-semibold text-white">{col.title}</p>
                <ul className="space-y-3">
                  {col.links.map((link, li) => (
                    <li key={link}>
                      <FooterLink href={HREFS[ci]?.[li] ?? '#'} label={link} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Legal row */}
        <div className="mt-12 flex flex-col items-center gap-2 border-t border-line-dark pt-6 text-center text-[12px] text-white/45 sm:flex-row sm:justify-between sm:text-left">
          <p>{t('legal', { year })}</p>
          <a
            href="https://beian.miit.gov.cn/#/Integrated/index"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-white/80"
          >
            {t('icpLabel')}
          </a>
        </div>
      </div>
    </footer>
  );
}
