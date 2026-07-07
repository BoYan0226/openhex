/**
 * Default-route group layout. The new landing page renders its own
 * LandingNav + LandingFooter inside the page itself (so the snap-scroll
 * container in `page.tsx` owns the whole h-screen viewport), so this
 * layout is just a passthrough. Kept as its own file because the
 * `(legal)` route group has different chrome (markdown layout) and
 * we want to keep the route-group separation.
 */
export default function DefaultLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
