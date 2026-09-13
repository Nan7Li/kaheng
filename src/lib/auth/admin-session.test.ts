import assert from "node:assert/strict";
import test from "node:test";
import {
  createAdminSession,
  getAdminSessionUsername,
  verifyAdminCredentials,
} from "./admin-session.server.ts";

const ENV_KEYS = [
  "ADMIN_USERNAME",
  "ADMIN_EMAIL",
  "ADMIN_PASSWORD",
  "ADMIN_SESSION_SECRET",
  "BETTER_AUTH_SECRET",
] as const;

function isolateAdminEnv(): () => void {
  const previous = new Map<string, string | undefined>();
  for (const key of ENV_KEYS) {
    previous.set(key, process.env[key]);
    delete process.env[key];
  }
  return () => {
    for (const key of ENV_KEYS) {
      const value = previous.get(key);
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  };
}

test("admin credentials are read from server-only environment variables", async () => {
  const restore = isolateAdminEnv();
  try {
    process.env.ADMIN_USERNAME = "owner";
    process.env.ADMIN_PASSWORD = "correct horse";
    process.env.ADMIN_SESSION_SECRET = "a-long-test-secret";

    assert.equal(await verifyAdminCredentials("owner", "correct horse"), true);
    assert.equal(await verifyAdminCredentials("owner", "wrong"), false);
    assert.equal(await verifyAdminCredentials("other", "correct horse"), false);
  } finally {
    restore();
  }
});

test("admin session tokens are signed and reject tampering", async () => {
  const restore = isolateAdminEnv();
  try {
    process.env.ADMIN_USERNAME = "owner";
    process.env.ADMIN_PASSWORD = "correct horse";
    process.env.ADMIN_SESSION_SECRET = "a-long-test-secret";

    const token = await createAdminSession("owner");
    assert.equal(await getAdminSessionUsername(token), "owner");
    assert.equal(await getAdminSessionUsername(token + "tampered"), null);
    assert.equal(await getAdminSessionUsername("not-a-session"), null);
  } finally {
    restore();
  }
});
