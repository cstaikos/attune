const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  reportingFetch,
} = require("../.angular/mock-tests/utils/reporting-fetch");

test("reports a handled database failure without consuming its response or exposing data", async () => {
  const reports = [];
  const response = new Response(
    JSON.stringify({
      code: "42501",
      message: "private content",
      details: "secret",
    }),
    { status: 403 },
  );
  const request = reportingFetch(
    "https://test.supabase.co",
    (error, tags) => reports.push({ message: error.message, tags }),
    async () => response,
  );
  const result = await request(
    "https://test.supabase.co/rest/v1/playlists?email=private@example.com",
  );
  assert.equal(result, response);
  assert.equal((await result.json()).message, "private content");
  assert.equal(reports.length, 1);
  assert.equal(reports[0].tags.operation, "/rest/v1/playlists");
  assert.equal(reports[0].tags.code, "42501");
  assert.doesNotMatch(JSON.stringify(reports), /private|secret|email/);
});

test("expected auth and invitation errors stay quiet, but server failures do not", async () => {
  const reports = [];
  for (const [path, code, status] of [
    ["/auth/v1/token", "invalid_credentials", 400],
    ["/rest/v1/rpc/redeem_invitation", "22023", 400],
    ["/auth/v1/token", "invalid_credentials", 500],
  ]) {
    await reportingFetch(
      "https://test.supabase.co",
      (e) => reports.push(e),
      async () => new Response(JSON.stringify({ code }), { status }),
    )("https://test.supabase.co" + path);
  }
  assert.equal(reports.length, 1);
});

test("network failures retain their original rejection and reporting cannot break a response", async () => {
  const original = new TypeError("network down");
  let count = 0;
  const request = reportingFetch(
    "https://test.supabase.co",
    () => {
      count++;
      throw new Error("reporter down");
    },
    async () => {
      throw original;
    },
  );
  await assert.rejects(
    request("https://test.supabase.co/rest/v1/playlists"),
    (error) => error === original,
  );
  assert.equal(count, 1);
  const response = new Response("proxy failure", { status: 502 });
  const succeeds = reportingFetch(
    "https://test.supabase.co",
    () => {
      throw new Error("reporter down");
    },
    async () => response,
  );
  assert.equal(
    await succeeds("https://test.supabase.co/rest/v1/playlists"),
    response,
  );
});

test("successful requests, unrelated origins, and cancellations do not report", async () => {
  const reports = [];
  const report = (e) => reports.push(e);
  await reportingFetch(
    "https://test.supabase.co",
    report,
    async () => new Response("{}"),
  )("https://test.supabase.co/rest/v1/playlists");
  await reportingFetch(
    "https://test.supabase.co",
    report,
    async () => new Response("{}", { status: 500 }),
  )("https://other.example/");
  await assert.rejects(
    reportingFetch("https://test.supabase.co", report, async () => {
      throw new DOMException("cancelled", "AbortError");
    })("https://test.supabase.co/rest/v1/playlists"),
  );
  assert.equal(reports.length, 0);
});
