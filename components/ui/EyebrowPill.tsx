/** Yellow-tinted rounded pill that introduces every section ("产品特性",
 *  "使用流程", etc). Used 6 times in the original page.tsx; extracted so a
 *  future style/copy change is one-touch. */
export function EyebrowPill({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center rounded-full bg-[rgba(241,212,34,0.15)] border border-[rgba(241,212,34,0.4)] px-4 py-1.5">
      <span className="text-[12px] font-semibold tracking-wider uppercase text-[#8a6f00]">
        {children}
      </span>
    </div>
  );
}
