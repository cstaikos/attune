type Reporter = (error: Error, tags: Record<string, string>) => void;

// Capture at the transport boundary, including errors subsequently handled by the UI.
// Never send request/response bodies, query parameters, or raw database messages.
export function reportingFetch(
  baseUrl: string,
  report: Reporter,
  fetcher: typeof fetch = fetch,
): typeof fetch {
  const origin = new URL(baseUrl).origin;
  return async (input, init) => {
    const url = new URL(
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url,
    );
    if (url.origin !== origin) return fetcher(input, init);
    const path = url.pathname;
    const operation = /^\/rest\/v1\/(?:rpc\/)?[a-z_]+$/.test(path)
      ? path
      : path.startsWith("/auth/v1/")
        ? "/auth/v1"
        : "/supabase";
    const error = new Error("Supabase request failed");
    const notify = (status: string, code = "unknown") => {
      error.message = `Supabase request failed (${status}, ${code})`;
      try {
        report(error, { service: "supabase", operation, status, code });
      } catch {
        /* Reporting must not break requests. */
      }
    };
    let response: Response;
    try {
      response = await fetcher(input, init);
    } catch (cause) {
      if (
        !(cause instanceof Error && cause.name === "AbortError") &&
        !(typeof navigator !== "undefined" && navigator.onLine === false)
      )
        notify("network");
      throw cause;
    }
    if (!response.ok) {
      let code = "unknown";
      try {
        const body = await response.clone().json();
        const value = body.code ?? body.error_code;
        if (typeof value === "string" && /^[a-zA-Z0-9_]{1,64}$/.test(value))
          code = value;
      } catch {
        /* A proxy error may not contain JSON. */
      }
      const expectedAuth =
        path.startsWith("/auth/v1/") &&
        [
          "invalid_credentials",
          "email_not_confirmed",
          "user_already_exists",
          "weak_password",
          "otp_expired",
          "otp_disabled",
          "bad_code_verifier",
          "flow_state_expired",
          "flow_state_not_found",
          "refresh_token_not_found",
          "refresh_token_already_used",
          "session_not_found",
          "session_expired",
          "over_request_rate_limit",
          "over_email_send_rate_limit",
          "same_password",
          "validation_failed",
        ].includes(code);
      const expectedInvite =
        path === "/rest/v1/rpc/redeem_invitation" &&
        ["23505", "22023"].includes(code);
      if (response.status >= 500 || !(expectedAuth || expectedInvite))
        notify(String(response.status), code);
    }
    return response;
  };
}
