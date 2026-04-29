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
        <h1>Partner access for people who already have the room.</h1>
        <p>
          Signal Pass works best when it moves through trusted networks. Referral and partner
          access is built for consultants, organizers, firms, and operators who can introduce the
          right people to a cleaner way to share contact details, materials, and follow-up links.
        </p>
      </section>

      <section className="section-wrap">
        <div className="steps">
          <div className="step"><div className="num">01</div><div><h2>Founder and early partner referrals</h2><p>Introduce Signal Pass to public-facing professionals, campaigns, organizations, and businesses that would benefit from controlled digital identity cards.</p></div></div>
          <div className="step"><div className="num">02</div><div><h2>Tracked access, clean attribution</h2><p>Approved partners can use referral codes so introductions are attributed clearly. Terms can be set by relationship, campaign, or project without putting public pricing on the page.</p></div></div>
          <div className="step"><div className="num">03</div><div><h2>Built for serious distribution</h2><p>This is not an open affiliate program. It is for people and organizations with real networks, trusted relationships, and a reason to put Signal Pass in front of the right users.</p></div></div>
        </div>
      </section>
    </Shell>
  );
}
