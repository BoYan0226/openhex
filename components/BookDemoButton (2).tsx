'use client';

import { useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/**
 * Self-contained "预约演示" button + popup. Clicking opens a wide modal
 * that plays the 创建 agent 实时演示 video (≈3:19). Each instance owns its
 * open state, so it drops into nav, hero and the final CTA alike.
 *
 * The video lives on the platform media bucket (mysta-media) and is
 * served via the media.mysta.tech CDN with a long-lived (~10y) signed
 * URL — the same private-bucket + signed-URL scheme the rest of the
 * product uses (publish_file_public). If the OSS access key is ever
 * rotated this URL must be re-signed.
 */
const DEMO_VIDEO_SRC =
  'https://media.mysta.tech/landing/demo-create-agent.mp4?OSSAccessKeyId=LTAI5tBmNpFvYveomrqw52XM&Expires=2097470395&Signature=YuAh6vu2u7sbAYaSx2x5%2FbNoWkQ%3D';

export function BookDemoButton({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        {children}
      </button>

      {open && typeof document !== 'undefined'
        ? createPortal(
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
              onClick={() => setOpen(false)}
            >
              <div
                className="relative w-full max-w-[min(1280px,calc((100dvh_-_2rem)*16/9))]"
                onClick={e => e.stopPropagation()}
              >
                <button
                  type="button"
                  aria-label="关闭"
                  onClick={() => setOpen(false)}
                  className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-white/40 text-white/80 transition-colors hover:bg-white/10 hover:text-white 2xl:right-0 2xl:top-0 2xl:translate-x-[calc(100%_+_16px)]"
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="overflow-hidden rounded-[9px] bg-black">
                  <video
                    src={DEMO_VIDEO_SRC}
                    controls
                    autoPlay
                    playsInline
                    preload="metadata"
                    className="aspect-video w-full"
                  />
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
