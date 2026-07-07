import { EyebrowPill } from './EyebrowPill';

/** Centered eyebrow + h2 + (optional) subtitle. The recurring header
 *  shape used by every content section below the hero. */
export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  size = 'md',
}: {
  eyebrow: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  size?: 'md' | 'lg';
}) {
  // Two presets — most sections use the medium scale; the "三大核心模块"
  // section bumps the headline a notch larger.
  const titleClass =
    size === 'lg'
      ? 'text-[40px] md:text-[64px] font-semibold mb-4'
      : 'text-[40px] md:text-[56px] font-semibold mb-3';
  return (
    <div className="text-center mb-12">
      <div className="mb-4">
        <EyebrowPill>{eyebrow}</EyebrowPill>
      </div>
      <h2 className={titleClass}>{title}</h2>
      {subtitle ? (
        <p className="text-[14px] text-[rgba(51,51,51,0.6)] max-w-[842px] mx-auto">{subtitle}</p>
      ) : null}
    </div>
  );
}
