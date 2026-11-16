// A link straight to one listing: <site>/?listing=<id>. The site is static, so this is just a
// query string the app reads on load to open that listing.
const PARAM = "listing";

export const siteUrl = () => `${window.location.origin}${import.meta.env.BASE_URL}`;

export function listingIdFromUrl(search: string): string | null {
  const id = new URLSearchParams(search).get(PARAM);
  return id && /^[a-z0-9-]+$/.test(id) ? id : null;
}

export const listingUrl = (id: string) => `${siteUrl()}?${PARAM}=${encodeURIComponent(id)}`;

// Keeps the address bar in step with the open listing, without adding history entries.
export function setListingInUrl(id: string | null): void {
  const url = new URL(window.location.href);
  if (id) url.searchParams.set(PARAM, id);
  else url.searchParams.delete(PARAM);
  if (url.href !== window.location.href) window.history.replaceState(null, "", url);
}
