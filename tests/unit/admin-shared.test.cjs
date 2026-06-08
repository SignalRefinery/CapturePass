const assert = require("node:assert/strict");
const test = require("node:test");
require("./require-ts.cjs");

const {
  isTapTaggBootstrapAdminEmail,
  TAPTAGG_BOOTSTRAP_ADMIN_EMAIL
} = require("../../lib/auth/admin-shared.ts");

test("bootstrap admin email check is exact after trim/lowercase normalization", () => {
  assert.equal(isTapTaggBootstrapAdminEmail(` ${TAPTAGG_BOOTSTRAP_ADMIN_EMAIL.toUpperCase()} `), true);
  assert.equal(isTapTaggBootstrapAdminEmail("john@example.com"), false);
  assert.equal(isTapTaggBootstrapAdminEmail(null), false);
});
