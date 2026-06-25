import Link from "next/link";
import { redirect } from "next/navigation";
import { AnalyticsSummary } from "@/components/analytics/analytics-summary";
import { Shell } from "@/components/shared/shell";
import { createClient } from "@/lib/supabase/server";
import { canUseAnalytics, getProfilePlan } from "@/lib/plans";
import type { AnalyticsEventRecord, ContactSubmissionRecord, ProfileRecord } from "@/lib/types";

async function getInitialAuth(userId: string, email?: string | null) {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, slug")
    .eq("user_id", userId)
    .maybeSingle();

  return {
    email: email || null,
    fullName: profile?.full_name || null,
    slug: profile?.slug || null
  };
}

function dateCutoff(range: string) {
  const days = range === "30" ? 30 : 7;
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

export default async function AnalyticsPage({
  searchParams
}: {
  searchParams?: Promise<{ range?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const params = searchParams ? await searchParams : {};
  const range = params?.range === "30" ? "30" : "7";
  const initialAuth = await getInitialAuth(user.id, user.email);
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle<ProfileRecord>();
  const plan = getProfilePlan(profile);

  if (!profile || !canUseAnalytics(plan)) {
    return (
      <Shell footerLeft="Analytics" footerRight="CapturePass" initialAuth={initialAuth} pageVariant="light">
        <section className="simple-hero">
          <div className="kicker">
            <span className="mini-star">✦</span>
            <span>Analytics</span>
          </div>
          <h1>Analytics unlock with Business Individual.</h1>
          <p>
            CapturePass still collects activity privately, but dashboard analytics are available on Business Individual and business plans.
          </p>
          <Link className="button primary" href="/business/pricing" style={{ marginTop: 22 }}>
            View business plans
          </Link>
        </section>
      </Shell>
    );
  }

  const cutoff = dateCutoff(range);
  const [{ data: events }, { data: contacts }] = await Promise.all([
    supabase
      .from("analytics_events")
      .select("*")
      .gte("created_at", cutoff)
      .order("created_at", { ascending: false }),
    supabase
      .from("contact_submissions")
      .select("*")
      .gte("created_at", cutoff)
      .order("created_at", { ascending: false })
  ]);

  return (
    <Shell footerLeft="Analytics" footerRight="CapturePass" initialAuth={initialAuth} pageVariant="light">
      <section className="simple-hero">
        <div className="kicker">
          <span className="mini-star">✦</span>
          <span>Analytics</span>
        </div>
        <h1>Profile activity.</h1>
        <p>See profile views, sources, contact saves, button clicks, and contacts shared with you.</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginTop: 22 }}>
          <Link className={range === "7" ? "button primary" : "button secondary"} href="/dashboard/analytics?range=7">
            Last 7 days
          </Link>
          <Link className={range === "30" ? "button primary" : "button secondary"} href="/dashboard/analytics?range=30">
            Last 30 days
          </Link>
        </div>
      </section>

      <AnalyticsSummary
        events={(events || []) as AnalyticsEventRecord[]}
        contacts={(contacts || []) as ContactSubmissionRecord[]}
      />
    </Shell>
  );
}
