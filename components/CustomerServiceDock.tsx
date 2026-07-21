'use client';

import Image from 'next/image';
import { ChatWidget } from '@openhex-ai/agent-sdk/react';
import { MessageCircle } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { publicPath } from './publicPath';

const AGENT_ID =
  process.env.NEXT_PUBLIC_OPENHEX_AGENT_ID ?? '56941e40-47ad-49b0-bf88-cb8845b06c0e';
const API_BASE = process.env.NEXT_PUBLIC_OPENHEX_API_BASE ?? 'https://api.openhex.tech';
const CONFIGURED_TOKEN_URL = process.env.NEXT_PUBLIC_OPENHEX_CHAT_TOKEN_URL;

type CachedToken = {
  exp: number;
  token: string;
};

export function CustomerServiceDock() {
  const [isOpen, setIsOpen] = useState(false);
  const tokenCache = useRef<CachedToken | null>(null);

  const getToken = useCallback(async () => {
    const now = Date.now();
    if (tokenCache.current && tokenCache.current.exp - now > 60_000) {
      return tokenCache.current.token;
    }

    const tokenUrl =
      CONFIGURED_TOKEN_URL ??
      (window.location.hostname.endsWith('github.io')
        ? 'https://www.openhex.tech/api/openhex/chat-token'
        : '/api/openhex/chat-token');
    const response = await fetch(tokenUrl, {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`chat-token ${response.status}`);
    }

    const data = (await response.json()) as { expiresAt: string; token: string };
    tokenCache.current = {
      exp: new Date(data.expiresAt).getTime(),
      token: data.token,
    };
    return data.token;
  }, []);

  return (
    <>
      <div
        className="customer-service-qr-dock"
        data-open={isOpen ? 'true' : 'false'}
      >
        <div className="customer-service-qr-card">
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
      </div>

      <ChatWidget
        agentId={AGENT_ID}
        baseUrl={API_BASE}
        getToken={getToken}
        persist
        senderName="网站访客"
        title="大顺 · 在线客服"
        subtitle="OpenHex 运营团队"
        greeting="你好 👋 我是大顺，OpenHex 的智能客服。产品能做什么、怎么接入、报价多少，都可以直接问我～"
        placeholder="输入你的问题…"
        accentColor="#f1d422"
        launcherLabel="在线客服"
        launcherIcon={
          <span className="customer-service-launcher-content" aria-hidden>
            <span className="customer-service-launcher-icon">
              <MessageCircle size={17} strokeWidth={1.9} />
            </span>
            <span>在线客服</span>
            <span className="customer-service-status" />
          </span>
        }
        open={isOpen}
        onOpenChange={setIsOpen}
      />
    </>
  );
}
