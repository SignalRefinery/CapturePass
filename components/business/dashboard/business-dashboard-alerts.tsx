import { businessErrorMessage } from "@/lib/business/dashboard-utils";

type BusinessDashboardAlertsProps = {
  error?: string;
  saved?: string;
};

const savedAlertMessages: Record<string, { kicker: string; message: string }> = {
  branding: {
    kicker: "Saved",
    message: "Business branding was saved."
  },
  digital_pass_sent: {
    kicker: "Sent",
    message: "Digital pass email was sent."
  },
  webhooks: {
    kicker: "Saved",
    message: "Webhook settings were saved."
  },
  webhook_secret: {
    kicker: "Updated",
    message: "Webhook secret was regenerated."
  },
  member_email: {
    kicker: "Updated",
    message: "Member email was updated."
  },
  member_profile: {
    kicker: "Updated",
    message: "Member profile details were updated."
  },
  location: {
    kicker: "Saved",
    message: "Location was saved."
  },
  location_deleted: {
    kicker: "Deleted",
    message: "Location was deleted."
  },
  region: {
    kicker: "Saved",
    message: "Region was saved."
  },
  business_type: {
    kicker: "Saved",
    message: "Business type was saved."
  }
};

export function BusinessDashboardAlerts({ error, saved }: BusinessDashboardAlertsProps) {
  const savedAlert = saved ? savedAlertMessages[saved] : null;

  return (
    <>
      {error ? (
        <DashboardAlert kicker="Action needed" message={businessErrorMessage(error)} />
      ) : null}
      {savedAlert ? (
        <DashboardAlert kicker={savedAlert.kicker} message={savedAlert.message} />
      ) : null}
    </>
  );
}

function DashboardAlert({ kicker, message }: { kicker: string; message: string }) {
  return (
    <section className="dashboard-wrap">
      <div className="dashboard-card pass-alert">
        <div className="dashboard-kicker">{kicker}</div>
        <p className="editor-copy">{message}</p>
      </div>
    </section>
  );
}
