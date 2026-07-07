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
  assert.equal(inferProfileButtonType("mailto:hello@capturepass.com", "Email me"), "email");
  assert.equal(inferProfileButtonType("5551234567", "Call me"), "phone");
  assert.equal(inferProfileButtonType("https://calendly.com/capturepass", "Book time"), "booking");
  assert.equal(normalizeProfileButtonHref("phone", "(555) 123-4567"), "tel:15551234567");
  assert.equal(normalizeProfileButtonHref("email", "hello@capturepass.com"), "mailto:hello@capturepass.com");
});

test("normalizes profile button fields for storage", () => {
  const normalized = normalizeProfileButtonFieldsForStorage({
    primary_link_1_title: "Email",
    primary_link_1_url: "mailto:hello@capturepass.com",
    primary_link_2_title: "Book",
    primary_link_2_url: "calendly.com/capturepass",
    primary_link_3_title: "Call",
    primary_link_3_url: "(555) 123-4567",
    primary_link_4_title: "",
    primary_link_4_url: ""
  });

  assert.equal(normalized.primary_link_1_type, "email");
  assert.equal(normalized.primary_link_1_url, "mailto:hello@capturepass.com");
  assert.equal(normalized.primary_link_2_type, "booking");
  assert.equal(normalized.primary_link_2_url, "https://calendly.com/capturepass");
  assert.equal(normalized.primary_link_3_type, "phone");
  assert.equal(normalized.primary_link_3_url, "tel:15551234567");
});

test("buildProfileButtons can hide email buttons from public rendering", () => {
  const buttons = buildProfileButtons(
    {
      primary_link_1_title: "Email",
      primary_link_1_url: "hello@capturepass.com",
      primary_link_1_type: "email",
      primary_link_2_title: "Website",
      primary_link_2_url: "capturepass.com",
      primary_link_2_type: "website"
    },
    { hideEmail: true }
  );

  assert.equal(buttons.length, 1);
  assert.equal(buttons[0].type, "website");
  assert.equal(buttons[0].href, "https://capturepass.com");
});

test("buildProfileButtons uses each button value for phone and email destinations", () => {
  const buttons = buildProfileButtons({
    phone: "1112223333",
    email: "account@example.com",
    primary_link_1_title: "Text Sales",
    primary_link_1_url: "4445556666",
    primary_link_1_type: "text",
    primary_link_2_title: "Email Support",
    primary_link_2_url: "support@example.com",
    primary_link_2_type: "email"
  });

  assert.equal(buttons[0].href, "sms:14445556666");
  assert.equal(buttons[0].subtitle, "Text 4445556666");
  assert.equal(buttons[1].href, "mailto:support@example.com");
  assert.equal(buttons[1].subtitle, "Email support@example.com");
});
