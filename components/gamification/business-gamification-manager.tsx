"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { ChallengeProgress, Competition, TeamChallenge } from "@/lib/types";

const CHALLENGE_METRICS = [
  ["contacts_captured", "Contacts captured"],
  ["profile_views", "Profile views"],
  ["qr_scans", "QR scans"],
  ["taptagg_score", "TapTagg score"],
  ["appointment_actions", "Appointment actions"],
  ["sales_logged", "Sales logged"],
  ["revenue_logged", "Revenue logged"]
];

const COMPETITION_METRICS = [
  ["taptagg_score", "TapTagg score"],
  ["contacts_captured", "Contacts captured"],
  ["profile_views", "Profile views"],
  ["qr_scans", "QR scans"],
  ["sales_logged", "Sales logged"],
  ["revenue_logged", "Revenue logged"]
];

type ManagerProps = {
  organizationId: string;
  challenges: TeamChallenge[];
  challengeProgress: ChallengeProgress[];
  competitions: Competition[];
};

function formPayload(form: HTMLFormElement) {
  return Object.fromEntries(new FormData(form).entries());
}

async function requestJson(path: string, options: RequestInit) {
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || "Request failed.");
  }
  return payload;
}

function dateValue(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}

export function BusinessGamificationManager({ organizationId, challenges, challengeProgress, competitions }: ManagerProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const challengeProgressById = new Map(challengeProgress.map((progress) => [progress.challenge.id, progress]));

  function run(action: () => Promise<void>) {
    setMessage(null);
    startTransition(async () => {
      try {
        await action();
        router.refresh();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Something went wrong.");
      }
    });
  }

  return (
    <div className="gamification-manager">
      {message ? <p className="editor-copy">{message}</p> : null}

      <section className="gamification-manager-section">
        <div className="dashboard-kicker">Challenge controls</div>
        <form
          className="editor-form"
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget;
            run(async () => {
              await requestJson("/api/gamification/challenges", {
                method: "POST",
                body: JSON.stringify({ ...formPayload(form), organization_id: organizationId })
              });
              form.reset();
              setMessage("Challenge created.");
            });
          }}
        >
          <div className="editor-grid">
            <label className="editor-label">
              Title
              <input className="editor-input" name="title" placeholder="June Contact Sprint" required />
            </label>
            <label className="editor-label">
              Metric
              <select className="editor-input" name="metric_key" defaultValue="contacts_captured">
                {CHALLENGE_METRICS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
          </div>
          <div className="editor-grid">
            <label className="editor-label">
              Goal
              <input className="editor-input" name="goal_value" type="number" min={1} defaultValue={100} required />
            </label>
            <label className="editor-label">
              Prize
              <input className="editor-input" name="prize" placeholder="Lunch, bonus, gift card..." />
            </label>
          </div>
          <div className="editor-grid">
            <label className="editor-label">
              Start date
              <input className="editor-input" name="start_date" type="date" required />
            </label>
            <label className="editor-label">
              End date
              <input className="editor-input" name="end_date" type="date" required />
            </label>
          </div>
          <label className="editor-label">
            Description
            <textarea className="editor-input" name="description" rows={3} />
          </label>
          <button className="button primary" type="submit" disabled={isPending}>Create challenge</button>
        </form>

        <div className="gamification-manage-list">
          {challenges.map((challenge) => {
            const progress = challengeProgressById.get(challenge.id);
            return (
              <form
                className="editor-form gamification-manage-item"
                key={challenge.id}
                onSubmit={(event) => {
                  event.preventDefault();
                  const form = event.currentTarget;
                  run(async () => {
                    await requestJson(`/api/gamification/challenges/${challenge.id}`, {
                      method: "PATCH",
                      body: JSON.stringify(formPayload(form))
                    });
                    setMessage("Challenge updated.");
                  });
                }}
              >
                <div className="dashboard-kicker">{challenge.status || "active"}</div>
                <div className="editor-grid">
                  <label className="editor-label">
                    Title
                    <input className="editor-input" name="title" defaultValue={challenge.title} required />
                  </label>
                  <label className="editor-label">
                    Metric
                    <select className="editor-input" name="metric_key" defaultValue={challenge.metric_key}>
                      {CHALLENGE_METRICS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  </label>
                </div>
                <div className="editor-grid">
                  <label className="editor-label">
                    Goal
                    <input className="editor-input" name="goal_value" type="number" min={1} defaultValue={challenge.goal_value} required />
                  </label>
                  <label className="editor-label">
                    Status
                    <select className="editor-input" name="status" defaultValue={challenge.status || "active"}>
                      <option value="active">Active</option>
                      <option value="paused">Paused</option>
                      <option value="completed">Completed</option>
                      <option value="expired">Expired</option>
                    </select>
                  </label>
                </div>
                <div className="editor-grid">
                  <label className="editor-label">
                    Start date
                    <input className="editor-input" name="start_date" type="date" defaultValue={dateValue(challenge.start_date)} required />
                  </label>
                  <label className="editor-label">
                    End date
                    <input className="editor-input" name="end_date" type="date" defaultValue={dateValue(challenge.end_date)} required />
                  </label>
                </div>
                <label className="editor-label">
                  Prize
                  <input className="editor-input" name="prize" defaultValue={challenge.prize || ""} />
                </label>
                <label className="editor-label">
                  Description
                  <textarea className="editor-input" name="description" rows={3} defaultValue={challenge.description || ""} />
                </label>
                {progress ? <p className="editor-copy">Current snapshot: {progress.progress_value}/{progress.goal_value}</p> : null}
                <div className="table-actions">
                  <button className="button secondary" type="submit" disabled={isPending}>Save</button>
                  <button
                    className="button secondary"
                    type="button"
                    disabled={isPending}
                    onClick={() => {
                      if (!window.confirm(`Delete challenge "${challenge.title}"?`)) return;
                      run(async () => {
                        await requestJson(`/api/gamification/challenges/${challenge.id}`, { method: "DELETE" });
                        setMessage("Challenge deleted.");
                      });
                    }}
                  >
                    Delete
                  </button>
                </div>
              </form>
            );
          })}
        </div>
      </section>

      <section className="gamification-manager-section">
        <div className="dashboard-kicker">Competition controls</div>
        <form
          className="editor-form"
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget;
            run(async () => {
              await requestJson("/api/gamification/competitions", {
                method: "POST",
                body: JSON.stringify({ ...formPayload(form), organization_id: organizationId })
              });
              form.reset();
              setMessage("Competition created.");
            });
          }}
        >
          <div className="editor-grid">
            <label className="editor-label">
              Title
              <input className="editor-input" name="title" placeholder="Salesperson of the Month" required />
            </label>
            <label className="editor-label">
              Metric
              <select className="editor-input" name="metric_key" defaultValue="taptagg_score">
                {COMPETITION_METRICS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
          </div>
          <div className="editor-grid">
            <label className="editor-label">
              Start date
              <input className="editor-input" name="start_date" type="date" required />
            </label>
            <label className="editor-label">
              End date
              <input className="editor-input" name="end_date" type="date" required />
            </label>
          </div>
          <label className="editor-label">
            Prize
            <input className="editor-input" name="prize" placeholder="Bonus, trip, gift card..." />
          </label>
          <button className="button primary" type="submit" disabled={isPending}>Create competition</button>
        </form>

        <div className="gamification-manage-list">
          {competitions.map((competition) => {
            const finalized = competition.status === "completed" || competition.status === "expired";
            return (
              <form
                className="editor-form gamification-manage-item"
                key={competition.id}
                onSubmit={(event) => {
                  event.preventDefault();
                  const form = event.currentTarget;
                  run(async () => {
                    await requestJson(`/api/gamification/competitions/${competition.id}`, {
                      method: "PATCH",
                      body: JSON.stringify(formPayload(form))
                    });
                    setMessage("Competition updated.");
                  });
                }}
              >
                <div className="dashboard-kicker">{competition.status || "active"}</div>
                <div className="editor-grid">
                  <label className="editor-label">
                    Title
                    <input className="editor-input" name="title" defaultValue={competition.title} required disabled={finalized} />
                  </label>
                  <label className="editor-label">
                    Metric
                    <select className="editor-input" name="metric_key" defaultValue={competition.metric_key} disabled={finalized}>
                      {COMPETITION_METRICS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  </label>
                </div>
                <div className="editor-grid">
                  <label className="editor-label">
                    Start date
                    <input className="editor-input" name="start_date" type="date" defaultValue={dateValue(competition.start_date)} required disabled={finalized} />
                  </label>
                  <label className="editor-label">
                    End date
                    <input className="editor-input" name="end_date" type="date" defaultValue={dateValue(competition.end_date)} required disabled={finalized} />
                  </label>
                </div>
                <div className="editor-grid">
                  <label className="editor-label">
                    Prize
                    <input className="editor-input" name="prize" defaultValue={competition.prize || ""} disabled={finalized} />
                  </label>
                  <label className="editor-label">
                    Status
                    <select className="editor-input" name="status" defaultValue={competition.status || "active"} disabled={finalized}>
                      <option value="active">Active</option>
                      <option value="paused">Paused</option>
                    </select>
                  </label>
                </div>
                <div className="table-actions">
                  <button className="button secondary" type="submit" disabled={isPending || finalized}>Save</button>
                  <button
                    className="button secondary"
                    type="button"
                    disabled={isPending || finalized}
                    onClick={() => {
                      if (!window.confirm(`Delete competition "${competition.title}"?`)) return;
                      run(async () => {
                        await requestJson(`/api/gamification/competitions/${competition.id}`, { method: "DELETE" });
                        setMessage("Competition deleted.");
                      });
                    }}
                  >
                    Delete
                  </button>
                  {finalized ? (
                    <button
                      className="button secondary"
                      type="button"
                      disabled={isPending}
                      onClick={() => {
                        if (!window.confirm(`Recalculate finalized results for "${competition.title}"?`)) return;
                        run(async () => {
                          await requestJson(`/api/gamification/competitions/${competition.id}/recalculate`, { method: "POST" });
                          setMessage("Competition results recalculated.");
                        });
                      }}
                    >
                      Recalculate results
                    </button>
                  ) : null}
                </div>
              </form>
            );
          })}
        </div>
      </section>
    </div>
  );
}
