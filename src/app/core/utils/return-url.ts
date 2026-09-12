/** Return destinations must stay within the application. */
export function safeReturnUrl(value: string | null): string {
  return value &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("\\") &&
    !/^\/(login|join)(?:[/?#]|$)/.test(value)
    ? value
    : "/library";
}
