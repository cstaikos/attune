const pendingInviteKey = "resonance.pending-invite";

export function invitationLink(code: string): string {
  const url = new URL("/join", window.location.origin);
  url.searchParams.set("invite", code);
  return url.toString();
}

export function rememberInvitation(code: string): void {
  try {
    localStorage.setItem(pendingInviteKey, JSON.stringify({ code, savedAt: Date.now() }));
  } catch {
    // Manual code entry still works when browser storage is unavailable.
  }
}

export function pendingInvitation(): string {
  try {
    const saved = JSON.parse(localStorage.getItem(pendingInviteKey) || "null");
    if (typeof saved?.code === "string" && Date.now() - saved.savedAt < 7 * 86400000)
      return saved.code;
  } catch {
    // Ignore unavailable storage or an invalid saved value.
  }
  return "";
}

export function clearInvitation(): void {
  try {
    localStorage.removeItem(pendingInviteKey);
  } catch {
    // Storage may be disabled by the browser.
  }
}
