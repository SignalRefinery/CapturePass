const assert = require("node:assert/strict");
const test = require("node:test");
require("./require-ts.cjs");

const { recordAnalyticsEvent } = require("../../lib/analytics/record-event.ts");

test("recordAnalyticsEvent inserts the provided payload with the supplied client", async () => {
  const inserted = [];
  const fakeClient = {
    from(table) {
      assert.equal(table, "analytics_events");
      return {
        async insert(payload) {
          inserted.push(payload);
          return { error: null };
        }
      };
    }
  };

  const result = await recordAnalyticsEvent(
    {
      event_type: "button_click",
      profile_id: "profile-id",
      metadata: { button: "Website" }
    },
    { client: fakeClient }
  );

  assert.equal(result.error, null);
  assert.deepEqual(inserted, [
    {
      event_type: "button_click",
      profile_id: "profile-id",
      metadata: { button: "Website" }
    }
  ]);
});

test("recordAnalyticsEvent returns insert errors without throwing", async () => {
  const fakeError = { message: "table unavailable" };
  const fakeClient = {
    from() {
      return {
        async insert() {
          return { error: fakeError };
        }
      };
    }
  };

  const originalConsoleError = console.error;
  console.error = () => {};
  let result;
  try {
    result = await recordAnalyticsEvent(
      { event_type: "profile_view" },
      { client: fakeClient, logLabel: "expected test insert failure" }
    );
  } finally {
    console.error = originalConsoleError;
  }

  assert.equal(result.error, fakeError);
});
