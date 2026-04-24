import { Shell } from "@/components/shared/shell";
import { createClient } from "@/lib/supabase/server";

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

export default async function HowItWorksPage() {
  const initialAuth = await getInitialAuth();

  return (
    <Shell
      footerLeft="How it works"
      footerRight="Signal Pass"
      myProfileHref={initialAuth?.slug ? `/${initialAuth.slug}` : null}
      initialAuth={initialAuth}
      navLinks={[
        { href: "/", label: "Home" },
        { href: "/pricing", label: "Pricing" },
        { href: "/partners", label: "Referral access" }
      ]}
    >
      <section className="simple-hero">
        <div className="kicker">
          <span className="mini-star">✦</span>
          <span>How it works</span>
        </div>
        <h1>Controlled identity, delivered by direct link.</h1>
        <p>
          Signal Pass keeps the experience simple: one profile, one issued
          destination, and minimal public surface area.
        </p>
      </section>

      <section className="steps">
        <div className="step">
          <div className="num">01</div>
          <div>
            <h2>Create the profile</h2>
            <p>
              Set up the public-facing details you want available to direct-link
              visitors.
            </p>
          </div>
        </div>

        <div className="step">
          <div className="num">02</div>
          <div>
            <h2>Approve and issue</h2>
            <p>
              Profiles are reviewed as needed, then an issued NFC / QR
              destination is generated from the private token route.
            </p>
          </div>
        </div>

        <div className="step">
          <div className="num">03</div>
          <div>
            <h2>Share intentionally</h2>
            <p>
              Your profile is designed for direct-link use, not public discovery,
              indexing, or browse surfaces.
            </p>
          </div>
        </div>
      </section>
    </Shell>
  );
}