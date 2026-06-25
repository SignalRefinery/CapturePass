import { redirect } from "next/navigation";
import Link from "next/link";
import { ContactTable } from "@/components/contacts/contact-table";
import { Shell } from "@/components/shared/shell";
import { canUseContactsDashboard, getProfilePlan } from "@/lib/plans";
import { createClient } from "@/lib/supabase/server";
import type { ContactSubmissionRecord, ProfileRecord } from "@/lib/types";

async function getInitialAuth() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, slug")
    .eq("user_id", user.id)
    .maybeSingle();

  return {
    email: user.email || null,
    fullName: profile?.full_name || null,
    slug: profile?.slug || null
  };
}

export default async function ContactsPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const initialAuth = await getInitialAuth();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle<ProfileRecord>();
  const plan = getProfilePlan(profile);

  if (!profile || !canUseContactsDashboard(plan)) {
    return (
      <Shell footerLeft="Contacts" footerRight="CapturePass" initialAuth={initialAuth} pageVariant="light">
        <section className="simple-hero">
          <div className="kicker">
            <span className="mini-star">✦</span>
            <span>Contacts</span>
          </div>
          <h1>Contacts unlock with Business Individual.</h1>
          <p>Contact Sharing and the Contacts dashboard are available on Business Individual and business plans.</p>
          <Link className="button primary" href="/business/pricing" style={{ marginTop: 22 }}>
            View business plans
          </Link>
        </section>
      </Shell>
    );
  }

  const { data, error } = await supabase
    .from("contact_submissions")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <Shell footerLeft="Contacts" footerRight="CapturePass" initialAuth={initialAuth} pageVariant="light">
      <section className="simple-hero">
        <div className="kicker">
          <span className="mini-star">✦</span>
          <span>Contacts</span>
        </div>
        <h1>Contacts shared with you.</h1>
        <p>People who tap Share My Contact on your public profile appear here.</p>
      </section>

      <section className="dashboard-wrap">
        {error ? (
          <div className="dashboard-card">
            <div className="dashboard-kicker">Contacts</div>
            <h2>Contacts could not load.</h2>
            <p className="editor-copy">
              Confirm the Contact Sharing Supabase migration has been run, then refresh this page.
            </p>
          </div>
        ) : (
          <ContactTable contacts={(data || []) as ContactSubmissionRecord[]} />
        )}
      </section>
    </Shell>
  );
}
