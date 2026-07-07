const assert = require("node:assert/strict");
const test = require("node:test");
require("./require-ts.cjs");

const {
  businessInviteRedirectUrl,
  businessLoginPath,
  businessLoginUrl,
  cleanEmail,
  cleanId,
  cleanLocationState,
  cleanOptionalId,
  cleanTokenStatus,
  cleanUrl,
  isPlatformAdminEmail,
  tokenUrl
} = require("../../lib/business/dashboard-utils.ts");

test("validates business dashboard form identifiers and emails", () => {
  const id = "550e8400-e29b-41d4-a716-446655440000";
  assert.equal(cleanId(id), id);
  assert.equal(cleanId("not-a-uuid"), "");
  assert.equal(cleanOptionalId(""), null);
  assert.equal(cleanEmail(" USER@Example.COM "), "user@example.com");
  assert.equal(cleanEmail("not-email"), null);
});

test("normalizes location state, token status, and external URLs", () => {
  assert.equal(cleanLocationState(" il "), "IL");
  assert.equal(cleanLocationState("illinois"), null);
  assert.equal(cleanTokenStatus("active"), "active");
  assert.equal(cleanTokenStatus("unassigned"), "unassigned");
  assert.equal(cleanTokenStatus("weird"), "inactive");
  assert.equal(cleanUrl("capturepass.com"), "https://capturepass.com");
  assert.equal(cleanUrl("https://capturepass.com"), "https://capturepass.com");
});

test("builds business dashboard URLs from the configured app URL", () => {
  const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;
  process.env.NEXT_PUBLIC_APP_URL = "https://example.test/";

  try {
    assert.equal(businessLoginPath("demo-co"), "/demo-co/login");
    assert.equal(businessLoginUrl("demo-co"), "https://example.test/demo-co/login");
    assert.equal(tokenUrl("abc123"), "https://example.test/p/abc123");
    assert.equal(businessInviteRedirectUrl("demo-co"), "https://example.test/update-password?next=%2Fdemo-co%2Flogin");
  } finally {
    process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
  }
});

test("platform admin email check delegates to the centralized bootstrap helper", () => {
  assert.equal(isPlatformAdminEmail(" john@handshakeiq.org "), true);
  assert.equal(isPlatformAdminEmail("admin@capturepass.com"), false);
});
