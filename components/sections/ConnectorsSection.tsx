import { useTranslations } from 'next-intl';
import { CONN_LOGOS } from './connectorLogos';

/**
 * 系统连接器 — centered header + 3×2 grid of 6 connector cards + trust pill.
 * Each card shows the real paired brand marks (lifted from the design,
 * see connectorLogos.ts) on the left and name/status/desc on the right.
 */

type StatusKey = 'online' | 'comingSoon';

type ConnectorItem = {
  key: string;
  name: string;
  status: StatusKey;
  desc: string;
};

const STATUS_STYLE: Record<StatusKey, string> = {
  online: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
  comingSoon: 'bg-honey/10 text-honey-deep',
};

export function ConnectorsSection() {
  const t = useTranslations('landing.connectors');
  const items = t.raw('items') as ConnectorItem[];
  const renderConnectorLogos = (key: string) => {
    if (key === 'wecom') {
      return (
        <div className="conn-logos shrink-0" aria-hidden>
          <span className="lt" title="企业微信">
            <img src="landing/connectors/wecom.svg" alt="" loading="lazy" decoding="async" />
          </span>
          <span className="lt" title="飞书">
            <img src="landing/connectors/feishu.svg" alt="" loading="lazy" decoding="async" />
          </span>
        </div>
      );
    }

    if (key === 'tikhub') {
      return (
        <div className="conn-logos shrink-0" aria-hidden>
          <span className="lt" title="TikHub">
            <img src="landing/connectors/tikhub.svg" alt="" loading="lazy" decoding="async" />
          </span>
          <span className="lt" title="抖音商家号">
            <svg viewBox="0 0 24 24">
              <path
                fill="#25F4EE"
                transform="translate(-1 -.6)"
                d="M13 4c.2 2.4 1.9 4 4 4.3v2.8c-1.4-.1-2.8-.6-3.9-1.4v5.1a4.6 4.6 0 11-3-4.3V4z"
              />
              <path
                fill="#FE2C55"
                transform="translate(1 .6)"
                d="M13 4c.2 2.4 1.9 4 4 4.3v2.8c-1.4-.1-2.8-.6-3.9-1.4v5.1a4.6 4.6 0 11-3-4.3V4z"
              />
              <path
                fill="#0A0A0A"
                d="M13 4c.2 2.4 1.9 4 4 4.3v2.8c-1.4-.1-2.8-.6-3.9-1.4v5.1a4.6 4.6 0 11-3-4.3V4z"
              />
            </svg>
          </span>
        </div>
      );
    }

    return (
      <div
        className="conn-logos shrink-0"
        aria-hidden
        dangerouslySetInnerHTML={{ __html: CONN_LOGOS[key] ?? '' }}
      />
    );
  };

  return (
    <section
      id="connectors"
      data-stack-motion
      data-short-screen-fit
      data-motion-style="weave"
      className="relative flex min-h-screen snap-start flex-col justify-center overflow-hidden bg-[#fbf7ee] py-20 md:py-24"
    >
      <div className="relative z-10 mx-auto max-w-[1240px] 2xl:max-w-[1440px] px-6">
        {/* Header */}
        <div
          className="mb-12 flex flex-col items-center text-center 2xl:mb-20"
          data-motion="header"
        >
          <span className="section-kicker">
            <span className="section-kicker-dot" />
            {t('eyebrow')}
          </span>
          <h2 className="mt-5 text-[26px] font-semibold leading-[1.18] text-ink sm:text-[40px] sm:leading-[1.14] md:text-[50px] 2xl:text-[58px]">
            {t('title')}
          </h2>
          <p className="mx-auto mt-4 max-w-[680px] text-ink/55 2xl:text-[17px]">{t('subtitle')}</p>
        </div>

        {/* 6-card grid (3 cols × 2 rows on desktop) */}
        <div
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:gap-7"
          data-motion="group"
        >
          {items.map(item => (
            <article
              key={item.key}
              className="glass-surface flex items-center gap-4 rounded-[16px] border border-line bg-[#fffdf7] p-5 transition-shadow hover:shadow-[0_6px_24px_rgba(34,28,19,.07)] 2xl:gap-5 2xl:p-7"
            >
              {renderConnectorLogos(item.key)}
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[15px] font-semibold text-ink 2xl:text-[17px]">
                    {item.name}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLE[item.status]}`}
                  >
                    {t(`status.${item.status}`)}
                  </span>
                </div>
                <p className="mt-1 text-[13px] leading-relaxed text-ink/55 2xl:mt-1.5 2xl:text-[15px]">
                  {item.desc}
                </p>
              </div>
            </article>
          ))}
        </div>

        {/* Trust pill */}
        <div className="mt-10 flex justify-center 2xl:mt-16">
          <div className="inline-flex items-center gap-2.5 rounded-full bg-honey/[0.08] px-5 py-2.5 text-[13px] text-ink/70">
            <span className="hex-clip h-4 w-4 shrink-0 bg-honey" />
            {t('trustPill')}
          </div>
        </div>
      </div>
    </section>
  );
}
