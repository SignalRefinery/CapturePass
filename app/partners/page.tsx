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


export default async function PartnersPage() {
  const initialAuth = await getInitialAuth();

  return (
    <Shell
      footerLeft="Referral access"
      footerRight="Signal Pass"
      initialAuth={initialAuth}
      navLinks={[
        { href: "/", label: "Home" },
        { href: "/pricing", label: "Pricing" },
        { href: "/how-it-works", label: "How it works" }
      ]}
    >
      <section className="simple-hero">
        <div className="kicker">
          <span className="mini-star">✦</span>
          <span>Referral access</span>
        </div>
        <h1>Referral and partner access.</h1>
        <p>Signal Pass supports founder referrals, partner access, and controlled distribution for approved users and teams.</p>
      </section>

      <section className="section-wrap">
        <div className="steps">
          <div className="step"><div className="num">01</div><div><h2>Founder introductions</h2><p>Invite the right people in through direct recommendation and controlled onboarding.</p></div></div>
          <div className="step"><div className="num">02</div><div><h2>Partner pathways</h2><p>Track referral codes, reward the right advocates, and keep the access layer intentional.</p></div></div>
        </div>
      </section>
    </Shell>
  );
}
