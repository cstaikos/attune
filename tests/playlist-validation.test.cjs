const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  nonBlank,
  wholeNumber,
  playlistUrl,
  requiredLink,
  positiveDuration,
} = require("../.angular/mock-tests/utils/playlist-validators");

test("playlist fields reject missing values and recover when corrected", () => {
  assert.deepEqual(nonBlank({ value: "   " }), { required: true });
  assert.equal(nonBlank({ value: " Quiet music " }), null);
  assert.deepEqual(requiredLink({ value: ["", "  "] }), { required: true });
  assert.equal(
    requiredLink({ value: ["", "https://example.com/music"] }),
    null,
  );
  assert.deepEqual(positiveDuration({ value: { hours: 0, minutes: 0 } }), {
    duration: true,
  });
  assert.equal(positiveDuration({ value: { hours: 0, minutes: 1 } }), null);
  assert.equal(positiveDuration({ value: { hours: 1, minutes: 0 } }), null);
});

test("durations reject fractional, empty, and unsafe numeric values", () => {
  for (const value of [null, "", 1.5, Infinity, Number.MAX_SAFE_INTEGER + 1])
    assert.deepEqual(wholeNumber({ value }), { wholeNumber: true });
  assert.equal(wholeNumber({ value: 0 }), null);
  assert.deepEqual(
    positiveDuration({ value: { hours: Number.MAX_SAFE_INTEGER, minutes: 0 } }),
    { duration: true },
  );
});

test("optional blank URL rows are allowed but malformed and unsafe URLs fail", () => {
  for (const value of [
    "",
    "   ",
    "https://example.com/music",
    "https://www.youtube.com/playlist?list=PLtest",
  ])
    assert.equal(playlistUrl({ value }), null, value);
  for (const value of [
    "not a URL",
    "javascript:alert(1)",
    "https://user:password@example.com/music",
  ])
    assert.deepEqual(playlistUrl({ value }), { playlistUrl: true }, value);
});
