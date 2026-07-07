import { getRequestConfig } from 'next-intl/server';
import { applyTranslationOverrides } from './overrides';

/**
 * Static next-intl config: hardcoded zh-CN, no locale routing.
 *
 * Layered on top of the JSON: admin-edited overrides from
 * mysta-server's translation_overrides table (managed via admin-webapp's
 * 翻译 tab). Lets ops update landing copy without a redeploy.
 *
 * On any backend hiccup the JSON-only messages are returned unchanged
 * so a server outage never breaks the landing page.
 */
export default getRequestConfig(async () => {
  const baseMessages = (await import('../messages/zh-CN.json')).default;
  const messages = await applyTranslationOverrides('zh-CN', baseMessages);
  return {
    locale: 'zh-CN',
    messages,
  };
});
