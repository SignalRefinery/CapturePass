const assert = require("node:assert/strict");
const test = require("node:test");
require("./require-ts.cjs");

const {
  buildPassVcardUrl,
  buildProfileVcardUrl,
  buildVcardFilename,
  buildVcardResponseHeaders,
  buildVcardText,
  resolveProfileVcardUrl
} = require("../../lib/vcard.ts");

test("buildVcardText returns a valid CRLF vCard 3.0 payload", () => {
  const vcard = buildVcardText({
    fullName: "Ada Lovelace",
    organizationName: "CapturePass",
    title: "Engineer",
    email: "ada@example.com",
    phone: "(555) 123-4567",
    websiteUrl: "https://capturepass.com",
    profileUrl: "https://capturepass.com/ada",
    note: "Line one\nLine two"
  });

  assert.ok(vcard.startsWith("BEGIN:VCARD\r\nVERSION:3.0\r\n"));
  assert.ok(vcard.includes("\r\nFN:Ada Lovelace\r\n"));
  assert.ok(vcard.includes("\r\nORG:CapturePass\r\n"));
  assert.ok(vcard.includes("\r\nTITLE:Engineer\r\n"));
  assert.ok(vcard.includes("\r\nEMAIL;TYPE=INTERNET:ada@example.com\r\n"));
  assert.ok(vcard.includes("\r\nTEL;TYPE=CELL:5551234567\r\n"));
  assert.ok(vcard.includes("\r\nURL:https://capturepass.com\r\n"));
  assert.ok(vcard.includes("\r\nURL:https://capturepass.com/ada\r\n"));
  assert.ok(vcard.includes("\\n"));
  assert.ok(vcard.endsWith("END:VCARD\r\n"));
});

test("vCard helpers use canonical .vcf routes and filenames", () => {
  assert.equal(buildProfileVcardUrl("demo-profile"), "/api/vcard/demo-profile");
  assert.equal(buildPassVcardUrl("token-123"), "/api/pass-vcard/token-123");
  assert.equal(buildVcardFilename("Ada Lovelace"), "ada-lovelace.vcf");
  assert.equal(buildVcardResponseHeaders("ada-lovelace.vcf")["Content-Type"], "text/vcard; charset=utf-8");
  assert.match(buildVcardResponseHeaders("ada-lovelace.vcf")["Content-Disposition"], /\.vcf/);
});

test("stale .txt vCard urls normalize back to the canonical route", () => {
  assert.equal(
    resolveProfileVcardUrl({ slug: "demo-profile", vcard_url: "/files/demo-profile.txt" }),
    "/api/vcard/demo-profile"
  );
  assert.equal(
    resolveProfileVcardUrl({ slug: "demo-profile", vcard_url: "/api/vcard/demo-profile" }),
    "/api/vcard/demo-profile"
  );
});
