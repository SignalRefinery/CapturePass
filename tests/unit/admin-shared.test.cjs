const assert = require("node:assert/strict");
const test = require("node:test");
require("./require-ts.cjs");

const {
  isCapturePassBootstrapAdminEmail,
  CAPTUREPASS_BOOTSTRAP_ADMIN_EMAIL
} = require("../../lib/auth/admin-shared.ts");

test("bootstrap admin email check is exact after trim/lowercase normalization", () => {
  assert.equal(isCapturePassBootstrapAdminEmail(` ${CAPTUREPASS_BOOTSTRAP_ADMIN_EMAIL.toUpperCase()} `), true);
  assert.equal(isCapturePassBootstrapAdminEmail("john@example.com"), false);
  assert.equal(isCapturePassBootstrapAdminEmail(null), false);
});
