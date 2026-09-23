const { test } = require("node:test");
const assert = require("node:assert/strict");
const { withTimeout } = require("../.angular/mock-tests/utils/with-timeout");

test("a stalled request times out and a late result cannot undo the failure", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  let finish;
  const pending = withTimeout(
    new Promise((resolve) => {
      finish = resolve;
    }),
  );
  const rejected = assert.rejects(pending, /connection took too long/i);
  t.mock.timers.tick(10_000);
  await rejected;
  finish("late session");
  await assert.rejects(pending, /connection took too long/i);
});

test("successful and failed checks keep their original outcomes", async () => {
  const session = { userId: "member", membership: "active" };
  assert.equal(await withTimeout(Promise.resolve(session)), session);
  assert.equal(await withTimeout(Promise.resolve(null)), null);
  const failure = new Error("service unavailable");
  await assert.rejects(
    withTimeout(Promise.reject(failure)),
    (error) => error === failure,
  );
});
