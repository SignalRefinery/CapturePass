import { createAdminClient } from "@/lib/supabase/admin";

type AnalyticsEventPayload = Record<string, unknown>;
type AnalyticsLogContext = Record<string, unknown>;
type AnalyticsEventClient = ReturnType<typeof createAdminClient>;

type RecordAnalyticsEventOptions = {
  client?: AnalyticsEventClient;
  logContext?: AnalyticsLogContext;
  logLabel?: string;
};

export async function recordAnalyticsEvent(
  payload: AnalyticsEventPayload,
  {
    client = createAdminClient(),
    logContext = {},
    logLabel = "Analytics event insert failed"
  }: RecordAnalyticsEventOptions = {}
) {
  const { error } = await client.from("analytics_events").insert(payload);

  if (error) {
    console.error(logLabel, {
      ...logContext,
      error: error.message
    });
  }

  return { error };
}

export function queueAnalyticsEvent(payload: AnalyticsEventPayload, options: RecordAnalyticsEventOptions = {}) {
  recordAnalyticsEvent(payload, options).catch((error: unknown) => {
    console.error(options.logLabel || "Analytics event insert failed", {
      ...(options.logContext || {}),
      error: error instanceof Error ? error.message : String(error)
    });
  });
}
