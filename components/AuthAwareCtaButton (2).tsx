import type { MouseEventHandler, ReactNode } from 'react';

/**
 * Static-site CTA that hands off to the webapp.
 *
 * The standalone landing has no AuthContext. Instead of duplicating
 * auth state here, every CTA navigates to a webapp route — the
 * webapp's `(app)` layout redirects unauthenticated visitors to
 * /login, then /login bounces them back to the requested page after
 * auth. So passing `path="/zh-CN/studio"` does the right thing for
 * both signed-in and signed-out users.
 *
 * The webapp host comes from `NEXT_PUBLIC_APP_URL`, baked at build
 * time (set in CI per env, e.g. `https://app.openhex.tech`). Defaults
 * to a relative path in dev so local landing builds still link
 * somewhere reachable.
 */
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/$/, '');

/** Build a webapp URL for a given path (e.g. "/zh-CN/studio"). */
export function appUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return APP_URL ? `${APP_URL}${normalized}` : normalized;
}

export const APP_LOGIN_URL = appUrl('/login');

interface Props {
  /**
   * Webapp path to navigate to (defaults to /login). Webapp's `(app)`
   * layout will redirect unauthenticated users to /login, so callers
   * can safely pass gated routes like /zh-CN/studio or /zh-CN/chat.
   */
  path?: string;
  className?: string;
  children: ReactNode;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
}

export function AuthAwareCtaButton({ path = '/login', className, children, onClick }: Props) {
  return (
    <a
      href={appUrl(path)}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={onClick}
    >
      {children}
    </a>
  );
}
