import { redirect } from "next/navigation";
import Link from "next/link";
import { AnalyticsSummary } from "@/components/analytics/analytics-summary";
import { ContactTable } from "@/components/contacts/contact-table";
import { BusinessAddEmployeeSection } from "@/components/business/dashboard/business-add-employee-section";
import { BusinessAutomationsSection } from "@/components/business/dashboard/business-automations-section";
import { BusinessBrandingSection } from "@/components/business/dashboard/business-branding-section";
import { BusinessDashboardAlerts } from "@/components/business/dashboard/business-dashboard-alerts";
import { BusinessLocationsSection } from "@/components/business/dashboard/business-locations-section";
import { BusinessSettingsSection } from "@/components/business/dashboard/business-settings-section";
import { BusinessTeamSection } from "@/components/business/dashboard/business-team-section";
import { CopyLinkButton } from "@/components/business/copy-link-button";
import { BusinessGamificationPanel } from "@/components/gamification/gamification-panels";
import { ConfirmSubmitButton } from "@/components/shared/confirm-submit-button";
import { Shell } from "@/components/shared/shell";
import { getBusinessData, getBusinessIndex, getCurrentUser } from "@/lib/business/dashboard-data";
import {
  businessLoginPath,
  businessLoginUrl,
  isPlatformAdminMember
} from "@/lib/business/dashboard-utils";
import { businessPlanIncludesAdditionalLocations } from "@/lib/business/plans";
import { businessRoleLabel, normalizeBusinessRole } from "@/lib/business/roles";
import { getOrganizationGamificationSummary } from "@/lib/gamification/server";
import { getCurrentTapTaggAdmin } from "@/lib/auth/admin";
import {
  createOrganization,
  deleteEmployeeHeadshot,
  saveBusinessLocation,
  sendBusinessLoginInvite,
  updateEmployeeHeadshot,
  updateEmployeeProfile,
  updateEmployeeStatus
} from "./actions";

export default async function BusinessDashboardPage({
  searchParams
}: {
  searchParams?: Promise<{ error?: string; org?: string; onboard?: string; saved?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = searchParams ? await searchParams : {};
  const isPlatformAdmin = !!(await getCurrentTapTaggAdmin());
  const selectedOrganizationId = params?.org || null;
  const showOnboarding = isPlatformAdmin && params?.onboard === "1";
  const businessIndex = isPlatformAdmin ? await getBusinessIndex() : [];
  const {
    organization,
    viewerAccess,
    locations,
    members,
    tokens,
    contacts,
    analyticsEvents,
    webhookSettings,
    webhookDeliveries
  } = showOnboarding
    ? {
        organization: null,
        locations: [],
        members: [],
        tokens: [],
        contacts: [],
        analyticsEvents: [],
        webhookSettings: null,
        webhookDeliveries: []
      }
    : await getBusinessData(user.id, user.email, selectedOrganizationId, isPlatformAdmin);
  const gamificationSummary = organization
    ? await getOrganizationGamificationSummary({ organizationId: organization.id })
    : null;
  const initialAuth = {
    email: user.email || null,
    fullName: user.user_metadata?.full_name || null,
    slug: null,
    isAdmin: isPlatformAdmin
  };
  const businessNavLinks = [
    { href: "/", label: "Home" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/dashboard/business#leaderboard", label: "Leaderboard" },
    { href: "/dashboard/business#challenges", label: "Challenges" },
    { href: "/dashboard/business#competitions", label: "Competitions" }
  ];

  const normalizedViewerRole = normalizeBusinessRole(viewerAccess?.role || null);
  const isLocationScopedViewer = normalizedViewerRole === "location_admin" && !!viewerAccess?.locationId;
  const viewerLocation = isLocationScopedViewer
    ? locations.find((location) => location.id === viewerAccess.locationId) || null
    : null;
  const scopedMemberIds = new Set(
    isLocationScopedViewer ? members.filter((member) => member.location_id === viewerAccess.locationId).map((member) => member.id) : members.map((member) => member.id)
  );
  const scopedLocations = isLocationScopedViewer ? (viewerLocation ? [viewerLocation] : []) : locations;
  const scopedMembers = isLocationScopedViewer ? members.filter((member) => scopedMemberIds.has(member.id)) : members;
  const scopedActiveMembers = scopedMembers.filter((member) => member.status === "active" && !isPlatformAdminMember(member));
  const scopedContacts = isLocationScopedViewer
    ? contacts.filter(
        (contact) =>
          scopedMemberIds.has(contact.profile_id) || scopedMemberIds.has(contact.submitted_to_user_id || "")
      )
    : contacts;
  const scopedAnalyticsEvents = isLocationScopedViewer
    ? analyticsEvents.filter(
        (event) =>
          event.location_id === viewerLocation?.id ||
          (event.organization_member_id && scopedMemberIds.has(event.organization_member_id))
      )
    : analyticsEvents;
  if (isPlatformAdmin && !selectedOrganizationId && !showOnboarding) {
    return (
      <Shell footerLeft="Business dashboard" footerRight="CapturePass" initialAuth={initialAuth} navLinks={businessNavLinks} pageVariant="default">
        <section className="simple-hero">
          <div className="kicker">
            <span className="mini-star">✦</span>
            <span>Business operations</span>
          </div>
          <h1>Business accounts</h1>
          <p>Review every business, open its console, or onboard a new business account.</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 22 }}>
            <Link className="button primary" href="/dashboard/business?onboard=1">
              Onboard new business
            </Link>
            <Link className="button secondary" href="/admin">
              Admin users
            </Link>
          </div>
        </section>

        <section className="dashboard-wrap">
          <div className="dashboard-grid">
            {businessIndex.map(({ organization: org, memberCount, tokenCount, activeTokenCount, locationCount }) => (
              <article className="dashboard-card" key={org.id}>
                <div className="dashboard-kicker">Business account</div>
                <h2>{org.name}</h2>
                <p className="editor-copy">
                  {memberCount} member{memberCount === 1 ? "" : "s"} · {locationCount} location{locationCount === 1 ? "" : "s"} · {activeTokenCount}/{tokenCount} active token{tokenCount === 1 ? "" : "s"}
                </p>
                <p className="editor-copy" style={{ wordBreak: "break-all" }}>
                  {org.slug ? businessLoginUrl(org.slug) : "No business slug yet"}
                </p>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Link className="button primary" href={`/dashboard/business?org=${org.id}`}>
                    Manage business
                  </Link>
                  {org.slug ? (
                    <>
                      <Link className="button secondary" href={businessLoginPath(org.slug)}>
                        Login page
                      </Link>
                      <CopyLinkButton value={businessLoginUrl(org.slug)} />
                    </>
                  ) : null}
                </div>
              </article>
            ))}
          </div>

          {businessIndex.length === 0 ? (
            <div className="dashboard-card">
              <div className="dashboard-kicker">No businesses yet</div>
              <h2>Onboard the first business.</h2>
              <Link className="button primary" href="/dashboard/business?onboard=1">
                Onboard new business
              </Link>
            </div>
          ) : null}
        </section>
      </Shell>
    );
  }

  if (!organization) {
    return (
      <Shell footerLeft="Business dashboard" footerRight="CapturePass" initialAuth={initialAuth} navLinks={businessNavLinks} pageVariant="default">
        <section className="simple-hero">
          <div className="dashboard-card" style={{ maxWidth: 780, margin: "0 auto" }}>
            {isPlatformAdmin ? (
              <>
                <div className="dashboard-kicker">Business setup</div>
                <h1>Create your company account.</h1>
                <p>
                  Business CapturePass uses permanent card/pass URLs that can be reassigned as your team changes.
                  The business admin receives an email invite to set their own password.
                </p>
                <form action={createOrganization} className="editor-form" style={{ marginTop: 24 }}>
                  <label className="editor-label">
                    Company name
                    <input className="editor-input" name="name" required />
                  </label>
                  <div className="editor-grid">
                    <label className="editor-label">
                      Business admin name
                      <input className="editor-input" name="admin_name" required />
                    </label>
                    <label className="editor-label">
                      Business admin title
                      <input className="editor-input" name="admin_title" placeholder="Owner, manager, office admin..." />
                    </label>
                  </div>
                  <div className="editor-grid">
                    <label className="editor-label">
                      Business admin email for login invite
                      <input className="editor-input" name="admin_email" type="email" />
                    </label>
                    <label className="editor-label">
                      Business admin phone
                      <input className="editor-input" name="admin_phone" type="tel" />
                    </label>
                  </div>
                  <label className="editor-label">
                    Promo code
                    <input
                      className="editor-input"
                      name="promo_code"
                      placeholder="Optional: Enter promo code if you have one"
                    />
                  </label>
                  <label className="editor-label">
                    Business plan
                    <select className="editor-input" name="business_plan_key" defaultValue="business_starter_self">
                      <option value="business_starter_self">Business Starter - $199/mo or $2,149/yr self-managed, 10 seats, $149 setup</option>
                      <option value="business_starter_managed">Business Starter Managed - $299/mo or $3,229/yr, 10 seats, $149 setup</option>
                      <option value="business_growth_self">Business Growth - $399/mo or $4,309/yr self-managed, 25 seats, $299 setup</option>
                      <option value="business_growth_managed">Business Growth Managed - $599/mo or $6,469/yr, 25 seats, $299 setup</option>
                      <option value="business_pro_self">Business Pro - $699/mo or $7,549/yr self-managed, 50 seats, $499 setup</option>
                      <option value="business_pro_managed">Business Pro Managed - $999/mo or $10,789/yr, 50 seats, $499 setup</option>
                    </select>
                  </label>
                  <label className="editor-label">
                    Billing interval
                    <select className="editor-input" name="business_billing_interval" defaultValue="monthly">
                      <option value="monthly">Monthly</option>
                      <option value="annual">Annual - save 10%</option>
                    </select>
                  </label>
                  <details className="employee-manage-panel setup-location-toggle" style={{ marginTop: 8 }}>
                    <summary className="button secondary setup-toggle-button">Unlock first location</summary>
                    <div className="employee-manage-panel-inner" style={{ marginTop: 12 }}>
                      <div className="dashboard-kicker">First location</div>
                      <h2 style={{ fontSize: "clamp(24px, 3vw, 32px)", marginTop: 10 }}>Optional, but ready if you need it.</h2>
                      <p className="editor-copy">
                        Add the first office, rooftop, or market location now so the business starts with a place to assign employees.
                      </p>
                      <div className="editor-grid" style={{ marginTop: 14 }}>
                        <label className="editor-label">
                          Location name
                          <input className="editor-input" name="location_name" placeholder="Springfield Office" />
                        </label>
                        <label className="editor-label">
                          Slug
                          <input className="editor-input" name="location_slug" placeholder="springfield-office" />
                        </label>
                      </div>
                      <div className="editor-grid">
                        <label className="editor-label">
                          Address
                          <input className="editor-input" name="location_address" placeholder="123 Main St" />
                        </label>
                        <label className="editor-label">
                          City
                          <input className="editor-input" name="location_city" placeholder="Springfield" />
                        </label>
                      </div>
                      <div className="editor-grid">
                        <label className="editor-label">
                          State
                          <input className="editor-input" name="location_state" placeholder="IL" maxLength={2} />
                        </label>
                        <label className="editor-label">
                          Phone
                          <input className="editor-input" name="location_phone" type="tel" placeholder="(555) 555-5555" />
                        </label>
                      </div>
                    </div>
                  </details>
                  <button className="button primary setup-submit-button" type="submit">
                    Create account and send invite
                  </button>
                  <Link className="button secondary" href="/dashboard/business">
                    Back to business accounts
                  </Link>
                </form>
              </>
            ) : (
              <>
                <div className="dashboard-kicker">Business quote</div>
                <h1>Business accounts are created by CapturePass.</h1>
                <p>
                  Business CapturePass is currently quote-based. Request a business quote and we will set up
                  the company console, admin login, employees, branding, and card/pass tokens.
                </p>
                <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 24 }}>
                  <Link className="button primary" href="/business#business-request">
                    Request business quote
                  </Link>
                  <Link className="button secondary" href="/dashboard/business">
                    Refresh business access
                  </Link>
                </div>
              </>
            )}
          </div>
        </section>
      </Shell>
    );
  }

  const dashboardFooterLeft = isLocationScopedViewer ? "Location dashboard" : "Business dashboard";
  const showLocationControls = organization
    ? businessPlanIncludesAdditionalLocations(organization.business_plan_key)
    : false;
  const locationEmployeeCount = scopedMembers.length;
  const locationActiveCount = scopedActiveMembers.length;
  const locationContactCount = scopedContacts.length;
  const locationActivityCount = scopedAnalyticsEvents.length;

  if (isLocationScopedViewer) {
    return (
      <Shell footerLeft={dashboardFooterLeft} footerRight="CapturePass" initialAuth={initialAuth} navLinks={businessNavLinks} pageVariant="default">
        <section className="simple-hero location-hero">
          <div className="kicker">
            <span className="mini-star">✦</span>
            <span>Location admin</span>
          </div>
          <h1>{viewerLocation?.name || "Your assigned location"}</h1>
          <p>
            Manage this location&apos;s details, assigned employees, and local activity for {organization.name}.
          </p>
          <div className="location-hero-panel">
            <div className="location-hero-panel-copy">
              <div className="dashboard-kicker">Local workspace</div>
              <h2>{viewerLocation?.name || "Unassigned location"}</h2>
              <p>
                This view only includes the employees, contacts, and activity for this location. Business-wide settings stay in the parent business dashboard.
              </p>
              <div className="location-hero-tag-row">
                {viewerLocation?.address || viewerLocation?.city || viewerLocation?.state ? (
                  <span className="button secondary" aria-disabled="true">
                    {[viewerLocation.address, viewerLocation.city, viewerLocation.state].filter(Boolean).join(", ")}
                  </span>
                ) : null}
              </div>
            </div>
            <div className="location-hero-stats" aria-label="Location summary">
              <div className="location-hero-stat">
                <span>Employees</span>
                <strong>{locationEmployeeCount}</strong>
              </div>
              <div className="location-hero-stat">
                <span>Active</span>
                <strong>{locationActiveCount}</strong>
              </div>
              <div className="location-hero-stat">
                <span>Contacts</span>
                <strong>{locationContactCount}</strong>
              </div>
              <div className="location-hero-stat">
                <span>Events</span>
                <strong>{locationActivityCount}</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="dashboard-wrap">
          <div className="dashboard-card">
            <div className="dashboard-kicker">Location details</div>
            <h2>Edit this location.</h2>
            {viewerLocation ? (
              <>
                <p className="editor-copy">
                  {viewerLocation.address || viewerLocation.city || viewerLocation.state
                    ? [viewerLocation.address, viewerLocation.city, viewerLocation.state].filter(Boolean).join(", ")
                    : "No address has been added yet."}
                </p>
                <form action={saveBusinessLocation} className="editor-form" style={{ marginTop: 18 }}>
                  <input type="hidden" name="organization_id" value={organization.id} />
                  <input type="hidden" name="location_id" value={viewerLocation.id} />
                  <label className="editor-label">
                    Location name
                    <input className="editor-input" name="name" defaultValue={viewerLocation.name} required />
                  </label>
                  <div className="editor-grid">
                    <label className="editor-label">
                      Slug
                      <input className="editor-input" name="slug" defaultValue={viewerLocation.slug || ""} />
                    </label>
                    <label className="editor-label">
                      Phone
                      <input className="editor-input" name="phone" defaultValue={viewerLocation.phone || ""} />
                    </label>
                  </div>
                  <div className="editor-grid">
                    <label className="editor-label">
                      Address
                      <input className="editor-input" name="address" defaultValue={viewerLocation.address || ""} />
                    </label>
                    <label className="editor-label">
                      City
                      <input className="editor-input" name="city" defaultValue={viewerLocation.city || ""} />
                    </label>
                  </div>
                  <div className="editor-grid">
                    <label className="editor-label">
                      State
                      <input className="editor-input" name="state" defaultValue={viewerLocation.state || ""} maxLength={2} />
                    </label>
                  </div>
                  <button className="button primary" type="submit">
                    Save location
                  </button>
                </form>
              </>
            ) : (
              <p className="editor-copy">No location has been assigned to your account yet.</p>
            )}
          </div>
        </section>

        <section className="dashboard-wrap">
          <div className="dashboard-card">
            <div className="dashboard-kicker">Location employees</div>
            <h2>Manage your local team.</h2>
            <p className="editor-copy">
              Update profile details, email, and active status for employees assigned to this location.
            </p>
            <div className="admin-table-frame business-member-table">
              <div className="admin-table-scroll">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Role / title</th>
                      <th>Email</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scopedMembers.map((member) => {
                      const lockedPlatformAdmin = isPlatformAdminMember(member);
                      return (
                        <tr key={member.id}>
                          <td>
                            <strong>{member.name}</strong>
                          </td>
                          <td>
                            {lockedPlatformAdmin ? (
                              <div>
                                <strong>Platform admin</strong>
                                <div className="table-subtext">Locked CapturePass support access</div>
                              </div>
                            ) : (
                              <div>
                                <strong>{businessRoleLabel(member.role)}</strong>
                                {member.title ? <div className="table-subtext">{member.title}</div> : null}
                              </div>
                            )}
                          </td>
                          <td>{member.email || "—"}</td>
                          <td>
                            <span className="status-pill">{member.status}</span>
                          </td>
                          <td>
                            <div className="table-actions">
                              {lockedPlatformAdmin ? (
                                <span className="editor-copy">Locked platform admin access.</span>
                              ) : (
                                <details className="employee-manage-panel">
                                  <summary className="button secondary">Manage</summary>
                                  <div className="employee-manage-panel-inner">
                                    <div className="dashboard-kicker">Headshot</div>
                                    {member.headshot_url ? (
                                      <div className="employee-headshot-preview">
                                        {/* eslint-disable-next-line @next/next/no-img-element -- employee headshots are storage-backed runtime uploads. */}
                                        <img src={member.headshot_url} alt={`${member.name} headshot`} />
                                      </div>
                                    ) : (
                                      <p className="table-subtext">No headshot uploaded.</p>
                                    )}
                                    <form action={updateEmployeeHeadshot} className="table-actions" encType="multipart/form-data">
                                      <input type="hidden" name="organization_id" value={organization.id} />
                                      <input type="hidden" name="member_id" value={member.id} />
                                      <input
                                        className="editor-input"
                                        name="headshot_file"
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        required
                                      />
                                      <button className="button secondary" type="submit">
                                        {member.headshot_url ? "Change headshot" : "Upload headshot"}
                                      </button>
                                    </form>
                                    {member.headshot_url ? (
                                      <form action={deleteEmployeeHeadshot}>
                                        <input type="hidden" name="organization_id" value={organization.id} />
                                        <input type="hidden" name="member_id" value={member.id} />
                                        <ConfirmSubmitButton
                                          className="button secondary"
                                          confirmMessage={`Delete ${member.name}'s headshot?`}
                                        >
                                          Delete headshot
                                        </ConfirmSubmitButton>
                                      </form>
                                    ) : null}

                                    <div className="dashboard-kicker">Profile details</div>
                                    <form action={updateEmployeeProfile} className="table-actions">
                                      <input type="hidden" name="organization_id" value={organization.id} />
                                      <input type="hidden" name="member_id" value={member.id} />
                                      <input
                                        className="editor-input"
                                        name="name"
                                        defaultValue={member.name || ""}
                                        placeholder="Employee name"
                                        autoComplete="name"
                                        required
                                      />
                                      <input
                                        className="editor-input"
                                        name="phone"
                                        type="tel"
                                        defaultValue={member.phone || ""}
                                        placeholder="(555) 555-5555"
                                        autoComplete="tel"
                                      />
                                      <input
                                        className="editor-input"
                                        name="email"
                                        type="email"
                                        defaultValue={member.email || ""}
                                        placeholder="name@example.com"
                                        autoComplete="email"
                                      />
                                      <button className="button secondary" type="submit">Save profile</button>
                                    </form>
                                    <p className="table-subtext">
                                      Updates this location employee&apos;s public business profile. Email changes also update login access and send a fresh setup invite.
                                    </p>

                                    {member.status === "active" && member.email ? (
                                      <form action={sendBusinessLoginInvite}>
                                        <input type="hidden" name="organization_id" value={organization.id} />
                                        <input type="hidden" name="member_id" value={member.id} />
                                        <button className="button secondary" type="submit">Send invite</button>
                                      </form>
                                    ) : null}

                                    <div className="dashboard-kicker">Status</div>
                                    {member.status === "active" ? (
                                      <form action={updateEmployeeStatus}>
                                        <input type="hidden" name="organization_id" value={organization.id} />
                                        <input type="hidden" name="member_id" value={member.id} />
                                        <input type="hidden" name="status" value="inactive" />
                                        <ConfirmSubmitButton
                                          className="button secondary"
                                          confirmMessage={`Archive ${member.name}?`}
                                        >
                                          Archive
                                        </ConfirmSubmitButton>
                                      </form>
                                    ) : (
                                      <form action={updateEmployeeStatus}>
                                        <input type="hidden" name="organization_id" value={organization.id} />
                                        <input type="hidden" name="member_id" value={member.id} />
                                        <input type="hidden" name="status" value="active" />
                                        <button className="button secondary" type="submit">Restore</button>
                                      </form>
                                    )}
                                  </div>
                                </details>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        <ContactTable contacts={scopedContacts} members={scopedMembers} showMemberFilter />
        <AnalyticsSummary
          events={scopedAnalyticsEvents}
          contacts={scopedContacts}
          members={scopedMembers}
          business
          scopeLabel="Location"
        />
      </Shell>
    );
  }

  return (
    <Shell footerLeft="Business dashboard" footerRight="CapturePass" initialAuth={initialAuth} navLinks={businessNavLinks} pageVariant="default">
      <section className="simple-hero">
        <div className="kicker">
          <span className="mini-star">✦</span>
          <span>Business dashboard</span>
        </div>
        <h1>{organization.name}</h1>
        <p>
          Manage employees, permanent card/pass tokens, and phone-first digital sharing for your team.
        </p>
        {isPlatformAdmin ? (
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 22 }}>
            <Link className="button secondary" href="/dashboard/business">
              All businesses
            </Link>
            <Link className="button primary" href="/dashboard/business?onboard=1">
              Onboard new business
            </Link>
          </div>
        ) : null}
      </section>

      <BusinessDashboardAlerts error={params?.error} saved={params?.saved} />

      <BusinessSettingsSection organization={organization} />

      {showLocationControls ? (
        <BusinessLocationsSection organization={organization} locations={locations} members={members} />
      ) : null}

      <BusinessTeamSection
        organization={organization}
        members={members}
        locations={locations}
        tokens={tokens}
        showLocationControls={showLocationControls}
      />

      <BusinessAutomationsSection
        organizationId={organization.id}
        webhookSettings={webhookSettings}
        webhookDeliveries={webhookDeliveries}
      />

      <BusinessAddEmployeeSection organizationId={organization.id} />

      <section className="dashboard-wrap" id="business-contacts">
        <ContactTable contacts={contacts} members={members} showMemberFilter />
      </section>

      <AnalyticsSummary events={analyticsEvents} contacts={contacts} members={members} business />

      {gamificationSummary ? <BusinessGamificationPanel summary={gamificationSummary} organizationId={organization.id} /> : null}

      <section className="dashboard-wrap">
        <div className="dashboard-grid">
          {organization.slug ? (
            <div className="dashboard-card">
              <div className="dashboard-kicker">Business login</div>
              <h2>Team login link.</h2>
              <p className="editor-copy" style={{ wordBreak: "break-all" }}>
                {businessLoginUrl(organization.slug)}
              </p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Link className="button secondary" href={businessLoginPath(organization.slug)}>
                  Open business login
                </Link>
                <CopyLinkButton value={businessLoginUrl(organization.slug)} />
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <BusinessBrandingSection organization={organization} />
    </Shell>
  );
}
