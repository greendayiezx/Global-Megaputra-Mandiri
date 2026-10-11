/** Work portals render their own shell (sidebar + top bar) instead of the marketplace chrome. */
export const PORTAL_PREFIXES = ['/admin', '/provider-dashboard'] as const;

export function isPortalPath(pathname: string) {
  return PORTAL_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * View-transition types for links that cross between the public site and a portal; the
 * portal layouts and globals.css animate only these crossings.
 */
export const PORTAL_ENTER = ['portal-enter'];
export const PORTAL_EXIT = ['portal-exit'];
