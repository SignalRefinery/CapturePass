import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { Shell } from "@/components/shared/shell";
import { claimBusinessOrganizationForUser } from "@/lib/business/organization-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function BusinessLoginPage({ params }: PageProps) {
  const { slug } = await params;
  const normalizedSlug = slug.toLowerCase();
  const admin = createAdminClient();
  const { data: organization } = await admin
    .from("organizations")
    .select("id, name, slug, owner_user_id")
    .eq("slug", normalizedSlug)
    .maybeSingle();

  if (!organization) notFound();

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    const claimedOrganization = await claimBusinessOrganizationForUser({
      userId: user.id,
      email: user.email,
      organizationId: organization.id
    });

    if (claimedOrganization || user.id === organization.owner_user_id) {
      redirect("/dashboard/business");
    }
  }

  const nextPath = `/business/${organization.slug}`;
  const initialAuth = user
    ? {
        email: user.email || null,
        fullName: user.user_metadata?.full_name || null,
        slug: null
      }
    : null;

  return (
    <Shell footerLeft={organization.name} footerRight="Business login" initialAuth={initialAuth}>
      <section className="simple-hero">
        <div className="kicker">
          <span className="mini-star">✦</span>
          <span>Business console</span>
        </div>
        <h1>{organization.name}</h1>
        <p>Log in to manage employee profiles, card tokens, QR links, and business sharing.</p>
      </section>

      <section className="auth-wrap">
        <div className="auth-card">
          {user ? (
            <>
              <h2 style={{ marginTop: 0 }}>This login does not have access yet.</h2>
              <p className="editor-copy">
                Use the email assigned as this business admin, or ask TapTagg support to update the business admin email.
              </p>
              <Link className="button secondary" href="/auth/signout">
                Sign out
              </Link>
            </>
          ) : (
            <AuthForm mode="login" nextPath={nextPath} />
          )}
        </div>
      </section>
    </Shell>
  );
}
