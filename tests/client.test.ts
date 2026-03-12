import test from "node:test";
import assert from "node:assert/strict";

import { WebUnlocker } from "../src/client";
import { WebUnlockerError } from "../src/errors";

test("buildScrapeUrl encodes the target url", () => {
  const client = new WebUnlocker({ apiKey: "wu_test_key" });
  const requestUrl = client.buildScrapeUrl("https://example.com/path?q=hello world");
  const parsed = new URL(requestUrl);

  assert.equal(parsed.origin, "https://parsing.webunlocker.gologin.com");
  assert.equal(parsed.pathname, "/v1/scrape");
  assert.equal(parsed.searchParams.get("url"), "https://example.com/path?q=hello world");
});

test("constructor rejects empty api keys", () => {
  assert.throws(() => new WebUnlocker({ apiKey: "" }), WebUnlockerError);
});
