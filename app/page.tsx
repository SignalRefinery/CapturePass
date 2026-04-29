import Link from "next/link";
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

export default async function HomePage() {
  const initialAuth = await getInitialAuth();

  return (
    <Shell
      footerLeft="Premium profile system"
      footerRight="Signal Pass"
      initialAuth={initialAuth}
      navLinks={[
        { href: "/how-it-works", label: "How it works" },
        { href: "/pricing", label: "Pricing" }
      ]}
    >
      <section className="simple-hero" style={{ paddingBottom: 40 }}>
        <div className="kicker">
          <span className="mini-star">✦</span>
          <span>Signal Pass</span>
        </div>

        <h1
          style={{
            maxWidth: 1080,
            margin: "28px auto 18px",
            fontFamily: '"Cormorant Garamond", Georgia, serif',
            fontWeight: 600,
            fontSize: "clamp(62px, 8vw, 112px)",
            lineHeight: 0.9,
            letterSpacing: "-0.04em"
          }}
        >
          A sharper digital card for high-trust operators.
        </h1>

        <p
          style={{
            maxWidth: 820,
            margin: "0 auto",
            color: "var(--muted)",
            fontSize: 21,
            lineHeight: 1.72,
            fontWeight: 400
          }}
        >
          Signal Pass is a premium profile system for professionals who need to
          move information quickly, credibly, and without friction.
        </p>

        <div
          style={{
            marginTop: 34,
            display: "flex",
            justifyContent: "center",
            gap: 14,
            flexWrap: "wrap"
          }}
        >
          <Link className="button primary" href="/signup">
            Request Access
          </Link>

          <Link
            className="button secondary"
            href="/pricing"
            style={{
              border: "1px solid rgba(255,255,255,.1)",
              background: "rgba(255,255,255,.025)",
              color: "var(--text)"
            }}
          >
            View Pricing
          </Link>
        </div>

        <Link
          href="/how-it-works"
          style={{
            display: "inline-block",
            marginTop: 18,
            color: "var(--gold-soft)",
            fontSize: 15,
            borderBottom: "1px solid rgba(219,193,141,.55)"
          }}
        >
          How it works
        </Link>
      </section>

      <section className="section-wrap">
        <div style={{ display: "grid", gap: 18 }}>
          <div className="card" style={{ padding: 26 }}>
            <h2
              style={{
                margin: "0 0 10px",
                fontFamily: '"Cormorant Garamond", Georgia, serif',
                fontSize: 42,
                lineHeight: 0.95,
                letterSpacing: "-0.02em"
              }}
            >
              Built for real conversations
            </h2>
            <p
              style={{
                margin: 0,
                color: "var(--muted)",
                fontSize: 16,
                lineHeight: 1.7
              }}
            >
              Designed for meetings, briefings, and high-trust environments where
              clarity matters more than volume.
            </p>
          </div>

          <div className="card" style={{ padding: 26 }}>
            <h2
              style={{
                margin: "0 0 10px",
                fontFamily: '"Cormorant Garamond", Georgia, serif',
                fontSize: 42,
                lineHeight: 0.95,
                letterSpacing: "-0.02em"
              }}
            >
              Signal over noise
            </h2>
            <p
              style={{
                margin: 0,
                color: "var(--muted)",
                fontSize: 16,
                lineHeight: 1.7
              }}
            >
              Structured, minimal, and built to be understood instantly. No clutter.
              No dead weight. No generic link-hub feel.
            </p>
          </div>

          <div className="card" style={{ padding: 26 }}>
            <h2
              style={{
                margin: "0 0 10px",
                fontFamily: '"Cormorant Garamond", Georgia, serif',
                fontSize: 42,
                lineHeight: 0.95,
                letterSpacing: "-0.02em"
              }}
            >
              Limited release
            </h2>
            <p
              style={{
                margin: 0,
                color: "var(--muted)",
                fontSize: 16,
                lineHeight: 1.7
              }}
            >
              Available on a selective basis while the platform is refined and the
              full product build is brought online.
            </p>
          </div>

          <div
            className="card"
            style={{
              marginTop: 18,
              padding: 28,
              textAlign: "center",
              background:
                "radial-gradient(500px 180px at 50% -20%, rgba(201,164,92,.08), transparent 60%), linear-gradient(180deg, rgba(255,255,255,.03), rgba(255,255,255,.012)), linear-gradient(180deg, rgba(11,20,35,.82), rgba(7,16,28,.9))"
            }}
          >
            <h3
              style={{
                margin: "0 0 10px",
                fontFamily: '"Cormorant Garamond", Georgia, serif',
                fontSize: 44,
                lineHeight: 0.95,
                letterSpacing: "-0.02em"
              }}
            >
              Not another link hub.
            </h3>
            <p
              style={{
                margin: "0 auto",
                maxWidth: 860,
                color: "var(--muted)",
                fontSize: 18,
                lineHeight: 1.7
              }}
            >
              Signal Pass is designed for environments where credibility, speed,
              and structure matter. It gives professionals a cleaner way to share
              the right information in the moment it matters.
            </p>
          </div>
        </div>
      </section>
    </Shell>
  );
}