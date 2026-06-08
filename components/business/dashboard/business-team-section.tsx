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
  updateEmployeeEmail,
  updateEmployeeHeadshot,
  updateEmployeeLocation,
  updateEmployeeRole,
  updateEmployeeStatus,
  updateTokenAssignment
} from "@/app/dashboard/business/actions";
import { BUSINESS_HEADSHOT_MAX_BYTES } from "@/lib/business/assets";
import { isPlatformAdminMember, tokenUrl } from "@/lib/business/dashboard-utils";
import { businessRoleLabel, normalizeBusinessRole } from "@/lib/business/roles";
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
};

export function BusinessTeamSection({
  organization,
  members,
  locations,
  tokens
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
  );
}
