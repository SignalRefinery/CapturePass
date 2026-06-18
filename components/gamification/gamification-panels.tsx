import type {
  BadgeDefinition,
  LeaderboardRow,
  SalesAttributionEvent,
  ChallengeProgress,
  Competition,
  TeamChallenge,
  UserBadge
} from "@/lib/types";
import { BusinessGamificationManager } from "@/components/gamification/business-gamification-manager";
import { calculateMetricProgress, normalizeMetricMetricKey } from "@/lib/gamification/scoring";

type PersonalGamificationSummary = {
  contactsCaptured: number;
  contactsCapturedThisMonth: number;
  taptaggScore: number;
  monthlyScore: number;
  currentStreak: number;
  profileViews: number;
  qrScans: number;
  vcardDownloads: number;
  phoneClicks: number;
  emailClicks: number;
  websiteClicks: number;
  socialClicks: number;
  appointmentActions: number;
  salesLogged: number;
  revenueLogged: number;
  badges: UserBadge[];
  badgeDefinitions: BadgeDefinition[];
};

type BusinessGamificationSummary = {
  leaderboard: LeaderboardRow[];
  challenges: TeamChallenge[];
  challengeProgress: ChallengeProgress[];
  competitions: Competition[];
  salesAttributionEvents: SalesAttributionEvent[];
};

function badgeProgress(summary: PersonalGamificationSummary, definition: BadgeDefinition) {
  const metric = normalizeMetricMetricKey(definition.metric_key || "");
  switch (metric) {
    case "contacts_captured":
      return calculateMetricProgress(metric, summary.contactsCaptured, definition.threshold_value);
    case "profile_views":
      return calculateMetricProgress(metric, summary.profileViews, definition.threshold_value);
    case "qr_scans":
      return calculateMetricProgress(metric, summary.qrScans, definition.threshold_value);
    case "active_streak":
      return calculateMetricProgress(metric, summary.currentStreak, definition.threshold_value);
    case "monthly_score":
      return calculateMetricProgress(metric, summary.monthlyScore, definition.threshold_value);
    case "sales_logged":
      return calculateMetricProgress(metric, summary.salesLogged, definition.threshold_value);
    case "appointment_actions":
      return calculateMetricProgress(metric, summary.appointmentActions, definition.threshold_value);
    case "revenue_logged":
      return calculateMetricProgress(metric, summary.revenueLogged, definition.threshold_value);
    default:
      return calculateMetricProgress(metric, summary.taptaggScore, definition.threshold_value);
  }
}

export function PersonalPerformancePanel({ summary }: { summary: PersonalGamificationSummary }) {
  const earnedKeys = new Set(summary.badges.map((badge) => badge.badge_key));
  const recentBadges = summary.badges.slice().sort((a, b) => String(b.earned_at || "").localeCompare(String(a.earned_at || ""))).slice(0, 4);
  const lockedBadges = summary.badgeDefinitions
    .filter((definition) => definition.category === "individual" && !earnedKeys.has(definition.badge_key))
    .slice(0, 4);

  return (
    <section className="dashboard-wrap" id="performance">
      <div className="dashboard-grid">
        <article className="dashboard-card">
          <div className="dashboard-kicker">Performance</div>
          <h2>Contacts captured this month.</h2>
          <p className="editor-copy">The score always weights contacts first, because that is the clearest signal of real business momentum.</p>
          <div className="status-list">
            <div className="status-row"><span>This month</span><strong>{summary.contactsCapturedThisMonth}</strong></div>
            <div className="status-row"><span>All time</span><strong>{summary.contactsCaptured}</strong></div>
            <div className="status-row"><span>CapturePass score</span><strong>{summary.monthlyScore}</strong></div>
          </div>
        </article>

        <article className="dashboard-card">
          <div className="dashboard-kicker">Score</div>
          <h2>Your CapturePass impact.</h2>
          <div className="status-list">
            <div className="status-row"><span>Current month</span><strong>{summary.monthlyScore}</strong></div>
            <div className="status-row"><span>All time</span><strong>{summary.taptaggScore}</strong></div>
          </div>
        </article>

        <article className="dashboard-card">
          <div className="dashboard-kicker">Streak</div>
          <h2>Consistency builds momentum.</h2>
          <div className="status-list">
            <div className="status-row"><span>Current streak</span><strong>{summary.currentStreak} days</strong></div>
            <div className="status-row"><span>Profile views</span><strong>{summary.profileViews}</strong></div>
            <div className="status-row"><span>QR scans</span><strong>{summary.qrScans}</strong></div>
          </div>
        </article>
      </div>

      <div className="dashboard-grid" style={{ marginTop: 24 }}>
        <article className="dashboard-card">
          <div className="dashboard-kicker">Activity</div>
          <h2>Profile signals.</h2>
          <div className="status-list">
            <div className="status-row"><span>vCard downloads</span><strong>{summary.vcardDownloads}</strong></div>
            <div className="status-row"><span>Phone clicks</span><strong>{summary.phoneClicks}</strong></div>
            <div className="status-row"><span>Email clicks</span><strong>{summary.emailClicks}</strong></div>
            <div className="status-row"><span>Website clicks</span><strong>{summary.websiteClicks}</strong></div>
            <div className="status-row"><span>Social clicks</span><strong>{summary.socialClicks}</strong></div>
            <div className="status-row"><span>Appointment actions</span><strong>{summary.appointmentActions}</strong></div>
          </div>
        </article>

        <article className="dashboard-card">
          <div className="dashboard-kicker">Badges</div>
          <h2>Recently earned and next up.</h2>
          <div className="status-list">
            {recentBadges.length ? recentBadges.map((badge) => (
              <div className="status-row" key={badge.id}>
                <span>{badge.badge_key.replace(/_/g, " ")}</span>
                <strong>Earned</strong>
              </div>
            )) : <p className="editor-copy">No badges yet. Start sharing to unlock your first one.</p>}
          </div>
          <div style={{ marginTop: 18 }}>
            {lockedBadges.map((definition) => {
              const progress = badgeProgress(summary, definition);
              return (
                <div key={definition.badge_key} style={{ marginBottom: 14 }}>
                  <div className="status-row">
                    <span>{definition.name}</span>
                    <strong>{progress.currentValue}/{progress.thresholdValue || "?"}</strong>
                  </div>
                  <div className="progress-bar"><span style={{ width: `${progress.percent}%` }} /></div>
                </div>
              );
            })}
          </div>
        </article>
      </div>
    </section>
  );
}

export function BusinessGamificationPanel({
  summary,
  organizationId
}: {
  summary: BusinessGamificationSummary;
  organizationId: string;
}) {
  return (
    <>
      <section className="dashboard-wrap" id="leaderboard">
        <div className="dashboard-card">
          <div className="dashboard-kicker">Leaderboard</div>
          <h2>Current month team standings.</h2>
          <div className="admin-table-frame business-member-table">
            <div className="admin-table-scroll">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Name</th>
                    <th>Contacts</th>
                    <th>Views</th>
                    <th>QR</th>
                    <th>Phone</th>
                    <th>Appointments</th>
                    <th>Sales</th>
                    <th>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.leaderboard.map((row) => (
                    <tr key={row.organization_member_id || row.user_id}>
                      <td>{row.rank}</td>
                      <td>{row.name}</td>
                      <td><strong>{row.contacts_captured}</strong></td>
                      <td>{row.profile_views}</td>
                      <td>{row.qr_scans}</td>
                      <td>{row.phone_clicks}</td>
                      <td>{row.appointment_clicks}</td>
                      <td>{row.sales_logged}</td>
                      <td>{row.taptagg_score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <section className="dashboard-wrap" id="challenges">
        <div className="dashboard-card">
          <div className="dashboard-kicker">Team challenges</div>
          <h2>Active goals.</h2>
          <div className="dashboard-grid">
            {summary.challengeProgress.length ? summary.challengeProgress.map((challenge) => (
              <article className="dashboard-card" key={challenge.challenge.id}>
                <div className="dashboard-kicker">{challenge.challenge.metric_key}</div>
                <h2>{challenge.challenge.title}</h2>
                <p className="editor-copy">{challenge.challenge.description || "Challenge progress is based on existing analytics and contact data."}</p>
                <div className="status-list">
                  <div className="status-row"><span>Progress</span><strong>{challenge.progress_value}/{challenge.goal_value}</strong></div>
                  <div className="status-row"><span>Days remaining</span><strong>{challenge.days_remaining}</strong></div>
                  <div className="status-row"><span>Prize</span><strong>{challenge.challenge.prize || "—"}</strong></div>
                </div>
                <div className="progress-bar"><span style={{ width: `${challenge.percent}%` }} /></div>
              </article>
            )) : <p className="editor-copy">No active team challenges yet.</p>}
          </div>
        </div>
      </section>

      <section className="dashboard-wrap" id="competitions">
        <div className="dashboard-card">
          <div className="dashboard-kicker">Competitions</div>
          <h2>Current and upcoming contests.</h2>
          <div className="status-list">
            {summary.competitions.length ? summary.competitions.map((competition) => (
              <div className="status-row" key={competition.id}>
                <span>{competition.title}</span>
                <strong>{competition.status || competition.metric_key.replace(/_/g, " ")}</strong>
              </div>
            )) : <p className="editor-copy">No competitions yet.</p>}
          </div>
        </div>
      </section>

      <section className="dashboard-wrap">
        <div className="dashboard-card">
          <BusinessGamificationManager
            organizationId={organizationId}
            challenges={summary.challenges}
            challengeProgress={summary.challengeProgress}
            competitions={summary.competitions}
          />
        </div>
      </section>

    </>
  );
}
