import "./instrument";
import { captureException, getFeedback } from "@sentry/angular";
import { bootstrapApplication } from "@angular/platform-browser";
import { App } from "./app/app";
import { appConfig } from "./app/app.config";
import { emailCallbackPath } from "./app/core/utils/auth-callback";
import { GENERIC_ERROR } from "./app/core/utils/user-error";

const callbackPath = emailCallbackPath(new URL(window.location.href));
if (callbackPath) history.replaceState(history.state, "", callbackPath);

bootstrapApplication(App, appConfig).catch((error: unknown) => {
  captureException(error);
  console.error(error);
  const root = document.querySelector("app-root");
  if (!root) return;
  const panel = document.createElement("main");
  panel.className = "auth-page";
  const heading = document.createElement("h1");
  heading.textContent = "The library could not open.";
  const message = document.createElement("p");
  message.setAttribute("role", "alert");
  message.textContent = GENERIC_ERROR;
  const retry = document.createElement("button");
  retry.className = "primary-button";
  retry.textContent = "Try again";
  retry.addEventListener("click", () => window.location.reload());
  panel.append(heading, message, retry);
  const feedback = getFeedback();
  if (feedback) {
    const report = document.createElement("button");
    report.type = "button";
    report.textContent = "Report this problem";
    report.addEventListener("click", async () => {
      report.disabled = true;
      try {
        const form = await feedback.createForm({
          formTitle: "Report this problem",
          tags: { feedback_source: "error" },
          onFormClose: () => {
            form.removeFromDom();
            report.disabled = false;
            report.focus();
          },
        });
        form.appendToDom();
        form.open();
      } catch (feedbackError) {
        captureException(feedbackError);
        report.disabled = false;
        message.textContent = "Feedback couldn't open. Please try again.";
      }
    });
    panel.append(report);
  }
  root.replaceChildren(panel);
});
