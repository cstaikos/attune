export type ServiceErrorCode =
  | "unauthenticated"
  | "forbidden"
  | "not-found"
  | "invalid-input"
  | "conflict"
  | "invalid-credentials"
  | "invalid-invite"
  | "storage"
  | "unavailable";
export class ServiceError extends Error {
  constructor(
    readonly code: ServiceErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ServiceError";
  }
}
