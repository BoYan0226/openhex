/**
 * Landing site config.
 *
 * - `output: 'standalone'` produces .next/standalone/ for the Docker image.
 * - next-intl loads zh-CN messages via i18n/request.ts.
 */
const createNextIntlPlugin = require('next-intl/plugin');
const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
};

module.exports = withNextIntl(nextConfig);
