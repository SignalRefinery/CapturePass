import Link from "next/link";
import { CopyLinkButton } from "@/components/business/copy-link-button";
import { ConfirmSubmitButton } from "@/components/shared/confirm-submit-button";
import {
  deactivateToken,
  deleteEmployee,
  deleteEmployeeHeadshot,
  issueToken,
  sendBusinessDigitalPass,
  sendBusinessLoginInvite,
  updateEmployeeHeadshot,
  updateEmployeeLocation,
  updateEmployeeProfile,
  updateEmployeeRole,
  updateEmployeeStatus,
  updateTokenAssignment
} from "@/app/dashboard/business/actions";
import { BUSINESS_HEADSHOT_MAX_BYTES } from "@/lib/business/assets";
import { isPlatformAdminMember, tokenUrl } from "@/lib/business/dashboard-utils";
import { businessRoleLabel, normalizeBusinessRole } from "@/lib/business/roles";
import { getBusinessMemberProfileUrl } from "@/lib/urls/profile-url";
import type {
  BusinessLocationRecord,
  OrganizationMemberRecord,
  OrganizationRecord,
  PassTokenRecord
} from "@/lib/types";

type BusinessTeamSectionProps = {
  organization: OrganizationRecord;
  members: OrganizationMemberRecord[];
  locations: BusinessLocationRecord[];
  tokens: PassTokenRecord[];
  showLocationControls?: boolean;
};

function memberActionId(memberId: string, action: string) {
  return `business-member-${memberId}-${action}`;
}

function tokenActionId(tokenId: string, action: string) {
  return `business-token-${tokenId}-${action}`;
}

export function BusinessTeamSection({
  organization,
  members,
  locations,
  tokens,
  showLocationControls = true
}: BusinessTeamSectionProps) {
  const activeMembers = members.filter((member) => member.status === "active" && !isPlatformAdminMember(member));
  const memberById = new Map(members.map((member) => [member.id, member]));
  const locationById = new Map(locations.map((location) => [location.id, location]));
  const unassignedTokens = tokens.filter((token) => !token.assigned_member_id || !memberById.has(token.assigned_member_id));

  return (
    <section className="dashboard-wrap" id="business-employees">
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
                  {showLocationControls ? <th>Location</th> : null}
                  <th>Email</th>
                  <th>Token</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => {
                  const assignedToken = tokens.find((token) => token.assigned_member_id === member.id);
                  const assignedProfileUrl = organization.slug
                    ? getBusinessMemberProfileUrl(organization.slug, member.name)
                    : null;
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
                            <div className="table-subtext">Locked CapturePass support access</div>
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
                      {showLocationControls ? <td>{memberLocation ? memberLocation.name : "No location"}</td> : null}
                      <td>{member.email || "—"}</td>
                      <td>
                        {assignedProfileUrl ? (
                          <div>
                            <strong>Public profile</strong>
                            <div className="table-subtext">{assignedProfileUrl}</div>
                            {assignedToken ? (
                              <div className="table-subtext">{assignedToken.token_type.replace("_", " ")} card assigned</div>
                            ) : (
                              <div className="table-subtext">No card assigned</div>
                            )}
                          </div>
                        ) : (
                          "No public profile"
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
                                        {/* eslint-disable-next-line @next/next/no-img-element -- employee headshots are storage-backed runtime uploads. */}
                                        <img src={member.headshot_url} alt={`${member.name} headshot`} />
                                      </div>
                                    ) : (
                                      <p className="table-subtext">No headshot uploaded.</p>
                                    )}
                                    {member.headshot_url ? (
                                      <a
                                        className="button secondary"
                                        href={`/api/business/headshot/download?organization_id=${organization.id}&member_id=${member.id}`}
                                      >
                                        Download headshot
                                      </a>
                                    ) : null}
                                    <form
                                      action={updateEmployeeHeadshot}
                                      className="table-actions"
                                      encType="multipart/form-data"
                                      id={memberActionId(member.id, "headshot")}
                                    >
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
                                  </form>
                                  {member.headshot_url ? (
                                    <form action={deleteEmployeeHeadshot} id={memberActionId(member.id, "delete-headshot")}>
                                      <input type="hidden" name="organization_id" value={organization.id} />
                                      <input type="hidden" name="member_id" value={member.id} />
                                    </form>
                                  ) : null}

                                  <div className="dashboard-kicker">Profile details</div>
                                  <form
                                    action={updateEmployeeProfile}
                                    className="table-actions"
                                    id={memberActionId(member.id, "profile")}
                                  >
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
                                  </form>
                                  <p className="table-subtext">
                                    Updates the public business profile. If the email changes, CapturePass also updates login access and sends a fresh setup invite.
                                  </p>

                                  {showLocationControls ? (
                                    <>
                                      <div className="dashboard-kicker">Location</div>
                                      <form
                                        action={updateEmployeeLocation}
                                        className="table-actions"
                                        id={memberActionId(member.id, "location")}
                                      >
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
                                      </form>
                                      <p className="table-subtext">
                                        Assign the employee to a location so future location-level reporting can filter cleanly.
                                      </p>
                                    </>
                                  ) : null}

                                  <div className="dashboard-kicker">Token and digital pass</div>
                                  {assignedToken ? (
                                    <>
                                      <Link className="button secondary" href={`/pass/business/${assignedToken.token}`}>
                                        View digital pass
                                      </Link>
                                      {assignedProfileUrl ? <CopyLinkButton value={assignedProfileUrl} /> : null}
                                      {member.email && member.status === "active" && assignedToken.status === "active" ? (
                                        <form action={sendBusinessDigitalPass} id={memberActionId(member.id, "send-pass")}>
                                          <input type="hidden" name="organization_id" value={organization.id} />
                                          <input type="hidden" name="member_id" value={member.id} />
                                          <input type="hidden" name="token_id" value={assignedToken.id} />
                                        </form>
                                      ) : (
                                        <button className="button secondary" type="button" disabled aria-disabled="true">
                                          Send digital pass
                                        </button>
                                      )}
                                      <form
                                        action={updateTokenAssignment}
                                        className="table-actions"
                                        id={memberActionId(member.id, "assignment")}
                                      >
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
                                      </form>
                                      <form action={deactivateToken} id={memberActionId(member.id, "unassign")}>
                                        <input type="hidden" name="organization_id" value={organization.id} />
                                        <input type="hidden" name="token_id" value={assignedToken.id} />
                                        <input type="hidden" name="status" value="unassigned" />
                                      </form>
                                      {assignedToken.status === "inactive" ? (
                                        <form action={deactivateToken} id={memberActionId(member.id, "reactivate")}>
                                          <input type="hidden" name="organization_id" value={organization.id} />
                                          <input type="hidden" name="token_id" value={assignedToken.id} />
                                          <input type="hidden" name="assigned_member_id" value={member.id} />
                                          <input type="hidden" name="status" value="active" />
                                        </form>
                                      ) : (
                                        <form action={deactivateToken} id={memberActionId(member.id, "deactivate")}>
                                          <input type="hidden" name="organization_id" value={organization.id} />
                                          <input type="hidden" name="token_id" value={assignedToken.id} />
                                        </form>
                                      )}
                                    </>
                                  ) : member.status === "active" ? (
                                    <form action={issueToken} className="table-actions" id={memberActionId(member.id, "issue-token")}>
                                      <input type="hidden" name="organization_id" value={organization.id} />
                                      <input type="hidden" name="assigned_member_id" value={member.id} />
                                    </form>
                                  ) : (
                                    <span className="editor-copy">Activate employee to issue a token.</span>
                                  )}

                                  <div className="dashboard-kicker">Access</div>
                                  {normalizeBusinessRole(member.role) === "super_admin" ? (
                                    <p className="table-subtext">Owner role is locked.</p>
                                  ) : (
                                    <form
                                      action={updateEmployeeRole}
                                      className="table-actions"
                                      id={memberActionId(member.id, "role")}
                                    >
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
                                    </form>
                                  )}
                                  {member.status === "active" && member.email ? (
                                    <form action={sendBusinessLoginInvite} id={memberActionId(member.id, "invite")}>
                                      <input type="hidden" name="organization_id" value={organization.id} />
                                      <input type="hidden" name="member_id" value={member.id} />
                                    </form>
                                  ) : null}

                                  <div className="dashboard-kicker">Danger zone</div>
                                  {member.status === "active" ? (
                                    <form action={updateEmployeeStatus} id={memberActionId(member.id, "archive")}>
                                      <input type="hidden" name="organization_id" value={organization.id} />
                                      <input type="hidden" name="member_id" value={member.id} />
                                      <input type="hidden" name="status" value="inactive" />
                                    </form>
                                  ) : (
                                    <form action={updateEmployeeStatus} id={memberActionId(member.id, "restore")}>
                                      <input type="hidden" name="organization_id" value={organization.id} />
                                      <input type="hidden" name="member_id" value={member.id} />
                                      <input type="hidden" name="status" value="active" />
                                    </form>
                                  )}
                                  <form action={deleteEmployee} id={memberActionId(member.id, "delete")}>
                                    <input type="hidden" name="organization_id" value={organization.id} />
                                    <input type="hidden" name="member_id" value={member.id} />
                                  </form>

                                  <div className="employee-action-bar">
                                    <div className="employee-action-bar-group">
                                      <button className="button secondary" type="submit" form={memberActionId(member.id, "headshot")}>
                                        {member.headshot_url ? "Change headshot" : "Upload headshot"}
                                      </button>
                                      {member.headshot_url ? (
                                        <ConfirmSubmitButton
                                          className="button secondary"
                                          confirmMessage={`Delete ${member.name}'s headshot?`}
                                          form={memberActionId(member.id, "delete-headshot")}
                                        >
                                          Delete headshot
                                        </ConfirmSubmitButton>
                                      ) : null}
                                      <button className="button secondary" type="submit" form={memberActionId(member.id, "profile")}>
                                        Save profile
                                      </button>
                                      {showLocationControls ? (
                                        <button className="button secondary" type="submit" form={memberActionId(member.id, "location")}>
                                          Save location
                                        </button>
                                      ) : null}
                                    </div>

                                    <div className="employee-action-bar-group">
                                      {assignedToken ? (
                                        <>
                                          {member.email && member.status === "active" && assignedToken.status === "active" ? (
                                            <button
                                              className="button secondary"
                                              type="submit"
                                              form={memberActionId(member.id, "send-pass")}
                                            >
                                              Send digital pass
                                            </button>
                                          ) : (
                                            <button className="button secondary" type="button" disabled aria-disabled="true">
                                              Send digital pass
                                            </button>
                                          )}
                                          <button className="button secondary" type="submit" form={memberActionId(member.id, "assignment")}>
                                            Save assignment
                                          </button>
                                          <button className="button secondary" type="submit" form={memberActionId(member.id, "unassign")}>
                                            Unassign token
                                          </button>
                                          {assignedToken.status === "inactive" ? (
                                            <button className="button secondary" type="submit" form={memberActionId(member.id, "reactivate")}>
                                              Reactivate token
                                            </button>
                                          ) : (
                                            <button className="button secondary" type="submit" form={memberActionId(member.id, "deactivate")}>
                                              Deactivate token
                                            </button>
                                          )}
                                        </>
                                      ) : member.status === "active" ? (
                                        <button className="button secondary" type="submit" form={memberActionId(member.id, "issue-token")}>
                                          Issue token
                                        </button>
                                      ) : null}
                                      {normalizeBusinessRole(member.role) !== "super_admin" ? (
                                        <button className="button secondary" type="submit" form={memberActionId(member.id, "role")}>
                                          Save role
                                        </button>
                                      ) : null}
                                      {member.status === "active" && member.email ? (
                                        <button className="button secondary" type="submit" form={memberActionId(member.id, "invite")}>
                                          Send invite
                                        </button>
                                      ) : null}
                                      {member.status === "active" ? (
                                        <ConfirmSubmitButton
                                          className="button secondary"
                                          confirmMessage={`Archive ${member.name}? Their assigned token will be deactivated.`}
                                          form={memberActionId(member.id, "archive")}
                                        >
                                          Archive
                                        </ConfirmSubmitButton>
                                      ) : (
                                        <button className="button secondary" type="submit" form={memberActionId(member.id, "restore")}>
                                          Restore
                                        </button>
                                      )}
                                      <ConfirmSubmitButton
                                        className="button secondary"
                                        confirmMessage={`Permanently delete ${member.name}? This will unassign their token and remove them from the business table.`}
                                        form={memberActionId(member.id, "delete")}
                                      >
                                        Delete
                                      </ConfirmSubmitButton>
                                    </div>
                                  </div>
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
                      {showLocationControls ? <td>—</td> : null}
                      <td>—</td>
                      <td>
                        <strong>{`/p/${token.token}`}</strong>
                        <div className="table-subtext">Card / QR URL: {url}</div>
                      </td>
                      <td>
                        <span className="status-pill">{token.status}</span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <CopyLinkButton value={url} />
                          <form
                            action={updateTokenAssignment}
                            className="table-actions"
                            id={tokenActionId(token.id, "assignment")}
                          >
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
                          </form>
                          <div className="employee-action-bar">
                            <button className="button secondary" type="submit" form={tokenActionId(token.id, "assignment")}>
                              Save assignment
                            </button>
                            {token.status !== "inactive" ? (
                              <form action={deactivateToken} id={tokenActionId(token.id, "deactivate")}>
                                <input type="hidden" name="organization_id" value={organization.id} />
                                <input type="hidden" name="token_id" value={token.id} />
                              </form>
                            ) : null}
                            {token.status !== "inactive" ? (
                              <button className="button secondary" type="submit" form={tokenActionId(token.id, "deactivate")}>
                                Deactivate token
                              </button>
                            ) : null}
                          </div>
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
  );
}
