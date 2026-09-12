import { bootstrapApplication } from "@angular/platform-browser";
import { App } from "./app/app";
import { appConfig } from "./app/app.config";

bootstrapApplication(App, appConfig).catch((error: unknown) => {
  console.error(error);
  const root = document.querySelector("app-root");
  if (!root) return;
  const panel = document.createElement("main");
  panel.className = "auth-page";
  const heading = document.createElement("h1");
  heading.textContent = "The library could not open.";
  const message = document.createElement("p");
  message.setAttribute("role", "alert");
  message.textContent =
    error instanceof Error ? error.message : "Please try again.";
  const retry = document.createElement("button");
  retry.className = "primary-button";
  retry.textContent = "Try again";
  retry.addEventListener("click", () => window.location.reload());
  panel.append(heading, message, retry);
  root.replaceChildren(panel);
});
