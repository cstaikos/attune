import { ServiceError } from "../services/service-error";

export const GENERIC_ERROR =
  "Something went wrong. Please try again. If it keeps happening, contact us using the “Report this problem” form.";

/** Only messages owned by the app may cross the UI boundary. */
export function userErrorMessage(error: unknown): string {
  if (error instanceof ServiceError) {
    switch (error.code) {
      case "unauthenticated":
        return "Please sign in and try again.";
      case "forbidden":
        return "You don't have permission to do that.";
      case "not-found":
        return "This item is no longer available.";
      case "invalid-input":
        return "Check the required fields and try again.";
      case "conflict":
        return "This conflicts with an existing item. Check your details and try again.";
      case "invalid-credentials":
        return "Email or password is incorrect.";
      case "invalid-invite":
        return "This invitation is invalid, expired, or already used.";
    }
  }
  // Expected authentication responses get fixed copy, never the API's message.
  if (error && typeof error === "object" && "code" in error) {
    switch (error.code) {
      case "invalid_credentials":
        return "Email or password is incorrect.";
      case "email_not_confirmed":
        return "Verify your email before signing in.";
      case "user_already_exists":
        return "An account with this email already exists. Try signing in.";
      case "weak_password":
        return "Choose a stronger password and try again.";
      case "otp_expired":
      case "flow_state_expired":
        return "This sign-in link has expired. Request a new link and try again.";
    }
  }
  return GENERIC_ERROR;
}
