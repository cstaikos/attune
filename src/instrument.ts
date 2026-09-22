import * as Sentry from "@sentry/angular";
import { environment } from "./environments/environment";

const config = environment.sentry;
if (config.dsn) {
  Sentry.init({
    dsn: config.dsn,
    environment: config.environment,
    release: config.release,
    sendDefaultPii: false,
    defaultIntegrations: false,
    integrations: [
      Sentry.globalHandlersIntegration(),
      Sentry.linkedErrorsIntegration(),
      Sentry.dedupeIntegration(),
      Sentry.browserApiErrorsIntegration(),
    ],
    // No replay, tracing, console breadcrumbs, or request bodies for the beta.
    beforeSend(event) {
      delete event.user;
      delete event.extra;
      delete event.breadcrumbs;
      delete event.request;
      for (const exception of event.exception?.values ?? []) {
        if (exception.value) exception.value = redact(exception.value);
        for (const frame of exception.stacktrace?.frames ?? []) {
          delete frame.vars;
          if (frame.filename) frame.filename = frame.filename.split(/[?#]/)[0];
          if (frame.abs_path) frame.abs_path = frame.abs_path.split(/[?#]/)[0];
        }
      }
      if (event.message) event.message = redact(event.message);
      return event;
    },
  });
}

function redact(value: string): string {
  return value
    .replace(/https?:\/\/[^\s)]+/g, (url) => url.split(/[?#]/)[0])
    .replace(/[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}/g, "[email]")
    .replace(/\beyJ[\w-]+\.[\w-]+\.[\w-]+\b/g, "[token]")
    .replace(/Bearer\s+\S+/gi, "Bearer [token]");
}
