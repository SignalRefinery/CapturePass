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
        <h1>A cleaner way to hand someone your next step.</h1>
        <p>
          Signal Pass connects a physical card to a live profile. When someone taps
          or scans, they land on a clean, controlled page with your contact info
          and next steps — no searching, no typing, no friction.
        </p>
      </section>

      <section className="steps">
        <div className="step">
          <div className="num">01</div>
          <div>
            <h2>Create your controlled profile</h2>
            <p>
              Set up your profile with your phone, email, and key links. This is
              exactly what people will see when they tap your card or open your
              link.
            </p>
          </div>
        </div>

        <div className="step">
          <div className="num">02</div>
          <div>
            <h2>Issue the card link</h2>
            <p>
              Your card points to a secure token link, not a fixed page. You can
              update your profile anytime without reprinting cards or changing QR
              codes.
            </p>
          </div>
        </div>

        <div className="step">
          <div className="num">03</div>
          <div>
            <h2>Share without adding friction</h2>
            <p>
              Hand someone your card or let them scan. They land instantly on your
              profile and can call, email, or visit your links in one tap.
            </p>
          </div>
        </div>
      </section>
    </Shell>
  );
}