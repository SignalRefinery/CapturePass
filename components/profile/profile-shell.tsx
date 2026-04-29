import type { Profile } from "@/lib/types";
export function ProfileShell({ profile }: { profile: Profile }) {
  return <>
    <section className="profile-hero"><div className="profile-stack">
      <h1 className="profile-name">{profile.name}</h1>
      <p className="profile-role">{profile.role}</p>
      <div className="profile-meta">{profile.metaPills.map((pill) => <div className="meta-pill" key={pill}><span className="mini-dot" /><span>{pill}</span></div>)}</div>
      <div className="cta-row profile-actions">
        {profile.slug ? (
          <a className="button primary" href={`/api/vcard/${profile.slug}`}>
            Add to Contacts
          </a>
        ) : null}
        {profile.phone ? (
          <a className="button secondary" href={`sms:${profile.phone.replace(/\D/g, "")}`}>
            Text
          </a>
        ) : null}
      </div>
      <p className="profile-intro">{profile.intro}</p>
    </div></section>
    <section className="profile-grid">
      <div className="card"><h2>Primary links</h2><div className="links">{profile.primaryLinks.map((link) => {
        let href = link.href;
        if (link.title.toLowerCase() === "call" && profile.phone) {
          href = `tel:${profile.phone.replace(/\D/g, "")}`;
        }
        if (link.title.toLowerCase() === "email" && profile.email) {
          href = `mailto:${profile.email}`;
        }
        return (
          <a className="link-card" href={href} key={link.title}>
            <div>
              <div className="link-title">{link.title}</div>
              <div className="link-sub">{link.subtitle}</div>
            </div>
            <div className="arrow">↗</div>
          </a>
        );
      })}</div><div className="contact-strip"><div className="contact-line"><div><div className="contact-label">Email</div><div className="contact-value">{profile.email}</div></div></div><div className="contact-line"><div><div className="contact-label">Profile URL</div><div className="contact-value">{profile.profileUrl.replace('https://','')}</div></div></div></div></div>
      <div className="card qr-box"><h2>Scan to open</h2><div className="qr-frame"><img src={profile.qrUrl} alt={`QR code for ${profile.name} Signal Pass profile`} /></div><div className="qr-caption">Use on printed cards, event materials, leave-behinds, or person-to-person introductions.</div></div>
    </section>
  </>;
}
