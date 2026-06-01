import type { AnalyticsEventRecord, ContactSubmissionRecord, OrganizationMemberRecord } from "@/lib/types";

type AnalyticsSummaryProps = {
  events: AnalyticsEventRecord[];
  contacts?: ContactSubmissionRecord[];
  members?: Pick<OrganizationMemberRecord, "id" | "name">[];
  business?: boolean;
};

function uniqueVisitors(events: AnalyticsEventRecord[]) {
  return new Set(events.map((event) => event.visitor_id).filter(Boolean)).size;
}

function count(events: AnalyticsEventRecord[], type: string) {
  return events.filter((event) => event.event_type === type).length;
}

function sourceCounts(events: AnalyticsEventRecord[]) {
  const counts = new Map<string, number>();
  events.forEach((event) => {
    if (event.event_type !== "profile_view") return;
    counts.set(event.source || "unknown", (counts.get(event.source || "unknown") || 0) + 1);
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

function topActions(events: AnalyticsEventRecord[]) {
  const counts = new Map<string, number>();
  events.forEach((event) => {
    if (event.event_type !== "button_click") return;
    const label = event.action_label || event.action_type || "Other";
    counts.set(label, (counts.get(label) || 0) + 1);
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function percent(numerator: number, denominator: number) {
  if (!denominator) return "0%";
  return `${Math.round((numerator / denominator) * 100)}%`;
}

export function AnalyticsSummary({ events, contacts = [], members = [], business = false }: AnalyticsSummaryProps) {
  const profileViews = count(events, "profile_view");
  const visitors = uniqueVisitors(events);
  const contactsReceived = contacts.length || count(events, "contact_shared") || count(events, "contact_submission");
  const contactSaves = count(events, "contact_save");
  const buttonClicks = count(events, "button_click");
  const summaryCards = [
    { label: business ? "Organization Views" : "Profile Views", value: profileViews },
    { label: business ? "Organization Unique Visitors" : "Unique Visitors", value: visitors },
    { label: "NFC Taps", value: count(events, "nfc_tap") },
    { label: "QR Scans", value: count(events, "qr_scan") },
    { label: "Contacts Received", value: contactsReceived },
    { label: "Contact Saves", value: contactSaves }
  ];
  const memberNameById = new Map(members.map((member) => [member.id, member.name]));
  const leaderboard = members.map((member) => {
    const memberEvents = events.filter((event) => event.organization_member_id === member.id);
    const memberContacts = contacts.filter((contact) => contact.profile_id === member.id);
    const memberVisitors = uniqueVisitors(memberEvents);
    const memberContactCount = memberContacts.length || count(memberEvents, "contact_shared") || count(memberEvents, "contact_submission");
    return {
      member,
      views: count(memberEvents, "profile_view"),
      visitors: memberVisitors,
      contacts: memberContactCount,
      contactSaves: count(memberEvents, "contact_save"),
      buttonClicks: count(memberEvents, "button_click"),
      conversionRate: percent(memberContactCount, memberVisitors)
    };
  }).sort((a, b) => b.views - a.views);

  return (
    <>
      <section className="dashboard-wrap">
        <div className="analytics-card-grid">
          {summaryCards.map((card) => (
            <div className="dashboard-card analytics-metric-card" key={card.label}>
              <span>{card.label}</span>
              <strong>{card.value}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="dashboard-wrap">
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <div className="dashboard-kicker">Traffic Source</div>
            <h2>How people arrive.</h2>
            <div className="status-list">
              {sourceCounts(events).map(([source, value]) => (
                <div className="status-row" key={source}>
                  <span>{source.replace("_", " ")}</span>
                  <strong>{value}</strong>
                </div>
              ))}
              {!sourceCounts(events).length ? <p className="editor-copy">No traffic yet.</p> : null}
            </div>
          </div>

          <div className="dashboard-card">
            <div className="dashboard-kicker">Top Actions</div>
            <h2>What people tap.</h2>
            <div className="status-list">
              {topActions(events).map(([label, value]) => (
                <div className="status-row" key={label}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
              {!topActions(events).length ? <p className="editor-copy">No button clicks yet.</p> : null}
            </div>
          </div>
        </div>
      </section>

      {business ? (
        <section className="dashboard-wrap">
          <div className="dashboard-card">
            <div className="dashboard-kicker">Team Leaderboard</div>
            <h2>Team engagement.</h2>
            <div className="admin-table-frame business-member-table">
              <div className="admin-table-scroll">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Employee/Profile</th>
                      <th>Views</th>
                      <th>Unique Visitors</th>
                      <th>Contacts Received</th>
                      <th>Contact Saves</th>
                      <th>Button Clicks</th>
                      <th>Conversion Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((row) => (
                      <tr key={row.member.id}>
                        <td>{row.member.name}</td>
                        <td>{row.views}</td>
                        <td>{row.visitors}</td>
                        <td>{row.contacts}</td>
                        <td>{row.contactSaves}</td>
                        <td>{row.buttonClicks}</td>
                        <td>{row.conversionRate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="dashboard-wrap">
        <div className="dashboard-card">
          <div className="dashboard-kicker">Recent Activity</div>
          <h2>Latest events.</h2>
          <div className="admin-table-frame business-member-table">
            <div className="admin-table-scroll">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Event</th>
                    {business ? <th>Profile</th> : null}
                    <th>Source</th>
                    <th>Action</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {events.slice(0, 25).map((event) => (
                    <tr key={event.id}>
                      <td>{event.event_type.replace(/_/g, " ")}</td>
                      {business ? <td>{event.organization_member_id ? memberNameById.get(event.organization_member_id) || "—" : "—"}</td> : null}
                      <td>{event.source || "—"}</td>
                      <td>{event.action_label || event.action_type || "—"}</td>
                      <td>{formatDate(event.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {!events.length ? <p className="editor-copy" style={{ marginTop: 16 }}>No analytics events yet.</p> : null}
        </div>
      </section>
    </>
  );
}
