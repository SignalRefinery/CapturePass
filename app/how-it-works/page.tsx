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
      footerRight="TapTagg"
      myProfileHref={initialAuth?.slug ? `/${initialAuth.slug}` : null}
      initialAuth={initialAuth}
      navLinks={[
        { href: "/", label: "Home" },
        { href: "/pricing", label: "Pricing" },
        { href: "/partners", label: "Partners" }
      ]}
    >
      <section className="simple-hero">
        <div className="kicker">
          <span className="mini-star">✦</span>
          <span>How it works</span>
        </div>
        <h1>Play Tagg In Seconds.</h1>
        <p>
          Set up your links once. Share them anywhere with a tap or scan. No app,
          no searching, no awkward spelling out handles.
        </p>
      </section>

      <section className="steps">
        <div className="step">
          <div className="num">01</div>
          <div>
            <h2>Build your TapTagg</h2>
            <p>
              Add your socials, contact info, booking links, music, products, content,
              and whatever you want people to open first.
            </p>
          </div>
        </div>

        <div className="step">
          <div className="num">02</div>
          <div>
            <h2>Use your card as the trigger</h2>
            <p>
              Your TapTagg card points people to your page instantly. Update your profile
              anytime without changing the card.
            </p>
          </div>
        </div>

        <div className="step">
          <div className="num">03</div>
          <div>
            <h2>Play Tagg anywhere</h2>
            <p>
              TapTagg someone in the real world and send them straight to the right place:
              follow, book, buy, listen, call, or save your info.
            </p>
          </div>
        </div>
      </section>
    </Shell>
  );
}
