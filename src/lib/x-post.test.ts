import assert from "node:assert/strict";
import test from "node:test";
import { parseXStatusId, xStatusUrl } from "./x-post.ts";

test("extracts status id from x.com and twitter.com URLs", () => {
  assert.equal(parseXStatusId("https://x.com/MEXCZH/status/2094272494211600583"), "2094272494211600583");
  assert.equal(
    parseXStatusId("https://twitter.com/okx/status/2097845034355748992?s=20"),
    "2097845034355748992",
  );
  assert.equal(parseXStatusId("2094272494211600583"), "2094272494211600583");
  assert.equal(parseXStatusId("not a post"), undefined);
});

test("builds a canonical x.com status URL", () => {
  assert.equal(xStatusUrl("1", "okx"), "https://x.com/okx/status/1");
});
