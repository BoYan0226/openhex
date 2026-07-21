/**
 * Landing site config.
 *
 * - Local/Docker builds use `standalone`.
 * - GitHub Pages builds use a static export under the repository base path.
 * - next-intl loads zh-CN messages via i18n/request.ts.
 */
const createNextIntlPlugin = require('next-intl/plugin');
const withNextIntl = createNextIntlPlugin('./i18n/request.ts');
const isGitHubPages = process.env.GITHUB_PAGES === 'true';
const pagesBasePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: isGitHubPages ? 'export' : 'standalone',
  basePath: isGitHubPages ? pagesBasePath : '',
  trailingSlash: isGitHubPages,
  images: {
    unoptimized: isGitHubPages,
  },
  reactStrictMode: true,
  ...(isGitHubPages
    ? {}
    : {
        async rewrites() {
          return [
            {
              source: '/api/openhex/chat-token',
              destination: 'https://www.openhex.tech/api/openhex/chat-token',
            },
          ];
        },
      }),
};

module.exports = withNextIntl(nextConfig);
