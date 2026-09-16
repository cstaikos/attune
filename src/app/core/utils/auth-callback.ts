export function emailCallback(url: URL) {
  const query = url.searchParams;
  const fragment = new URLSearchParams(url.hash.slice(1));
  return {
    code: query.get("code") || "",
    tokens: {
      access_token: fragment.get("access_token") || "",
      refresh_token: fragment.get("refresh_token") || "",
    },
    recovery: query.get("recovery") === "1" || fragment.get("type") === "recovery",
    error: query.has("error") || fragment.has("error") || fragment.has("error_code"),
  };
}

// Email links generated outside the app can fall back to Auth's site URL.
// Route them before Angular's member guard can discard the credentials.
export function emailCallbackPath(url: URL): string | null {
  const callback = emailCallback(url);
  if (!callback.code && !callback.tokens.access_token &&
      !callback.tokens.refresh_token && !callback.error) return null;
  return `/auth/callback${url.search}${url.hash}`;
}
