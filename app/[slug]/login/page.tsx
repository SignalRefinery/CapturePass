import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { CopyLinkButton } from "@/components/business/copy-link-button";
import { Shell } from "@/components/shared/shell";
import { claimBusinessMembershipForUser } from "@/lib/business/organization-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { OrganizationMemberRecord, OrganizationRecord, PassTokenRecord } from "@/lib/types";

type PageProps = {
  params: Promise<{ slug: string }>;
};

function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "https://taptagg.app").replace(/\/$/, "");
}

function tokenUrl(token: string) {
  return `${appUrl()}/p/${token}`;
}

function businessLoginPath(slug: string) {
  return `/${slug}/login`;
}

export default async function BusinessSlugLoginPage({ params }: PageProps) {
  const { slug } = await params;
  const normalizedSlug = slug.toLowerCase();
  const admin = createAdminClient();
  const { data: organization } = await admin
    .from("organizations")
    .select("*")
    .eq("slug", normalizedSlug)
    .maybeSingle();

  if (!organization) notFound();

  const org = organization as OrganizationRecord;
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const initialAuth = user
    ? {
        email: user.email || null,
        fullName: user.user_metadata?.full_name || null,
        slug: null
      }
    : null;

  if (!user) {
    return (
      <Shell footerLeft={org.name} footerRight="Business login" initialAuth={initialAuth}>
        <section className="simple-hero">
          <div className="kicker">
            <span className="mini-star">✦</span>
            <span>Business login</span>
          </div>
          <h1>{org.name}</h1>
          <p>Log in with the email invited by your business to open your TapTagg console.</p>
        </section>

        <section className="auth-wrap">
          <div className="auth-card">
            <AuthForm mode="login" nextPath={businessLoginPath(org.slug || normalizedSlug)} />
          </div>
        </section>
      </Shell>
    );
  }

  const membership = await claimBusinessMembershipForUser({
    userId: user.id,
    email: user.email,
    organizationId: org.id,
    roles: ["owner", "admin", "member"]
  });

  if (membership?.member.role === "owner" || membership?.member.role === "admin" || user.id === org.owner_user_id) {
    redirect(`/dashboard/business?org=${org.id}`);
  }

  if (!membership) {
    return (
      <Shell footerLeft={org.name} footerRight="Business login" initialAuth={initialAuth}>
        <section className="auth-wrap">
          <div className="auth-card">
            <h1 style={{ marginTop: 0 }}>This login does not have access.</h1>
            <p className="editor-copy">
              Use the email your business invited, or ask your business admin to send a new login email.
            </p>
            <Link className="button secondary" href="/auth/signout">
              Sign out
            </Link>
          </div>
        </section>
      </Shell>
    );
  }

  const member = membership.member as OrganizationMemberRecord;
  const { data: tokens } = await admin
    .from("pass_tokens")
    .select("*")
    .eq("organization_id", org.id)
    .eq("assigned_member_id", member.id)
    .eq("status", "active")
    .order("created_at", { ascending: true });
  const activeTokens = (tokens || []) as PassTokenRecord[];
  const primaryToken = activeTokens[0] || null;
  const primaryUrl = primaryToken ? tokenUrl(primaryToken.token) : null;
  const qrUrl = primaryUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=520x520&data=${encodeURIComponent(primaryUrl)}`
    : null;

  return (
    <Shell footerLeft={org.name} footerRight="Employee pass" initialAuth={initialAuth}>
      <section className="simple-hero">
        <div className="kicker">
          <span className="mini-star">✦</span>
          <span>Digital pass</span>
        </div>
        <h1>{member.name}</h1>
        <p>{member.title || org.name}</p>
      </section>

      <section className="dashboard-wrap">
        <div className="dashboard-card">
          <div className="dashboard-kicker">Your public profile link</div>
          {primaryToken && primaryUrl && qrUrl ? (
            <>
              <h2>Ready to share.</h2>
              <div className="pass-qr-frame" style={{ maxWidth: 260 }}>
                <img src={qrUrl} alt={`QR code for ${primaryUrl}`} />
              </div>
              <p className="editor-copy" style={{ wordBreak: "break-all" }}>{primaryUrl}</p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Link className="button secondary" href={`/p/${primaryToken.token}`}>
                  Open public page
                </Link>
                <CopyLinkButton value={primaryUrl} />
                <button className="button secondary" type="button" disabled aria-disabled="true">
                  Add/save digital pass
                </button>
              </div>
            </>
          ) : (
            <>
              <h2>Your pass is not assigned yet.</h2>
              <p className="editor-copy">
                Ask your business admin to assign a permanent card or digital pass token to your employee record.
              </p>
            </>
          )}
        </div>
      </section>
    </Shell>
  );
}
