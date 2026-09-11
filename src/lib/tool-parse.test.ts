import assert from "node:assert/strict";
import test from "node:test";
import { parseToolCommand } from "./tool-parse.ts";

test("routes a BIN, a rate, and an App Store URL", () => {
  assert.equal(parseToolCommand("493875")?.pane, "bin");
  assert.equal(parseToolCommand("493875")?.bin, "493875");
  const rate = parseToolCommand("/rate USD 100");
  assert.equal(rate?.pane, "fx");
  assert.equal(rate?.source, "USD");
  assert.equal(rate?.amount, 100);
  assert.equal(rate?.target, "TWD");
  const store = parseToolCommand("https://apps.apple.com/tw/app/chatgpt/id6448311069");
  assert.equal(store?.pane, "store");
  assert.equal(store?.appId, "6448311069");
});

test("bot slash commands land on the matching pane", () => {
  assert.equal(parseToolCommand("/bin 454924")?.bin, "454924");
  assert.equal(parseToolCommand("/spotify")?.product, "spotify");
  assert.equal(parseToolCommand("/netflix USD")?.quote, "USD");
  assert.equal(parseToolCommand("/chatgptgo")?.product, "chatgpt-go");
  assert.equal(parseToolCommand("/spotifyo")?.localOnly, true);
});

test("natural language aliases", () => {
  assert.equal(parseToolCommand("100美元")?.pane, "fx");
  assert.equal(parseToolCommand("ChatGPT Plus")?.product, "chatgpt-plus");
  assert.equal(parseToolCommand("奈飞")?.product, "netflix");
  assert.equal(parseToolCommand("汇率")?.pane, "fx");
});
