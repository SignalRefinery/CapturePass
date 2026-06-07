import { redirect } from "next/navigation";
import Link from "next/link";
import { AnalyticsSummary } from "@/components/analytics/analytics-summary";
import { ContactTable } from "@/components/contacts/contact-table";
import { BusinessBrandThemeFields } from "@/components/business/business-brand-theme-fields";
import { BusinessDashboardAlerts } from "@/components/business/dashboard/business-dashboard-alerts";
import { CopyLinkButton } from "@/components/business/copy-link-button";
import { WebhookTestButton } from "@/components/business/webhook-test-button";
import { BusinessGamificationPanel } from "@/components/gamification/gamification-panels";
import { ConfirmSubmitButton } from "@/components/shared/confirm-submit-button";
import { Shell } from "@/components/shared/shell";
import { BUSINESS_HEADSHOT_MAX_BYTES, BUSINESS_LOGO_MAX_BYTES } from "@/lib/business/assets";
import { BUSINESS_TYPE_DESCRIPTIONS, BUSINESS_TYPE_LABELS, BUSINESS_TYPES, normalizeBusinessType } from "@/lib/business-types";
import { getBusinessData, getBusinessIndex, getCurrentUser } from "@/lib/business/dashboard-data";
import {
  businessLocationUrl,
  businessLoginPath,
  businessLoginUrl,
  digitalPassUrl,
  isPlatformAdminMember,
  passVcardUrl,
  tokenUrl
} from "@/lib/business/dashboard-utils";
import { businessRoleLabel, normalizeBusinessRole } from "@/lib/business/roles";
import { getOrganizationGamificationSummary } from "@/lib/gamification/server";
import { getCurrentTapTaggAdmin } from "@/lib/auth/admin";
import type { OrganizationRecord } from "@/lib/types";
import {
  addEmployee,
  createOrganization,
  deactivateToken,
  deleteBusinessLocation,
  deleteBusinessLogo,
  deleteEmployee,
  deleteEmployeeHeadshot,
  issueToken,
  regenerateOrganizationWebhookSecret,
  saveBusinessLocation,
  saveBusinessRegion,
  saveOrganizationWebhooks,
  sendBusinessDigitalPass,
  sendBusinessLoginInvite,
  updateEmployeeEmail,
  updateEmployeeHeadshot,
  updateEmployeeLocation,
  updateEmployeeRole,
  updateEmployeeStatus,
  updateOrganizationBranding,
  updateOrganizationBusinessType,
  updateTokenAssignment
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
    regions,
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
        regions: [],
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
  const scopedRegions = isLocationScopedViewer
    ? regions.filter((region) => scopedLocations.some((location) => location.region_id === region.id))
    : regions;
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
  const scopedTokens = isLocationScopedViewer
    ? tokens.filter((token) => token.assigned_member_id && scopedMemberIds.has(token.assigned_member_id))
    : tokens;
  const canManageBusinessWide = !isLocationScopedViewer;

  if (isPlatformAdmin && !selectedOrganizationId && !showOnboarding) {
    return (
      <Shell footerLeft="Business dashboard" footerRight="TapTagg" initialAuth={initialAuth} navLinks={businessNavLinks}>
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
      <Shell footerLeft="Business dashboard" footerRight="TapTagg" initialAuth={initialAuth} navLinks={businessNavLinks}>
        <section className="simple-hero">
          <div className="dashboard-card" style={{ maxWidth: 780, margin: "0 auto" }}>
            {isPlatformAdmin ? (
              <>
                <div className="dashboard-kicker">Business setup</div>
                <h1>Create your company account.</h1>
                <p>
                  Business TapTagg uses permanent card/pass URLs that can be reassigned as your team changes.
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
                      placeholder="Optional, use FOUNDERS for a demo-ready business"
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
                <h1>Business accounts are created by TapTagg.</h1>
                <p>
                  Business TapTagg is currently quote-based. Request a business quote and we will set up
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

  const activeMembers = scopedActiveMembers;
  const memberById = new Map(scopedMembers.map((member) => [member.id, member]));
  const locationById = new Map(scopedLocations.map((location) => [location.id, location]));
  const regionById = new Map(scopedRegions.map((region) => [region.id, region]));
  const viewerLocationRegion = viewerLocation?.region_id ? regionById.get(viewerLocation.region_id) || null : null;
  const unassignedTokens = canManageBusinessWide
    ? scopedTokens.filter((token) => !token.assigned_member_id || !memberById.has(token.assigned_member_id))
    : [];
  const dashboardFooterLeft = isLocationScopedViewer ? "Location dashboard" : "Business dashboard";
  const locationEmployeeCount = scopedMembers.length;
  const locationActiveCount = scopedActiveMembers.length;
  const locationContactCount = scopedContacts.length;
  const locationActivityCount = scopedAnalyticsEvents.length;

  if (isLocationScopedViewer) {
    return (
      <Shell footerLeft={dashboardFooterLeft} footerRight="TapTagg" initialAuth={initialAuth} navLinks={businessNavLinks}>
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
                <span className="button secondary" aria-disabled="true">
                  {viewerLocationRegion?.name || "No region assigned"}
                </span>
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
                    <label className="editor-label">
                      Region
                      <input className="editor-input" value={viewerLocationRegion?.name || "No region assigned"} readOnly />
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
                                <div className="table-subtext">Locked TapTagg support access</div>
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
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
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

                                    <div className="dashboard-kicker">Email</div>
                                    <form action={updateEmployeeEmail} className="table-actions">
                                      <input type="hidden" name="organization_id" value={organization.id} />
                                      <input type="hidden" name="member_id" value={member.id} />
                                      <input
                                        className="editor-input"
                                        name="email"
                                        type="email"
                                        defaultValue={member.email || ""}
                                        placeholder="name@example.com"
                                        autoComplete="email"
                                      />
                                      <button className="button secondary" type="submit">Save email</button>
                                    </form>

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
    <Shell footerLeft="Business dashboard" footerRight="TapTagg" initialAuth={initialAuth} navLinks={businessNavLinks}>
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

      <section className="dashboard-wrap" id="business-settings">
        <div className="dashboard-card">
          <div className="dashboard-kicker">Business settings</div>
          <h2>Choose the business type.</h2>
          <p className="editor-copy">
            This is a broad category for future vertical-specific features. It does not change any profile, lead form, or analytics behavior yet.
          </p>
          <form action={updateOrganizationBusinessType} className="editor-form" style={{ marginTop: 18 }}>
            <input type="hidden" name="organization_id" value={organization.id} />
            <label className="editor-label">
              Business type
              <select className="editor-input" name="business_type" defaultValue={normalizeBusinessType(organization.business_type)}>
                {BUSINESS_TYPES.map((businessType) => (
                  <option key={businessType} value={businessType}>
                    {BUSINESS_TYPE_LABELS[businessType]}
                  </option>
                ))}
              </select>
            </label>
            <p className="table-subtext">
              {BUSINESS_TYPE_DESCRIPTIONS[normalizeBusinessType(organization.business_type)]}
            </p>
            <button className="button primary" type="submit">
              Save business type
            </button>
          </form>
        </div>
      </section>

      <section className="dashboard-wrap" id="business-locations">
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <div className="dashboard-kicker">Locations</div>
            <h2>Keep every office, rooftop, or market location organized.</h2>
            <p className="editor-copy">
              Locations are optional at first, so businesses with no offices continue to work exactly as they do today.
            </p>

            <form action={saveBusinessLocation} className="editor-form" style={{ marginTop: 18 }}>
              <input type="hidden" name="organization_id" value={organization.id} />
              <label className="editor-label">
                Location name
                <input className="editor-input" name="name" placeholder="Springfield Office" required />
              </label>
              <div className="editor-grid">
                <label className="editor-label">
                  Slug
                  <input className="editor-input" name="slug" placeholder="springfield-office" />
                </label>
                <label className="editor-label">
                  Phone
                  <input className="editor-input" name="phone" placeholder="(555) 555-5555" />
                </label>
              </div>
              <div className="editor-grid">
                <label className="editor-label">
                  Address
                  <input className="editor-input" name="address" placeholder="123 Main St" />
                </label>
                <label className="editor-label">
                  City
                  <input className="editor-input" name="city" placeholder="Springfield" />
                </label>
              </div>
              <div className="editor-grid">
                <label className="editor-label">
                  State
                  <input className="editor-input" name="state" placeholder="IL" maxLength={2} />
                </label>
                <label className="editor-label">
                  Region
                  <select className="editor-input" name="region_id" defaultValue="">
                    <option value="">No region</option>
                    {regions.map((region) => (
                      <option key={region.id} value={region.id}>
                        {region.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <button className="button primary" type="submit">
                Create location
              </button>
            </form>

            <div className="admin-table-frame business-member-table" style={{ marginTop: 18 }}>
              <div className="admin-table-scroll">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Location</th>
                      <th>Region</th>
                      <th>Employees</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {locations.map((location) => {
                      const region = location.region_id ? regionById.get(location.region_id) : null;
                      const assignedEmployees = members.filter((member) => member.location_id === location.id && member.status === "active");
                      return (
                        <tr key={location.id}>
                          <td>
                            <strong>{location.name}</strong>
                            <div className="table-subtext">
                              {[location.address, location.city, location.state].filter(Boolean).join(", ") || "No address yet"}
                            </div>
                          </td>
                          <td>{region?.name || "No region"}</td>
                          <td>{assignedEmployees.length}</td>
                          <td>
                            <details className="employee-manage-panel">
                              <summary className="button secondary">Edit</summary>
                              <div className="employee-manage-panel-inner">
                                <form action={saveBusinessLocation} className="editor-form">
                                  <input type="hidden" name="organization_id" value={organization.id} />
                                  <input type="hidden" name="location_id" value={location.id} />
                                  <label className="editor-label">
                                    Location name
                                    <input className="editor-input" name="name" defaultValue={location.name} required />
                                  </label>
                                  <div className="editor-grid">
                                    <label className="editor-label">
                                      Slug
                                      <input className="editor-input" name="slug" defaultValue={location.slug || ""} />
                                    </label>
                                    <label className="editor-label">
                                      Phone
                                      <input className="editor-input" name="phone" defaultValue={location.phone || ""} />
                                    </label>
                                  </div>
                                  <div className="editor-grid">
                                    <label className="editor-label">
                                      Address
                                      <input className="editor-input" name="address" defaultValue={location.address || ""} />
                                    </label>
                                    <label className="editor-label">
                                      City
                                      <input className="editor-input" name="city" defaultValue={location.city || ""} />
                                    </label>
                                  </div>
                                  <div className="editor-grid">
                                    <label className="editor-label">
                                      State
                                      <input className="editor-input" name="state" defaultValue={location.state || ""} maxLength={2} />
                                    </label>
                                    <label className="editor-label">
                                      Region
                                      <select className="editor-input" name="region_id" defaultValue={location.region_id || ""}>
                                        <option value="">No region</option>
                                        {regions.map((region) => (
                                          <option key={region.id} value={region.id}>
                                            {region.name}
                                          </option>
                                        ))}
                                      </select>
                                    </label>
                                  </div>
                                  <button className="button secondary" type="submit">
                                    Save location
                                  </button>
                                </form>
                                <form action={deleteBusinessLocation}>
                                  <input type="hidden" name="organization_id" value={organization.id} />
                                  <input type="hidden" name="location_id" value={location.id} />
                                  <ConfirmSubmitButton
                                    className="button secondary"
                                    confirmMessage={`Delete ${location.name}? Employees assigned to it will revert to no location.`}
                                  >
                                    Delete location
                                  </ConfirmSubmitButton>
                                </form>
                              </div>
                            </details>
                          </td>
                        </tr>
                      );
                    })}
                    {locations.length === 0 ? (
                      <tr>
                        <td colSpan={4}>
                          <p className="editor-copy">No locations yet. Add one above when you are ready.</p>
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="dashboard-card">
            <div className="dashboard-kicker">Regions</div>
            <h2>Future-ready territory groups.</h2>
            <p className="editor-copy">
              Regions are intentionally simple for now. They let locations be grouped later by state codes or custom territory rules.
            </p>

            <form action={saveBusinessRegion} className="editor-form" style={{ marginTop: 18 }}>
              <input type="hidden" name="organization_id" value={organization.id} />
              <label className="editor-label">
                Region name
                <input className="editor-input" name="name" placeholder="Central Illinois" required />
              </label>
              <label className="editor-label">
                Description
                <textarea className="editor-input" name="description" rows={3} placeholder="Optional notes about the territory." />
              </label>
              <label className="editor-label">
                State codes
                <input className="editor-input" name="state_codes" placeholder="IL,MO,IN" />
              </label>
              <button className="button primary" type="submit">
                Create region
              </button>
            </form>

            <div className="admin-table-frame business-member-table" style={{ marginTop: 18 }}>
              <div className="admin-table-scroll">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Region</th>
                      <th>State codes</th>
                      <th>Locations</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {regions.map((region) => {
                      const regionLocations = locations.filter((location) => location.region_id === region.id);
                      return (
                        <tr key={region.id}>
                          <td>
                            <strong>{region.name}</strong>
                            {region.description ? <div className="table-subtext">{region.description}</div> : null}
                          </td>
                          <td>{region.state_codes?.length ? region.state_codes.join(", ") : "—"}</td>
                          <td>{regionLocations.length}</td>
                          <td>
                            <details className="employee-manage-panel">
                              <summary className="button secondary">Edit</summary>
                              <div className="employee-manage-panel-inner">
                                <form action={saveBusinessRegion} className="editor-form">
                                  <input type="hidden" name="organization_id" value={organization.id} />
                                  <input type="hidden" name="region_id" value={region.id} />
                                  <label className="editor-label">
                                    Region name
                                    <input className="editor-input" name="name" defaultValue={region.name} required />
                                  </label>
                                  <label className="editor-label">
                                    Description
                                    <textarea className="editor-input" name="description" rows={3} defaultValue={region.description || ""} />
                                  </label>
                                  <label className="editor-label">
                                    State codes
                                    <input
                                      className="editor-input"
                                      name="state_codes"
                                      defaultValue={region.state_codes?.join(", ") || ""}
                                    />
                                  </label>
                                  <button className="button secondary" type="submit">
                                    Save region
                                  </button>
                                </form>
                              </div>
                            </details>
                          </td>
                        </tr>
                      );
                    })}
                    {regions.length === 0 ? (
                      <tr>
                        <td colSpan={4}>
                          <p className="editor-copy">No regions yet. Add one when you want to group locations by territory.</p>
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="dashboard-wrap">
        <div className="dashboard-card">
          <div className="dashboard-kicker">Employee status</div>
          <h2>View, manage, archive, or delete employees.</h2>
          <p className="editor-copy">
            Token links, assignments, and deactivation live in this table so each employee can be managed in one place.
          </p>
          <div className="admin-table-frame business-member-table">
            <div className="admin-table-scroll">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Role / title</th>
                    <th>Location</th>
                    <th>Email</th>
                    <th>Token</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => {
                    const assignedToken = tokens.find((token) => token.assigned_member_id === member.id);
                    const assignedProfileUrl = assignedToken ? tokenUrl(assignedToken.token) : null;
                    const lockedPlatformAdmin = isPlatformAdminMember(member);
                    const memberLocation = member.location_id ? locationById.get(member.location_id) : null;
                    return (
                      <tr key={member.id}>
                        <td>
                          <strong>{member.name}</strong>
                        </td>
                        <td>
                          {lockedPlatformAdmin ? (
                            <div>
                              <strong>Platform admin</strong>
                              <div className="table-subtext">Locked TapTagg support access</div>
                            </div>
                          ) : normalizeBusinessRole(member.role) === "super_admin" ? (
                            <div>
                              <strong>Owner</strong>
                              <div className="table-subtext">{member.title || "Business owner"}</div>
                            </div>
                          ) : (
                            <div>
                              <strong>{businessRoleLabel(member.role)}</strong>
                              {member.title ? <div className="table-subtext">{member.title}</div> : null}
                            </div>
                          )}
                        </td>
                        <td>{memberLocation ? memberLocation.name : "No location"}</td>
                        <td>{member.email || "—"}</td>
                        <td>
                          {assignedToken && assignedProfileUrl ? (
                            <div>
                              <strong>{assignedToken.token_type.replace("_", " ")}</strong>
                              <div className="table-subtext">{assignedProfileUrl}</div>
                            </div>
                          ) : (
                            "No token"
                          )}
                        </td>
                        <td>
                          <span className="status-pill">{member.status}</span>
                        </td>
                        <td>
                          <div className="table-actions">
                            {lockedPlatformAdmin ? (
                              <span className="editor-copy">Locked platform admin access.</span>
                            ) : (
                              <>
                                {assignedProfileUrl ? (
                                  <Link className="button secondary" href={assignedProfileUrl} target="_blank" rel="noreferrer">
                                    View profile
                                  </Link>
                                ) : null}
                                <details className="employee-manage-panel">
                                  <summary className="button secondary">Manage</summary>
                                  <div className="employee-manage-panel-inner">
                                    <div className="dashboard-kicker">Headshot</div>
                                    {member.headshot_url ? (
                                      <div className="employee-headshot-preview">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
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
                                      <span className="table-subtext">
                                        JPG, PNG, or WebP. Max {Math.round(BUSINESS_HEADSHOT_MAX_BYTES / 1024 / 1024)} MB.
                                      </span>
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

                                    <div className="dashboard-kicker">Email</div>
                                    <form action={updateEmployeeEmail} className="table-actions">
                                      <input type="hidden" name="organization_id" value={organization.id} />
                                      <input type="hidden" name="member_id" value={member.id} />
                                      <input
                                        className="editor-input"
                                        name="email"
                                        type="email"
                                        defaultValue={member.email || ""}
                                        placeholder="name@example.com"
                                        autoComplete="email"
                                      />
                                      <button className="button secondary" type="submit">Save email</button>
                                    </form>
                                    <p className="table-subtext">
                                      Updates the business member email used for invites and digital pass delivery.
                                    </p>

                                    <div className="dashboard-kicker">Location</div>
                                    <form action={updateEmployeeLocation} className="table-actions">
                                      <input type="hidden" name="organization_id" value={organization.id} />
                                      <input type="hidden" name="member_id" value={member.id} />
                                      <select
                                        className="editor-input"
                                        name="location_id"
                                        defaultValue={member.location_id || ""}
                                        aria-label={`Location for ${member.name}`}
                                      >
                                        <option value="">No location</option>
                                        {locations.map((location) => (
                                          <option key={location.id} value={location.id}>
                                            {location.name}
                                          </option>
                                        ))}
                                      </select>
                                      <button className="button secondary" type="submit">
                                        Save location
                                      </button>
                                    </form>
                                    <p className="table-subtext">
                                      Assign the employee to a location so future location-level reporting can filter cleanly.
                                    </p>

                                    <div className="dashboard-kicker">Token and digital pass</div>
                                    {assignedToken ? (
                                      <>
                                        <Link className="button secondary" href={`/pass/business/${assignedToken.token}`}>
                                          View digital pass
                                        </Link>
                                        {assignedProfileUrl ? <CopyLinkButton value={assignedProfileUrl} /> : null}
                                        {member.email && member.status === "active" && assignedToken.status === "active" ? (
                                          <form action={sendBusinessDigitalPass}>
                                            <input type="hidden" name="organization_id" value={organization.id} />
                                            <input type="hidden" name="member_id" value={member.id} />
                                            <input type="hidden" name="token_id" value={assignedToken.id} />
                                            <button className="button secondary" type="submit">Send digital pass</button>
                                          </form>
                                        ) : (
                                          <button className="button secondary" type="button" disabled aria-disabled="true">
                                            Send digital pass
                                          </button>
                                        )}
                                        <form action={updateTokenAssignment} className="table-actions">
                                          <input type="hidden" name="organization_id" value={organization.id} />
                                          <input type="hidden" name="token_id" value={assignedToken.id} />
                                          <select
                                            className="editor-input"
                                            name="assigned_member_id"
                                            defaultValue={assignedToken.assigned_member_id || ""}
                                            aria-label={`Reassign ${member.name}'s token`}
                                          >
                                            <option value="">Unassigned</option>
                                            {activeMembers.map((candidate) => (
                                              <option key={candidate.id} value={candidate.id}>
                                                {candidate.name}
                                              </option>
                                            ))}
                                          </select>
                                          <button className="button secondary" type="submit">Save assignment</button>
                                        </form>
                                        <form action={deactivateToken}>
                                          <input type="hidden" name="organization_id" value={organization.id} />
                                          <input type="hidden" name="token_id" value={assignedToken.id} />
                                          <input type="hidden" name="status" value="unassigned" />
                                          <button className="button secondary" type="submit">Unassign token</button>
                                        </form>
                                        {assignedToken.status === "inactive" ? (
                                          <form action={deactivateToken}>
                                            <input type="hidden" name="organization_id" value={organization.id} />
                                            <input type="hidden" name="token_id" value={assignedToken.id} />
                                            <input type="hidden" name="assigned_member_id" value={member.id} />
                                            <input type="hidden" name="status" value="active" />
                                            <button className="button secondary" type="submit">Reactivate token</button>
                                          </form>
                                        ) : (
                                          <form action={deactivateToken}>
                                            <input type="hidden" name="organization_id" value={organization.id} />
                                            <input type="hidden" name="token_id" value={assignedToken.id} />
                                            <button className="button secondary" type="submit">Deactivate token</button>
                                          </form>
                                        )}
                                      </>
                                    ) : member.status === "active" ? (
                                      <form action={issueToken} className="table-actions">
                                        <input type="hidden" name="organization_id" value={organization.id} />
                                        <input type="hidden" name="assigned_member_id" value={member.id} />
                                        <button className="button secondary" type="submit">Issue token</button>
                                      </form>
                                    ) : (
                                      <span className="editor-copy">Activate employee to issue a token.</span>
                                    )}

                                    <div className="dashboard-kicker">Access</div>
                                    {normalizeBusinessRole(member.role) === "super_admin" ? (
                                      <p className="table-subtext">Owner role is locked.</p>
                                    ) : (
                                      <form action={updateEmployeeRole} className="table-actions">
                                        <input type="hidden" name="organization_id" value={organization.id} />
                                        <input type="hidden" name="member_id" value={member.id} />
                                        <select
                                          className="editor-input"
                                          name="role"
                                          defaultValue={normalizeBusinessRole(member.role)}
                                          aria-label={`Role for ${member.name}`}
                                        >
                                          <option value="employee">Employee</option>
                                          <option value="location_admin">Location admin</option>
                                          <option value="business_admin">Business admin</option>
                                          <option value="super_admin">Super admin</option>
                                        </select>
                                        <button className="button secondary" type="submit">Save role</button>
                                      </form>
                                    )}
                                    {member.status === "active" && member.email ? (
                                      <form action={sendBusinessLoginInvite}>
                                        <input type="hidden" name="organization_id" value={organization.id} />
                                        <input type="hidden" name="member_id" value={member.id} />
                                        <button className="button secondary" type="submit">Send invite</button>
                                      </form>
                                    ) : null}

                                    <div className="dashboard-kicker">Danger zone</div>
                                    {member.status === "active" ? (
                                      <form action={updateEmployeeStatus}>
                                        <input type="hidden" name="organization_id" value={organization.id} />
                                        <input type="hidden" name="member_id" value={member.id} />
                                        <input type="hidden" name="status" value="inactive" />
                                        <ConfirmSubmitButton
                                          className="button secondary"
                                          confirmMessage={`Archive ${member.name}? Their assigned token will be deactivated.`}
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
                                    <form action={deleteEmployee}>
                                      <input type="hidden" name="organization_id" value={organization.id} />
                                      <input type="hidden" name="member_id" value={member.id} />
                                      <ConfirmSubmitButton
                                        className="button secondary"
                                        confirmMessage={`Permanently delete ${member.name}? This will unassign their token and remove them from the business table.`}
                                      >
                                        Delete
                                      </ConfirmSubmitButton>
                                    </form>
                                  </div>
                                </details>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {unassignedTokens.map((token) => {
                    const url = tokenUrl(token.token);

                    return (
                      <tr key={token.id}>
                        <td>
                          <strong>Unassigned token</strong>
                        </td>
                        <td>{token.token_type.replace("_", " ")}</td>
                        <td>—</td>
                        <td>
                          <strong>{`/p/${token.token}`}</strong>
                          <div className="table-subtext">{url}</div>
                        </td>
                        <td>
                          <span className="status-pill">{token.status}</span>
                        </td>
                        <td>
                          <div className="table-actions">
                            <CopyLinkButton value={url} />
                            <form action={updateTokenAssignment} className="table-actions">
                              <input type="hidden" name="organization_id" value={organization.id} />
                              <input type="hidden" name="token_id" value={token.id} />
                              <select
                                className="editor-input"
                                name="assigned_member_id"
                                defaultValue=""
                                aria-label="Assign unassigned token"
                              >
                                <option value="">Unassigned</option>
                                {activeMembers.map((candidate) => (
                                  <option key={candidate.id} value={candidate.id}>
                                    {candidate.name}
                                  </option>
                                ))}
                              </select>
                              <button className="button secondary" type="submit">Save</button>
                            </form>
                            {token.status !== "inactive" ? (
                              <form action={deactivateToken}>
                                <input type="hidden" name="organization_id" value={organization.id} />
                                <input type="hidden" name="token_id" value={token.id} />
                                <button className="button secondary" type="submit">Deactivate token</button>
                              </form>
                            ) : null}
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

      <section className="dashboard-wrap" id="business-automations">
        <div className="dashboard-card">
          <div className="dashboard-kicker">Automations</div>
          <h2>Send TapTagg events to your workflows.</h2>
          <p className="editor-copy">
            Connect TapTagg Business to Zapier, Make, HubSpot workflows, Salesforce workflows, GoHighLevel, custom CRMs, or any system that accepts webhooks.
          </p>

          <form action={saveOrganizationWebhooks} className="editor-form" style={{ marginTop: 18 }}>
            <input type="hidden" name="organization_id" value={organization.id} />
            <label className="editor-label">
              <span style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                <span>Enable Webhooks</span>
                <input
                  name="enabled"
                  type="checkbox"
                  defaultChecked={webhookSettings?.enabled ?? false}
                  aria-label="Enable webhooks"
                />
              </span>
            </label>
            <label className="editor-label">
              Webhook URL
              <input
                className="editor-input"
                name="webhook_url"
                placeholder="https://example.com/webhooks/taptagg"
                defaultValue={webhookSettings?.webhook_url || ""}
              />
            </label>
            <button className="button primary" type="submit">
              Save Webhook Settings
            </button>
          </form>

          <form action={regenerateOrganizationWebhookSecret} className="table-actions" style={{ marginTop: 12 }}>
            <input type="hidden" name="organization_id" value={organization.id} />
            <ConfirmSubmitButton
              className="button secondary"
              confirmMessage="Regenerate the webhook secret? Existing integrations will need the updated secret."
            >
              Regenerate Secret
            </ConfirmSubmitButton>
          </form>

          <div className="dashboard-card" style={{ marginTop: 18 }}>
            <div className="dashboard-kicker">Webhook Secret</div>
            {webhookSettings?.webhook_secret ? (
              <div className="table-actions">
                <code style={{ wordBreak: "break-all" }}>{webhookSettings.webhook_secret}</code>
                <CopyLinkButton
                  className="button secondary"
                  value={webhookSettings.webhook_secret}
                  label="Copy Secret"
                  copiedLabel="Secret Copied"
                />
              </div>
            ) : (
              <p className="editor-copy">Save or regenerate settings to create a webhook secret.</p>
            )}
            <p className="table-subtext">
              Signature format: HMAC_SHA256(secret, timestamp + &quot;.&quot; + raw_json_payload)
            </p>
            <WebhookTestButton
              organizationId={organization.id}
              disabled={!webhookSettings?.enabled}
            />
          </div>

          <div className="admin-table-frame business-member-table" style={{ marginTop: 18 }}>
            <div className="admin-table-scroll">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Event</th>
                    <th>Success</th>
                    <th>Status Code</th>
                  </tr>
                </thead>
                <tbody>
                  {webhookDeliveries.length > 0 ? (
                    webhookDeliveries.map((delivery) => (
                      <tr key={delivery.id}>
                        <td>{delivery.attempted_at ? new Date(delivery.attempted_at).toLocaleString() : "—"}</td>
                        <td>{delivery.event_type}</td>
                        <td>
                          <span className="status-pill">{delivery.success ? "true" : "false"}</span>
                        </td>
                        <td>{delivery.status_code ?? "—"}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4}>
                        <p className="editor-copy">No webhook deliveries yet.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <section className="dashboard-wrap">
        <div className="dashboard-card">
          <div className="dashboard-kicker">Employees</div>
          <h2>Create employee profiles.</h2>
          <p className="editor-copy">
            Employees get an email invite to create their password and open their business pass page.
          </p>
          <form action={addEmployee} className="editor-form" style={{ marginTop: 18 }}>
            <input type="hidden" name="organization_id" value={organization.id} />
            <div className="editor-grid">
              <label className="editor-label">
                Name
                <input className="editor-input" name="name" required />
              </label>
              <label className="editor-label">
                Title
                <input className="editor-input" name="title" />
              </label>
            </div>
            <div className="editor-grid">
              <label className="editor-label">
                Email
                <input className="editor-input" name="email" type="email" />
              </label>
              <label className="editor-label">
                Phone
                <input className="editor-input" name="phone" type="tel" />
              </label>
            </div>
            <button className="button primary" type="submit">Add employee</button>
          </form>
        </div>
      </section>

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

      <section className="dashboard-wrap" id="business-branding">
        <div className="dashboard-card">
          <div className="dashboard-kicker">Business branding</div>
          <h2>Customize pass pages.</h2>
            <p className="editor-copy">
            These colors, logo, and optional links apply to business token pages like /p/token.
          </p>
          <form action={updateOrganizationBranding} className="editor-form" encType="multipart/form-data" style={{ marginTop: 18 }}>
            <input type="hidden" name="organization_id" value={organization.id} />
            <BusinessBrandThemeFields organization={organization} />
            <div className="editor-label">
              Logo PNG
              {organization.brand_logo_url ? (
                <div className="business-logo-preview">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={organization.brand_logo_url} alt={`${organization.name} logo`} />
                  <span className="table-subtext">Current logo</span>
                </div>
              ) : (
                <span className="table-subtext">No logo uploaded.</span>
              )}
              <input
                className="editor-input"
                name="brand_logo_file"
                type="file"
                accept="image/png"
              />
              <span className="table-subtext">
                PNG only. Max {Math.round(BUSINESS_LOGO_MAX_BYTES / 1024 / 1024)} MB.
              </span>
            </div>
            <div>
              <div className="dashboard-kicker">Business web links</div>
              <p className="editor-copy">
                These replace the email/profile URL strip on every employee pass. Empty links stay hidden.
              </p>
            </div>
            {[1, 2, 3, 4].map((index) => {
              const titleKey = `business_link_${index}_title` as keyof OrganizationRecord;
              const urlKey = `business_link_${index}_url` as keyof OrganizationRecord;
              return (
                <div className="editor-grid" key={index}>
                  <label className="editor-label">
                    Link {index} label
                    <input
                      className="editor-input"
                      name={`business_link_${index}_title`}
                      placeholder={index === 1 ? "Company website" : "Book a demo"}
                      defaultValue={(organization[titleKey] as string | null) || ""}
                    />
                  </label>
                  <label className="editor-label">
                    Link {index} URL
                    <input
                      className="editor-input"
                      name={`business_link_${index}_url`}
                      type="url"
                      placeholder="https://..."
                      defaultValue={(organization[urlKey] as string | null) || ""}
                    />
                  </label>
                </div>
              );
            })}
            <button className="button primary" type="submit">Save branding</button>
          </form>
          {organization.brand_logo_url ? (
            <form action={deleteBusinessLogo} style={{ marginTop: 12 }}>
              <input type="hidden" name="organization_id" value={organization.id} />
              <ConfirmSubmitButton
                className="button secondary"
                confirmMessage="Delete this business logo?"
              >
                Delete logo
              </ConfirmSubmitButton>
            </form>
          ) : null}
        </div>
      </section>
    </Shell>
  );
}
