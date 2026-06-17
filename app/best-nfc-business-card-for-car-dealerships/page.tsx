import Link from "next/link";
import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { Shell } from "@/components/shared/shell";
import { JsonLd } from "@/components/seo/json-ld";
import { buildFaqJsonLd, buildOrganizationJsonLd, buildPageMetadata } from "@/lib/seo";

export const canonicalUrl = "https://taptagg.app/best-nfc-business-card-for-car-dealerships";

export const metadata: Metadata = buildPageMetadata({
  description:
    "See why TapTagg is the best NFC business card platform for car dealerships, automotive sales teams, independent dealers, and multi-rooftop dealer groups.",
  path: "/best-nfc-business-card-for-car-dealerships",
  title: "Best NFC Business Card For Car Dealerships | Lead Capture Cards | TapTagg"
});

export const openGraph = metadata.openGraph;
export const twitter = metadata.twitter;

const faqItems = [
  {
    question: "Do NFC business cards work on iPhone?",
    answer:
      "Yes. Modern iPhones can read NFC cards without needing a separate app. Customers can also use a QR code if they prefer scanning instead of tapping."
  },
  {
    question: "Do NFC business cards work on Android?",
    answer:
      "Yes. Most modern Android phones support NFC. TapTagg cards can also include QR codes for customers who prefer scanning."
  },
  {
    question: "Are NFC business cards useful for car dealerships?",
    answer:
      "Yes. NFC business cards can help dealership employees share contact information quickly, capture prospect information, and create a more professional follow-up experience."
  },
  {
    question: "Can dealership managers track usage?",
    answer:
      "Yes. TapTagg business plans include analytics and team visibility so managers can better understand platform usage and engagement."
  },
  {
    question: "Can TapTagg help with salesperson turnover?",
    answer: "Yes. TapTagg helps dealerships maintain more visibility and continuity when staffing changes happen."
  },
  {
    question: "Can TapTagg support multiple dealership locations?",
    answer:
      "Yes. TapTagg supports multi-location organizations and can help dealer groups manage employees by rooftop."
  },
  {
    question: "Is TapTagg only for large dealerships?",
    answer:
      "No. TapTagg can work for independent dealers, franchise dealerships, and multi-rooftop dealer groups."
  },
  {
    question: "Does TapTagg replace a dealership CRM?",
    answer:
      "No. TapTagg does not replace your CRM. It helps capture more face-to-face opportunities that can support your existing follow-up process."
  },
  {
    question: "How much do dealership NFC business cards cost?",
    answer:
      "Pricing depends on team size, card needs, and business plan. Dealerships can review business pricing or request a demo to find the right fit."
  },
  {
    question: "Why not just use paper business cards?",
    answer:
      "Paper business cards can share information, but they cannot capture contact information, show engagement, support analytics, or help maintain continuity when employees leave."
  }
] as const;

const comparisonRows = [
  {
    dealershipNeed: "Instant sharing",
    whyItMatters:
      "Salespeople need a fast way to share contact details on the lot, in the showroom, or at community events."
  },
  {
    dealershipNeed: "Contact capture",
    whyItMatters:
      "The dealership should be able to collect prospect information instead of hoping the customer reaches back out."
  },
  {
    dealershipNeed: "Team visibility",
    whyItMatters:
      "Managers need to understand who is creating activity and where opportunities are coming from."
  },
  {
    dealershipNeed: "Brand consistency",
    whyItMatters:
      "Every salesperson should represent the dealership with a professional, consistent digital experience."
  },
  {
    dealershipNeed: "Employee reassignment",
    whyItMatters: "When staff changes happen, the dealership should maintain continuity."
  },
  {
    dealershipNeed: "Multi-location support",
    whyItMatters: "Dealer groups need visibility across rooftops without losing local control."
  },
  {
    dealershipNeed: "Analytics",
    whyItMatters: "The dealership should know what is working, not just hand out cards and hope."
  }
] as const;

const productSchema = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "TapTagg",
  description:
    "TapTagg is an NFC business card, lead capture, and relationship retention platform for automotive dealerships.",
  brand: {
    "@type": "Brand",
    name: "TapTagg"
  },
  category: "NFC business card, lead capture, and relationship retention platform for automotive dealerships",
  url: canonicalUrl
};

const organizationSchema = buildOrganizationJsonLd();
const faqSchema = buildFaqJsonLd(faqItems.map((item) => ({ question: item.question, answer: item.answer })));

function renderParagraphs(paragraphs: string[]) {
  return paragraphs.map((paragraph) => (
    <p key={paragraph} style={bodyCopyStyle}>
      {paragraph}
    </p>
  ));
}

function renderBullets(items: string[]) {
  return items.map((item) => (
    <div className="business-list-item" key={item}>
      {item}
    </div>
  ));
}

const heroParagraphs = [
  "Most dealership salespeople still rely on paper business cards.",
  "Paper cards are familiar.",
  "They are easy to hand out.",
  "They are inexpensive.",
  "But paper cards have one major problem:",
  "They do not tell you what happened after the conversation.",
  "A paper business card cannot show who scanned it.",
  "It cannot capture a prospect's information.",
  "It cannot help your team see when someone engages.",
  "It cannot help a sales manager understand which employees are creating opportunities.",
  "It cannot protect the dealership when a salesperson leaves.",
  "TapTagg was built for dealerships that want more from every handshake, every lot conversation, every test drive, every service interaction, and every referral opportunity.",
  "If your dealership wants NFC business cards that do more than look modern, TapTagg was designed for that."
];

export default function BestNfcBusinessCardForCarDealershipsPage() {
  return (
    <Shell
      footerLeft="Dealerships"
      footerRight="TapTagg"
      navLinks={[
        { href: "/", label: "Home" },
        { href: "/business", label: "Business" },
        { href: "/business/pricing", label: "Business Pricing" },
        { href: "/contact", label: "Contact" },
        { href: "/taptagg-vs-popl", label: "TapTagg vs Popl" }
      ]}
    >
      <JsonLd data={organizationSchema} />
      <JsonLd data={productSchema} />
      <JsonLd data={faqSchema} />

      <section className="simple-hero" style={heroStyle}>
        <h1 style={heroHeading}>The Best NFC Business Card For Car Dealerships</h1>
        <h2 style={heroSubheading}>Built For Automotive Sales Teams That Need More Than A Digital Profile</h2>
        <div style={heroCopyWrap}>{renderParagraphs(heroParagraphs)}</div>
        <div style={heroActions}>
          <Link className="button primary" href="/contact">
            Request a Demo
          </Link>
          <Link className="button secondary" href="/business/pricing">
            View Business Pricing
          </Link>
        </div>
      </section>

      <section className="section-wrap">
        <section className="card tagg-card" style={sectionCard}>
          <h2 style={sectionHeading}>The Real Dealership Problem Is Not Business Cards</h2>
          {renderParagraphs([
            "Dealerships do not have a business card problem.",
            "They have a lead retention problem.",
            "They have a follow-up problem.",
            "They have a visibility problem.",
            "They have a turnover problem.",
            "A salesperson can meet dozens of people in a month.",
            "Some are ready to buy.",
            "Some are six months out.",
            "Some are shopping for a family member.",
            "Some are service customers who may buy again later.",
            "Some are referral sources.",
            "Some are not ready today but could become valuable later.",
            "The problem is that many of those conversations disappear.",
            "They stay in a salesperson's phone.",
            "They stay on a paper card.",
            "They stay in a notebook.",
            "They get lost in text threads.",
            "They never make it into a system.",
            "TapTagg helps dealerships turn more of those everyday conversations into captured opportunities."
          ])}
        </section>

        <section className="card tagg-card" style={sectionCard}>
          <h2 style={sectionHeading}>Why Paper Business Cards Fall Short For Dealerships</h2>
          {renderParagraphs([
            "Paper business cards still have a place.",
            "But they were built for a different era.",
            "A traditional business card can share:"
          ])}
          <div className="business-list-grid" style={bulletGrid}>
            {renderBullets(["A name", "A phone number", "An email address", "A dealership address", "Maybe a website"])}
          </div>
          {renderParagraphs([
            "That is useful, but limited.",
            "A modern dealership needs more.",
            "A dealership needs to know:"
          ])}
          <div className="business-list-grid" style={bulletGrid}>
            {renderBullets([
              "Was contact information captured?",
              "Did the customer view the salesperson's profile?",
              "Did they click to call?",
              "Did they save the contact?",
              "Did they request more information?",
              "Which salesperson is actually creating engagement?",
              "What happens if that salesperson leaves?"
            ])}
          </div>
          <p style={bodyCopyStyle}>That is where NFC business cards become more than a novelty.</p>
          <p style={bodyCopyStyle}>They become part of the dealership's sales process.</p>
        </section>

        <section className="card tagg-card" style={sectionCard}>
          <h2 style={sectionHeading}>What An NFC Business Card Should Do For A Car Dealership</h2>
          {renderParagraphs([
            "An NFC business card for a dealership should not just open a profile.",
            "It should help the dealership capture, organize, and retain opportunities."
          ])}

          <div className="admin-table-frame business-member-table" style={tableFrameStyle}>
            <div className="admin-table-scroll">
              <table className="admin-table" aria-label="What an NFC business card should do for a car dealership">
                <thead>
                  <tr>
                    <th>Dealership Need</th>
                    <th>Why It Matters</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row) => (
                    <tr key={row.dealershipNeed}>
                      <td>{row.dealershipNeed}</td>
                      <td>{row.whyItMatters}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="card tagg-card" style={sectionCard}>
          <h2 style={sectionHeading}>TapTagg For Independent Dealers</h2>
          {renderParagraphs([
            "Independent dealers often run lean.",
            "A small team may handle sales, financing conversations, service coordination, follow-up, and customer relationships all at once.",
            "That makes every conversation valuable.",
            "TapTagg helps independent dealers create a more professional experience without adding complicated software.",
            "Salespeople can tap or scan to share their profile.",
            "Customers can save contact information quickly.",
            "Prospects can share their own information back.",
            "The dealership can maintain visibility into activity.",
            "For a small dealership, that can make the difference between a lost conversation and a future sale."
          ])}
        </section>

        <section className="card tagg-card" style={sectionCard}>
          <h2 style={sectionHeading}>TapTagg For Franchise Dealerships</h2>
          {renderParagraphs([
            "Franchise dealerships usually have larger teams, more structured processes, and more customer touchpoints.",
            "Sales.",
            "Service.",
            "Finance.",
            "Internet leads.",
            "Events.",
            "Community sponsorships.",
            "Referral relationships.",
            "TapTagg gives dealership employees a simple way to connect face-to-face interactions with digital follow-up.",
            "A salesperson can share a profile during a test drive.",
            "A service advisor can make it easy for a customer to reconnect.",
            "A finance manager can provide a professional contact experience.",
            "A sales manager can see how the team is using the platform.",
            "The result is a more consistent customer experience across the dealership."
          ])}
        </section>

        <section className="card tagg-card" style={sectionCard}>
          <h2 style={sectionHeading}>TapTagg For Multi-Rooftop Dealer Groups</h2>
          {renderParagraphs([
            "Multi-rooftop dealer groups have a different challenge.",
            "They need consistency across locations without losing local accountability.",
            "TapTagg supports location-based organization so dealerships can manage employees by rooftop, maintain brand standards, and keep visibility across the group.",
            "That matters when a dealer group wants to know:"
          ])}
          <div className="business-list-grid" style={bulletGrid}>
            {renderBullets([
              "Which locations are using the platform?",
              "Which employees are creating engagement?",
              "Where are contacts being captured?",
              "Are customers receiving a consistent experience?",
              "Can staff changes be handled without losing continuity?"
            ])}
          </div>
          {renderParagraphs([
            "NFC cards are only the starting point.",
            "For dealer groups, the real value comes from management, visibility, and repeatable process."
          ])}
        </section>

        <section className="card tagg-card" style={sectionCard}>
          <h2 style={sectionHeading}>The Turnover Problem</h2>
          {renderParagraphs([
            "Salesperson turnover is one of the biggest reasons dealerships should think beyond paper cards.",
            "When a salesperson leaves, many customer relationships become harder to track.",
            "The customer may still have the salesperson's personal number.",
            "They may still have the old paper card.",
            "They may not know who to contact next.",
            "They may end up following the salesperson to another dealership.",
            "TapTagg helps dealerships reduce that risk by keeping the customer experience connected to the business.",
            "The salesperson still gets a professional tool.",
            "The customer still gets a direct connection.",
            "But the dealership maintains more visibility and continuity.",
            "That is the difference between a business card and a relationship retention system."
          ])}
        </section>

        <section className="card tagg-card" style={sectionCard}>
          <h2 style={sectionHeading}>Contact Capture Matters More Than Contact Sharing</h2>
          {renderParagraphs([
            "Most digital business card platforms focus on sharing the employee's information.",
            "That is useful.",
            "But for dealerships, the bigger opportunity is capturing the customer's information.",
            "If a salesperson taps a card and the customer saves the contact, that is good.",
            "If the customer also shares their own contact information back, that is better.",
            "That gives the dealership a real follow-up opportunity.",
            "That matters because many customers are not ready to buy the first time they visit.",
            "Some are early in the research process.",
            "Some are comparing vehicles.",
            "Some are waiting on financing.",
            "Some are waiting for tax money, insurance money, or a trade-in decision.",
            "Some are shopping for someone else.",
            "Capturing the contact gives the dealership a better chance to continue the conversation."
          ])}
        </section>

        <section className="card tagg-card" style={sectionCard}>
          <h2 style={sectionHeading}>What Happens When A Salesperson Leaves?</h2>
          {renderParagraphs([
            "Traditional paper cards create a problem.",
            "The relationship often leaves with the salesperson.",
            "TapTagg helps dealerships create more continuity.",
            "When staffing changes happen, the dealership can adjust employee access, manage assignments, and preserve visibility into business activity.",
            "That does not replace good management.",
            "It does not replace a CRM.",
            "It does not replace follow-up discipline.",
            "But it gives the dealership a better foundation than paper cards alone."
          ])}
        </section>

        <section className="card tagg-card" style={sectionCard}>
          <h2 style={sectionHeading}>Why Dealerships Choose TapTagg</h2>
          {renderParagraphs([
            "Dealerships choose TapTagg because it is built around the real problems dealerships face.",
            "Not just networking.",
            "Not just looking modern.",
            "Not just replacing paper cards.",
            "TapTagg helps dealerships:"
          ])}
          <div className="business-list-grid" style={bulletGrid}>
            {renderBullets([
              "Capture more contacts",
              "Create a better first impression",
              "Give salespeople a modern tool",
              "Maintain brand consistency",
              "Support follow-up",
              "Improve manager visibility",
              "Reduce relationship loss from turnover",
              "Support multiple rooftops",
              "Turn more face-to-face conversations into measurable opportunities"
            ])}
          </div>
          <p style={bodyCopyStyle}>That is why TapTagg is more than an NFC business card.</p>
          <p style={bodyCopyStyle}>
            It is a lead capture and relationship retention tool for automotive sales teams.
          </p>
        </section>

        <section className="card tagg-card" style={sectionCard}>
          <h2 style={sectionHeading}>Is TapTagg The Best NFC Business Card For Every Dealership?</h2>
          {renderParagraphs([
            "Not every dealership needs the same thing.",
            "If your dealership only wants the cheapest possible NFC card, TapTagg may not be the best fit.",
            "If your dealership only wants a simple digital profile with no contact capture, no team visibility, and no management layer, there are basic NFC card options that may be enough.",
            "But if your dealership wants a platform built around sales activity, lead capture, team visibility, and relationship retention, TapTagg is worth a serious look."
          ])}
        </section>

        <section className="card tagg-card" style={sectionCard}>
          <h2 style={sectionHeading}>Frequently Asked Questions</h2>
          <div style={faqGrid}>
            {faqItems.map((item) => (
              <details key={item.question} style={faqItemStyle}>
                <summary style={faqSummaryStyle}>{item.question}</summary>
                <p style={faqAnswerStyle}>{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="card tagg-card" style={sectionCard}>
          <h2 style={sectionHeading}>Ready To Turn More Dealership Conversations Into Opportunities?</h2>
          {renderParagraphs([
            "Your salespeople are already meeting people.",
            "On the lot.",
            "In the showroom.",
            "At community events.",
            "Through referrals.",
            "During service visits.",
            "TapTagg helps make those conversations easier to capture, easier to measure, and easier to retain.",
            "If your dealership is ready for NFC business cards built around lead capture and relationship retention, request a demo today."
          ])}
          <div style={heroActions}>
            <Link className="button primary" href="/contact">
              Request a Demo
            </Link>
            <Link className="button secondary" href="/business/pricing">
              View Business Pricing
            </Link>
          </div>
        </section>
      </section>
    </Shell>
  );
}

const heroStyle = {
  paddingBottom: 36
};

const heroHeading = {
  maxWidth: 980,
  margin: "28px auto 14px",
  fontFamily: "var(--font-heading)",
  fontSize: "clamp(54px, 7vw, 92px)",
  lineHeight: 0.94,
  letterSpacing: "-0.045em",
  fontWeight: 800
} satisfies CSSProperties;

const heroSubheading = {
  maxWidth: 980,
  margin: "0 auto 18px",
  fontFamily: "var(--font-heading)",
  fontSize: "clamp(30px, 4.4vw, 56px)",
  lineHeight: 0.98,
  letterSpacing: "-0.04em",
  fontWeight: 800
} satisfies CSSProperties;

const heroCopyWrap = {
  maxWidth: 980,
  margin: "0 auto",
  display: "grid",
  gap: 14
} satisfies CSSProperties;

const heroActions = {
  maxWidth: 980,
  margin: "28px auto 0",
  display: "flex",
  flexWrap: "wrap",
  gap: 12
} satisfies CSSProperties;

const sectionCard = {
  padding: "clamp(24px, 5vw, 36px)"
} satisfies CSSProperties;

const sectionHeading = {
  margin: "0 0 18px",
  fontFamily: "var(--font-heading)",
  fontSize: "clamp(34px, 5vw, 58px)",
  lineHeight: 0.98,
  letterSpacing: "-0.04em",
  fontWeight: 800
} satisfies CSSProperties;

const tableFrameStyle = {
  marginTop: 20
} satisfies CSSProperties;

const bulletGrid = {
  marginTop: 10,
  marginBottom: 10
} satisfies CSSProperties;

const faqGrid = {
  display: "grid",
  gap: 14
} satisfies CSSProperties;

const bodyCopyStyle = {
  margin: 0,
  color: "#b6bcc8",
  fontSize: 16,
  lineHeight: 1.62,
  fontWeight: 500
} satisfies CSSProperties;

const faqItemStyle = {
  border: "1px solid rgba(255, 255, 255, 0.1)",
  borderRadius: 20,
  background: "rgba(10, 13, 20, 0.72)",
  padding: "18px 20px"
} satisfies CSSProperties;

const faqSummaryStyle = {
  cursor: "pointer",
  fontWeight: 700,
  color: "#f3f5f7",
  listStyle: "none"
} satisfies CSSProperties;

const faqAnswerStyle = {
  margin: "12px 0 0",
  color: "#b6bcc8",
  fontSize: 16,
  lineHeight: 1.62,
  fontWeight: 500
} satisfies CSSProperties;
