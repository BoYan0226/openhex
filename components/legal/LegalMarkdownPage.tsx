'use client';

import { useEffect, useState, type ComponentPropsWithoutRef, type JSX } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { publicPath } from '@/components/publicPath';

type LegalDoc = 'privacy' | 'tos';
type MarkdownElementProps<T extends keyof JSX.IntrinsicElements> = ComponentPropsWithoutRef<T> & {
  node?: unknown;
};

/**
 * Legal page renderer. Locale used to be picked up from the deleted
 * `useI18n()` provider; now hardcoded to `zh` since the static landing
 * is single-language. If we ever ship English again, swap to a route
 * group like `/en/privacy` and read locale from the URL segment.
 */
export default function LegalMarkdownPage({ doc }: { doc: LegalDoc }) {
  const fallbackLocale = 'zh';

  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchContent = async () => {
      try {
        const suffix = fallbackLocale === 'zh' ? '.zh' : '';
        const response = await fetch(publicPath(`/content/${doc}${suffix}.md`));

        if (!response.ok) {
          throw new Error(`Unable to load ${doc} content (${fallbackLocale}).`);
        }

        const text = await response.text();
        if (isMounted) {
          setContent(text);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError((err as Error).message);
        }
      }
    };

    fetchContent();

    return () => {
      isMounted = false;
    };
  }, [doc, fallbackLocale]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-green-50 py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800">
            <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            {fallbackLocale === 'zh' ? '返回首页' : 'Back to Home'}
          </Link>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-lg md:p-12">
          {error ? (
            <p className="text-red-600">{error}</p>
          ) : (
            <article className="prose prose-slate max-w-none lg:prose-lg">
              <ReactMarkdown
                components={{
                  h1: ({ node: _node, style: _style, ...props }: MarkdownElementProps<'h1'>) => (
                    <h1 className="mb-6 text-3xl font-bold" {...props} />
                  ),
                  h2: ({ node: _node, style: _style, ...props }: MarkdownElementProps<'h2'>) => (
                    <h2 className="mt-8 mb-4 text-2xl font-semibold" {...props} />
                  ),
                  h3: ({ node: _node, style: _style, ...props }: MarkdownElementProps<'h3'>) => (
                    <h3 className="mt-6 mb-3 text-xl font-semibold" {...props} />
                  ),
                  p: ({ node: _node, style: _style, ...props }: MarkdownElementProps<'p'>) => (
                    <p className="mb-4 leading-relaxed" {...props} />
                  ),
                  ul: ({ node: _node, style: _style, ...props }: MarkdownElementProps<'ul'>) => (
                    <ul className="mb-4 list-disc pl-6" {...props} />
                  ),
                  ol: ({ node: _node, style: _style, ...props }: MarkdownElementProps<'ol'>) => (
                    <ol className="mb-4 list-decimal pl-6" {...props} />
                  ),
                  li: ({ node: _node, style: _style, ...props }: MarkdownElementProps<'li'>) => (
                    <li className="mb-2" {...props} />
                  ),
                  a: ({ node: _node, style: _style, ...props }: MarkdownElementProps<'a'>) => (
                    <a className="text-blue-600 underline hover:text-blue-800" {...props} />
                  ),
                }}
              >
                {content || '...'}
              </ReactMarkdown>
            </article>
          )}
        </div>
      </div>
    </div>
  );
}
