/** OpenHex product documentation site. Used by the "了解平台能力" /
 *  "Learn more" landing CTAs. Keep here so updating the doc URL is a
 *  single edit. */
export const LANDING_PLATFORM_DOC_URL = (
  process.env.NEXT_PUBLIC_DOCS_URL || 'https://docs.openhex.tech'
).replace(/\/$/, '');

/** OpenHex app sign-in used by the primary landing-page CTAs. */
export const LANDING_LOGIN_URL = 'https://app.openhex.tech/login';

/** Consumer (使用端) app — where end users browse + chat with Live Agents.
 *  CI sets NEXT_PUBLIC_AGENT_WEBAPP_ORIGIN per env; default to prod. */
const CONSUMER_ORIGIN = (
  process.env.NEXT_PUBLIC_AGENT_WEBAPP_ORIGIN || 'https://agent.openhex.tech'
).replace(/\/$/, '');

/** "浏览 Live Agent" → the consumer-side contacts/agents list. */
export const CONSUMER_CONTACTS_URL = `${CONSUMER_ORIGIN}/contacts`;
