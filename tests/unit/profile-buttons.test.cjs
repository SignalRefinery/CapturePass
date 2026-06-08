const assert = require("node:assert/strict");
const test = require("node:test");
require("./require-ts.cjs");

const {
  buildProfileButtons,
  inferProfileButtonType,
  normalizeProfileButtonFieldsForStorage,
  normalizeProfileButtonHref
} = require("../../lib/profile-buttons.ts");

test("infers and normalizes core profile button types", () => {
  assert.equal(inferProfileButtonType("mailto:hello@taptagg.app", "Email me"), "email");
  assert.equal(inferProfileButtonType("5551234567", "Call me"), "phone");
  assert.equal(inferProfileButtonType("https://calendly.com/taptagg", "Book time"), "booking");
  assert.equal(normalizeProfileButtonHref("phone", "(555) 123-4567"), "tel:15551234567");
  assert.equal(normalizeProfileButtonHref("email", "hello@taptagg.app"), "mailto:hello@taptagg.app");
});

test("normalizes profile button fields for storage", () => {
  const normalized = normalizeProfileButtonFieldsForStorage({
    primary_link_1_title: "Email",
    primary_link_1_url: "mailto:hello@taptagg.app",
    primary_link_2_title: "Book",
    primary_link_2_url: "calendly.com/taptagg",
    primary_link_3_title: "Call",
    primary_link_3_url: "(555) 123-4567",
    primary_link_4_title: "",
    primary_link_4_url: ""
  });

  assert.equal(normalized.primary_link_1_type, "email");
  assert.equal(normalized.primary_link_1_url, "mailto:hello@taptagg.app");
  assert.equal(normalized.primary_link_2_type, "booking");
  assert.equal(normalized.primary_link_2_url, "https://calendly.com/taptagg");
  assert.equal(normalized.primary_link_3_type, "phone");
  assert.equal(normalized.primary_link_3_url, "tel:15551234567");
});

test("buildProfileButtons can hide email buttons from public rendering", () => {
  const buttons = buildProfileButtons(
    {
      primary_link_1_title: "Email",
      primary_link_1_url: "hello@taptagg.app",
      primary_link_1_type: "email",
      primary_link_2_title: "Website",
      primary_link_2_url: "taptagg.app",
      primary_link_2_type: "website"
    },
    { hideEmail: true }
  );

  assert.equal(buttons.length, 1);
  assert.equal(buttons[0].type, "website");
  assert.equal(buttons[0].href, "https://taptagg.app");
});
