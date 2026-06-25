const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const sqlPath = path.resolve(__dirname, "../../supabase/archive/phase93_public_profile_rpc.sql");
const publicProfileSourcePath = path.resolve(__dirname, "../../lib/profiles/public-profile-source.ts");

function returnsTableBlock(functionName) {
  const sql = fs.readFileSync(sqlPath, "utf8");
  const pattern = new RegExp(`create or replace function public\\.${functionName}\\([^)]*\\)\\s+returns table \\(([\\s\\S]*?)\\)\\s+language`, "i");
  const match = sql.match(pattern);
  assert.ok(match, `Missing returns table block for ${functionName}`);
  return match[1];
}

test("public profile RPC return payload omits sensitive profile columns", () => {
  const deniedFields = [
    "private_token",
    "stripe_customer_id",
    "stripe_subscription_id",
    "registration_notification_sent_at",
    "card_notification_sent_at",
    "is_admin",
    "slug_requested",
    "slug_review_reason"
  ];

  for (const functionName of ["get_public_profile_by_slug", "get_public_profile_by_token"]) {
    const block = returnsTableBlock(functionName).toLowerCase();

    for (const field of deniedFields) {
      assert.equal(block.includes(field), false, `${functionName} should not return ${field}`);
    }
  }
});

test("public profile RPC masks internal access grant fields in select payload", () => {
  const sql = fs.readFileSync(sqlPath, "utf8").toLowerCase();

  assert.match(sql, /false\s+as\s+billing_exempt/);
  assert.match(sql, /false\s+as\s+lifetime_free/);
  assert.match(sql, /null::text\s+as\s+promo_code_used/);
});

test("public profile source resolves profiles through limited RPCs", () => {
  const source = fs.readFileSync(publicProfileSourcePath, "utf8");

  assert.match(source, /\.rpc\(rpcName,\s*params\)/);
  assert.equal(source.includes('.from("profiles")'), false);
  assert.equal(source.includes(".select(\"*\")"), false);
});
