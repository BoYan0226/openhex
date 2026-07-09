'use client';

import { useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { X } from 'lucide-react';
import { publicPath } from './publicPath';

const CONTACT_EMAIL = 'contact@openhex.tech';

// 大顺 小程序码 — staging vs prod by env (same asset as the demo popup)
const DAXUN_QR_SRC = (process.env.NEXT_PUBLIC_APP_URL || '').includes('staging')
  ? publicPath('/landing/daxun-qr-staging.png')
  : publicPath('/landing/daxun-qr.png');

/**
 * Footer 公司 entries (关于我们 / 联系合作 / 加入我们) — there are no
 * standalone pages yet, so each opens a small popup. 大顺 (the OpenHex
 * 管家 Live Agent) QR is the primary contact — scan to talk about
 * 合作 / 加入 / 咨询 right away — with the contact mailbox as a fallback.
 */
export function ContactButton({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        {children}
      </button>

      {open && typeof document !== 'undefined'
        ? createPortal(
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
              onClick={() => setOpen(false)}
            >
              <div
                className="relative w-full max-w-[360px] rounded-[20px] border border-line bg-paper p-7 text-center shadow-[0_30px_80px_rgba(34,28,19,.3)]"
                onClick={e => e.stopPropagation()}
              >
                <button
                  type="button"
                  aria-label="关闭"
                  onClick={() => setOpen(false)}
                  className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-ink/40 transition-colors hover:bg-black/[0.05] hover:text-ink"
                >
                  <X className="h-4 w-4" />
                </button>

                <h3 className="text-[20px] font-bold text-ink">联系我们</h3>
                <p className="mx-auto mt-1.5 max-w-[260px] text-[13px] leading-relaxed text-ink/55">
                  合作、加入、其他咨询，扫码联系大顺，在线沟通最快。
                </p>

                {/* 大顺 小程序码 — primary contact */}
                <div className="mx-auto mt-5 size-[190px] rounded-[14px] border border-line bg-white p-2">
                  <Image
                    src={DAXUN_QR_SRC}
                    alt="大顺 Live Agent 小程序码"
                    width={172}
                    height={172}
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-honey/12 px-3 py-1.5 text-[12px] text-honey-deep">
                  <span className="hex-clip h-2.5 w-2.5 bg-honey" />
                  微信 / 相机 扫码即可对话
                </div>

                {/* divider */}
                <div className="my-5 flex items-center gap-3 text-[12px] text-ink/35">
                  <span className="h-px flex-1 bg-line" />
                  或邮件联系
                  <span className="h-px flex-1 bg-line" />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(CONTACT_EMAIL).then(
                      () => {
                        setCopied(true);
                        setTimeout(() => setCopied(false), 1800);
                      },
                      () => {}
                    );
                  }}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-honey text-[15px] font-semibold text-ink transition-colors hover:bg-honey-soft"
                >
                  {copied ? '已复制邮箱' : CONTACT_EMAIL}
                </button>
                <p className="mt-2 text-[12px] text-ink/40">点击上方复制邮箱</p>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
