'use client';

import Image from 'next/image';
import { ArrowUpRight, Mail, MessageCircle, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { LANDING_LOGIN_URL } from './landingLinks';
import { publicPath } from './publicPath';

const CUSTOMER_SERVICE_EMAIL =
  'mailto:contact@openhex.tech?subject=OpenHex%20%E7%BD%91%E7%AB%99%E5%92%A8%E8%AF%A2';

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
      <section
        className="customer-service-panel"
        id="customer-service-panel"
        aria-label="OpenHex 在线客服"
        aria-hidden={!isOpen}
      >
        <header className="customer-service-panel-header">
          <span className="customer-service-panel-mark" aria-hidden>
            <MessageCircle size={18} strokeWidth={1.9} />
          </span>
          <span className="customer-service-panel-title">
            <strong>大顺 · 在线客服</strong>
            <small>
              <span aria-hidden />
              OpenHex 运营团队
            </small>
          </span>
          <button
            type="button"
            className="customer-service-panel-close"
            aria-label="关闭在线客服"
            onClick={() => setIsOpen(false)}
          >
            <X size={17} strokeWidth={1.8} />
          </button>
        </header>

        <div className="customer-service-panel-body">
          <p className="customer-service-message">
            你好，我是大顺。关于产品能力、接入方式和合作方案，都可以直接联系我。
          </p>

          <div className="customer-service-topics" aria-label="可咨询内容">
            <span>产品咨询</span>
            <span>接入支持</span>
            <span>合作沟通</span>
          </div>

          <div className="customer-service-contact-card">
            <Image
              src={publicPath('/landing/customer-service-qr.png')}
              alt="OpenHex 微信客服二维码"
              width={220}
              height={220}
              className="customer-service-panel-qr"
            />
            <span>
              <strong>微信扫码联系</strong>
              <small>添加微信后可直接沟通需求</small>
            </span>
          </div>

          <div className="customer-service-actions">
            <a href={CUSTOMER_SERVICE_EMAIL}>
              <Mail size={15} strokeWidth={1.8} aria-hidden />
              邮件联系
            </a>
            <a href={LANDING_LOGIN_URL} target="_blank" rel="noreferrer">
              进入 OpenHex
              <ArrowUpRight size={15} strokeWidth={1.8} aria-hidden />
            </a>
          </div>
        </div>
      </section>

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
        aria-controls="customer-service-panel customer-service-qr"
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
