const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  userErrorMessage,
  GENERIC_ERROR,
} = require("../.angular/mock-tests/utils/user-error");
const {
  ServiceError,
} = require("../.angular/mock-tests/services/service-error");
const {
  reportingFetch,
} = require("../.angular/mock-tests/utils/reporting-fetch");

test("unexpected errors never expose exception or API messages", () => {
  for (const error of [
    new Error("private database detail"),
    { message: "private detail" },
    "secret",
    null,
    new ServiceError("storage", "private storage detail"),
    new ServiceError("unavailable", "private detail"),
  ])
    assert.equal(userErrorMessage(error), GENERIC_ERROR);
  assert.match(GENERIC_ERROR, /try again/i);
  assert.match(GENERIC_ERROR, /Report this problem/);
});

test("expected errors use app-owned copy even when messages contain API details", () => {
  assert.equal(
    userErrorMessage({ code: "invalid_credentials", message: "secret" }),
    "Email or password is incorrect.",
  );
  assert.equal(
    userErrorMessage(new ServiceError("invalid-input", "secret")),
    "Check the required fields and try again.",
  );
});

test("API failures reach the reporter while the UI gets only retry and contact guidance", async () => {
  const reports = [];
  const request = reportingFetch(
    "https://test.supabase.co",
    (error, tags) => reports.push({ error, tags }),
    async () =>
      new Response(
        JSON.stringify({ code: "42501", message: "private database detail" }),
        { status: 403 },
      ),
  );
  const response = await request("https://test.supabase.co/rest/v1/playlists");
  const body = await response.json();
  assert.equal(userErrorMessage(new Error(body.message)), GENERIC_ERROR);
  assert.equal(reports.length, 1);
  assert.equal(reports[0].tags.code, "42501");
  assert.equal(reports[0].tags.operation, "/rest/v1/playlists");
});
