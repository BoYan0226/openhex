/**
 * Apply admin-edited translation overrides on top of the static next-intl
 * messages. Overrides are stored in the mysta-server's translation_overrides
 * table and edited via admin-webapp's 翻译 tab.
 *
 * No server-side caching — Next.js fetch deduplicates within a single
 * render, and our traffic is low enough that a per-request DB hit through
 * mysta-server is fine. We can add `unstable_cache` later if needed.
 *
 * Failure mode: any error returns the JSON-only messages unchanged so a
 * backend outage never breaks i18n.
 */

type Messages = Record<string, unknown>;

interface OverridesResponse {
  locale: string;
  map: Record<string, string>;
  version: number;
}

const FETCH_TIMEOUT_MS = 1500;

function getApiBase(): string {
  // Server-side render only — must use BACKEND_API_URL (in-cluster) when set.
  // Falls back to NEXT_PUBLIC_API_URL for local dev where webapp talks to a
  // public backend, then to the relative /api proxy as last resort.
  return process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || '';
}

async function fetchOverrideMap(locale: string): Promise<Record<string, string>> {
  const base = getApiBase();
  if (!base) return {};
  const url = `${base.replace(/\/$/, '')}/api/v2/translations?locale=${encodeURIComponent(locale)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      // Defer to the upstream Cache-Control header. mysta-server sets
      // max-age=30, which is what we want here.
      cache: 'no-store',
    });
    if (!res.ok) return {};
    const json = (await res.json()) as OverridesResponse;
    return json.map ?? {};
  } catch {
    return {};
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Set `tree.a.b.c = value` from key `'a.b.c'`. Mutates `tree`. Skips when
 * a non-object segment already occupies an intermediate path (e.g. an
 * override key shadows a leaf — drop it rather than corrupt the tree).
 */
function setDeep(tree: Record<string, unknown>, key: string, value: string): void {
  const parts = key.split('.');
  let node: Record<string, unknown> = tree;
  for (let i = 0; i < parts.length - 1; i++) {
    const seg = parts[i];
    const existing = node[seg];
    if (existing && typeof existing === 'object' && !Array.isArray(existing)) {
      node = existing as Record<string, unknown>;
    } else if (existing == null) {
      const fresh: Record<string, unknown> = {};
      node[seg] = fresh;
      node = fresh;
    } else {
      // A leaf string already lives where we'd need an object — skip the
      // override rather than break the existing structure.
      return;
    }
  }
  node[parts[parts.length - 1]] = value;
}

export async function applyTranslationOverrides(
  locale: string,
  baseMessages: Messages
): Promise<Messages> {
  const map = await fetchOverrideMap(locale);
  if (!map || Object.keys(map).length === 0) return baseMessages;

  // Shallow clone the top level + deep clone the namespaces we touch. JSON
  // round-trip is fine — messages are pure data.
  const merged = JSON.parse(JSON.stringify(baseMessages)) as Record<string, unknown>;
  for (const [key, text] of Object.entries(map)) {
    if (typeof text !== 'string') continue;
    setDeep(merged, key, text);
  }
  return merged;
}
