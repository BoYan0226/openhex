'use client';

import Image from 'next/image';
import { MessageCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { publicPath } from './publicPath';

export function CustomerServiceDock() {
  const [isOpen, setIsOpen] = useState(false);
  const dockRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    const closeOnOutsidePress = (event: PointerEvent) => {
      if (event.target instanceof Node && !dockRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('pointerdown', closeOnOutsidePress);
    window.addEventListener('keydown', closeOnEscape);

    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePress);
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [isOpen]);

  return (
    <div
      ref={dockRef}
      className="customer-service-dock"
      data-open={isOpen ? 'true' : 'false'}
    >
      <div className="customer-service-qr-card" id="customer-service-qr">
        <div className="customer-service-qr-label">
          <span aria-hidden />
          微信客服
        </div>
        <Image
          src={publicPath('/landing/customer-service-qr.png')}
          alt="OpenHex 微信客服二维码"
          width={220}
          height={220}
          className="customer-service-qr-image"
        />
      </div>

      <button
        type="button"
        className="customer-service-trigger"
        aria-expanded={isOpen}
        aria-controls="customer-service-qr"
        onClick={() => setIsOpen(value => !value)}
      >
        <span className="customer-service-trigger-icon" aria-hidden>
          <MessageCircle size={17} strokeWidth={1.9} />
        </span>
        <span>在线客服</span>
        <span className="customer-service-status" aria-hidden />
      </button>
    </div>
  );
}
