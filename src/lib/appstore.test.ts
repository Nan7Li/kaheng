import assert from "node:assert/strict";
import test from "node:test";
import { isAppStoreUrl, parseAppStoreInput } from "./appstore.ts";

test("parses regional App Store URLs", () => {
  const a = parseAppStoreInput("https://apps.apple.com/tw/app/chatgpt/id6448311069");
  assert.equal(a?.id, "6448311069");
  assert.equal(a?.country, "TW");
  assert.equal(a?.slug, "chatgpt");
  const b = parseAppStoreInput("https://apps.apple.com/app/id324684580");
  assert.equal(b?.id, "324684580");
  const c = parseAppStoreInput("id363590051");
  assert.equal(c?.id, "363590051");
});

test("bare 10-digit id is an app id", () => {
  assert.equal(parseAppStoreInput("6448311069")?.id, "6448311069");
});

test("detects App Store hosts", () => {
  assert.equal(isAppStoreUrl("https://apps.apple.com/us/app/netflix/id363590051"), true);
  assert.equal(isAppStoreUrl("https://kaheng.cc"), false);
});
