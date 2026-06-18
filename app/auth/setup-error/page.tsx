import Link from "next/link";
import { Shell } from "@/components/shared/shell";
import { safeInternalRedirect } from "@/lib/auth/redirect";

export default async function AuthSetupErrorPage({
  searchParams
}: {
  searchParams?: Promise<{
    next?: string;
    plan?: string;
    reason?: string;
  }>;
}) {
  const params = searchParams ? await searchParams : {};
  const nextPath = safeInternalRedirect(params?.next);
  const plan = params?.plan || null;
  const retryParams = new URLSearchParams();

  retryParams.set("next", nextPath);

  if (plan) {
    retryParams.set("plan", plan);
  }

  return (
    <Shell
      footerLeft="Account setup"
      footerRight="CapturePass"
      navLinks={[
        { href: "/", label: "Home" },
        { href: "/pricing", label: "Pricing" },
        { href: "/login", label: "Log in" }
      ]}
    >
      <section className="simple-hero">
        <div className="kicker">
          <span className="mini-star">✦</span>
          <span>Setup interrupted</span>
        </div>
        <h1>Your account setup was not completed.</h1>
        <p>
          Your email may be verified, but CapturePass could not finish creating your profile.
          Please try setup again before continuing to the dashboard or checkout.
        </p>
        <div className="cta-row">
          <Link className="button primary" href={`/auth/callback?${retryParams}`}>
            Try setup again
          </Link>
          <Link className="button secondary" href="/login">
            Return to login
          </Link>
        </div>
      </section>
    </Shell>
  );
}
