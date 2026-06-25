const assert = require("node:assert/strict");
const test = require("node:test");
require("./require-ts.cjs");

const {
  getPlanDisplayLabel,
  normalizeIndividualPlanKey,
  planUnlocksAdvancedFeatures,
  planUnlocksTaggPlusFeatures,
  resolveCheckoutPlanSelection
} = require("../../lib/plans.ts");

test("normalizes legacy individual plan aliases to canonical TapTagg plans", () => {
  assert.equal(normalizeIndividualPlanKey("digital"), "core");
  assert.equal(normalizeIndividualPlanKey("essential-annual"), "core");
  assert.equal(normalizeIndividualPlanKey("pro"), "tagg_plus");
  assert.equal(normalizeIndividualPlanKey("premium"), "creator");
  assert.equal(normalizeIndividualPlanKey("founder"), "creator");
  assert.equal(normalizeIndividualPlanKey("unknown"), "free");
});

test("keeps checkout parsing from treating generic business as an individual plan", () => {
  assert.equal(resolveCheckoutPlanSelection("business"), null);
  assert.deepEqual(resolveCheckoutPlanSelection("tagg-plus"), {
    kind: "individual",
    plan: "tagg_plus"
  });
  assert.equal(resolveCheckoutPlanSelection("business_growth_self")?.kind, "business");
});

test("reports labels and feature thresholds from canonical plans", () => {
  assert.equal(getPlanDisplayLabel("tagg_plus"), "Business Plus");
  assert.equal(planUnlocksTaggPlusFeatures("core"), false);
  assert.equal(planUnlocksTaggPlusFeatures("tagg_plus"), true);
  assert.equal(planUnlocksAdvancedFeatures("tagg_plus"), false);
  assert.equal(planUnlocksAdvancedFeatures("creator"), true);
});
