import { redirect } from "next/navigation";
import { ContactTable } from "@/components/contacts/contact-table";
import { Shell } from "@/components/shared/shell";
import { createClient } from "@/lib/supabase/server";
import type { ContactSubmissionRecord } from "@/lib/types";

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
  const { data, error } = await supabase
    .from("contact_submissions")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <Shell footerLeft="Contacts" footerRight="TapTagg" initialAuth={initialAuth}>
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
