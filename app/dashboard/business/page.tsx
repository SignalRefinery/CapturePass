import { redirect } from "next/navigation";
import Link from "next/link";
import { CopyLinkButton } from "@/components/business/copy-link-button";
import { Shell } from "@/components/shared/shell";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { generatePrivateToken } from "@/lib/utils/generate-token";
import type {
  OrganizationMemberRecord,
  OrganizationRecord,
  PassTokenRecord
} from "@/lib/types";

type BusinessData = {
  organization: OrganizationRecord | null;
  members: OrganizationMemberRecord[];
  tokens: PassTokenRecord[];
};

function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "https://taptagg.app").replace(/\/$/, "");
}

function tokenUrl(token: string) {
  return `${appUrl()}/p/${token}`;
}

async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return user;
}

async function getBusinessData(userId: string): Promise<BusinessData> {
  const admin = createAdminClient();
  const { data: ownedOrg } = await admin
    .from("organizations")
    .select("*")
    .eq("owner_user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  let organization = ownedOrg as OrganizationRecord | null;

  if (!organization) {
    const { data: adminMember } = await admin
      .from("organization_members")
      .select("organization:organizations(*)")
      .eq("user_id", userId)
      .eq("status", "active")
      .in("role", ["owner", "admin"])
      .limit(1)
      .maybeSingle();

    const org = Array.isArray(adminMember?.organization)
      ? adminMember?.organization[0]
      : adminMember?.organization;
    organization = (org as OrganizationRecord | undefined) || null;
  }

  if (!organization) {
    return { organization: null, members: [], tokens: [] };
  }

  const [{ data: members }, { data: tokens }] = await Promise.all([
    admin
      .from("organization_members")
      .select("*")
      .eq("organization_id", organization.id)
      .order("created_at", { ascending: true }),
    admin
      .from("pass_tokens")
      .select("*")
      .eq("organization_id", organization.id)
      .order("created_at", { ascending: true })
  ]);

  return {
    organization,
    members: (members || []) as OrganizationMemberRecord[],
    tokens: (tokens || []) as PassTokenRecord[]
  };
}

async function requireBusinessAdmin(organizationId: string) {
  "use server";

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: organization } = await admin
    .from("organizations")
    .select("id, owner_user_id")
    .eq("id", organizationId)
    .maybeSingle();

  if (organization?.owner_user_id === user.id) return user;

  const { data: member } = await admin
    .from("organization_members")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .in("role", ["owner", "admin"])
    .maybeSingle();

  if (!member) redirect("/dashboard/business");
  return user;
}

async function createOrganization(formData: FormData) {
  "use server";

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const name = String(formData.get("name") || "").trim();
  const adminName = String(formData.get("admin_name") || "").trim();
  const adminEmail = String(formData.get("admin_email") || "").trim();
  const adminPhone = String(formData.get("admin_phone") || "").trim();
  const adminTitle = String(formData.get("admin_title") || "").trim();
  const managedService = formData.get("managed_service_enabled") === "on";

  if (!name) redirect("/dashboard/business?error=missing_org_name");
  if (!adminName) redirect("/dashboard/business?error=missing_admin_name");

  const admin = createAdminClient();
  const { data: organization, error } = await admin
    .from("organizations")
    .insert({
      name,
      owner_user_id: user.id,
      managed_service_enabled: managedService
    })
    .select("id")
    .single();

  if (error || !organization) redirect("/dashboard/business?error=org_create_failed");

  await admin.from("organization_members").insert({
    organization_id: organization.id,
    name: adminName,
    email: adminEmail || null,
    phone: adminPhone || null,
    title: adminTitle || null,
    role: "admin",
    status: "active"
  });

  redirect("/dashboard/business");
}

async function addEmployee(formData: FormData) {
  "use server";

  const organizationId = String(formData.get("organization_id") || "");
  await requireBusinessAdmin(organizationId);

  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const title = String(formData.get("title") || "").trim();

  if (!name) redirect("/dashboard/business?error=missing_employee_name");

  const admin = createAdminClient();
  const { count } = await admin
    .from("organization_members")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId);

  await admin.from("organization_members").insert({
    organization_id: organizationId,
    name,
    email: email || null,
    phone: phone || null,
    title: title || null,
    role: count === 0 ? "admin" : "member",
    status: "active"
  });

  redirect("/dashboard/business");
}

async function generateUniqueToken() {
  const admin = createAdminClient();

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const token = generatePrivateToken(12);
    const { data } = await admin
      .from("pass_tokens")
      .select("id")
      .eq("token", token)
      .maybeSingle();

    if (!data) return token;
  }

  return generatePrivateToken(16);
}

async function issueToken(formData: FormData) {
  "use server";

  const organizationId = String(formData.get("organization_id") || "");
  await requireBusinessAdmin(organizationId);

  const assignedMemberId = String(formData.get("assigned_member_id") || "") || null;
  const tokenType = String(formData.get("token_type") || "both");
  const token = await generateUniqueToken();
  const admin = createAdminClient();

  await admin.from("pass_tokens").insert({
    organization_id: organizationId,
    token,
    assigned_member_id: assignedMemberId,
    status: assignedMemberId ? "active" : "unassigned",
    token_type: tokenType
  });

  redirect("/dashboard/business");
}

async function updateTokenAssignment(formData: FormData) {
  "use server";

  const organizationId = String(formData.get("organization_id") || "");
  await requireBusinessAdmin(organizationId);

  const tokenId = String(formData.get("token_id") || "");
  const assignedMemberId = String(formData.get("assigned_member_id") || "") || null;
  const admin = createAdminClient();

  await admin
    .from("pass_tokens")
    .update({
      assigned_member_id: assignedMemberId,
      status: assignedMemberId ? "active" : "unassigned"
    })
    .eq("id", tokenId)
    .eq("organization_id", organizationId);

  redirect("/dashboard/business");
}

async function deactivateToken(formData: FormData) {
  "use server";

  const organizationId = String(formData.get("organization_id") || "");
  await requireBusinessAdmin(organizationId);

  const tokenId = String(formData.get("token_id") || "");
  const admin = createAdminClient();

  await admin
    .from("pass_tokens")
    .update({ status: "inactive" })
    .eq("id", tokenId)
    .eq("organization_id", organizationId);

  redirect("/dashboard/business");
}

async function deactivateEmployee(formData: FormData) {
  "use server";

  const organizationId = String(formData.get("organization_id") || "");
  await requireBusinessAdmin(organizationId);

  const memberId = String(formData.get("member_id") || "");
  const admin = createAdminClient();

  await admin
    .from("organization_members")
    .update({ status: "inactive" })
    .eq("id", memberId)
    .eq("organization_id", organizationId);

  await admin
    .from("pass_tokens")
    .update({ status: "inactive" })
    .eq("assigned_member_id", memberId)
    .eq("organization_id", organizationId);

  redirect("/dashboard/business");
}

export default async function BusinessDashboardPage({
  searchParams
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { organization, members, tokens } = await getBusinessData(user.id);
  const params = searchParams ? await searchParams : {};
  const initialAuth = {
    email: user.email || null,
    fullName: user.user_metadata?.full_name || null,
    slug: null
  };

  if (!organization) {
    return (
      <Shell footerLeft="Business dashboard" footerRight="TapTagg" initialAuth={initialAuth}>
        <section className="simple-hero">
          <div className="dashboard-card" style={{ maxWidth: 780, margin: "0 auto" }}>
            <div className="dashboard-kicker">Business setup</div>
            <h1>Create your company account.</h1>
            <p>
              Business TapTagg uses permanent card/pass URLs that can be reassigned as your team changes.
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
                  Business admin email
                  <input className="editor-input" name="admin_email" type="email" />
                </label>
                <label className="editor-label">
                  Business admin phone
                  <input className="editor-input" name="admin_phone" type="tel" />
                </label>
              </div>
              <label className="checkbox-row">
                <input name="managed_service_enabled" type="checkbox" />
                Managed setup and service +$199/month
              </label>
              <button className="button primary" type="submit">
                Create company account
              </button>
            </form>
          </div>
        </section>
      </Shell>
    );
  }

  const activeMembers = members.filter((member) => member.status === "active");
  const memberById = new Map(members.map((member) => [member.id, member]));

  return (
    <Shell footerLeft="Business dashboard" footerRight="TapTagg" initialAuth={initialAuth}>
      <section className="simple-hero">
        <div className="kicker">
          <span className="mini-star">✦</span>
          <span>Business dashboard</span>
        </div>
        <h1>{organization.name}</h1>
        <p>
          Manage employees, permanent card/pass tokens, and phone-first digital sharing for your team.
        </p>
      </section>

      {params?.error ? (
        <section className="dashboard-wrap">
          <div className="dashboard-card pass-alert">
            <div className="dashboard-kicker">Action needed</div>
            <p className="editor-copy">Please complete the required business fields and try again.</p>
          </div>
        </section>
      ) : null}

      <section className="dashboard-wrap">
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <div className="dashboard-kicker">Managed service</div>
            <h2>{organization.managed_service_enabled ? "Managed service enabled." : "Managed setup available."}</h2>
            <p className="editor-copy">
              Add managed setup, employee changes, card routing help, and ongoing support for +$199/month.
            </p>
          </div>

          <div className="dashboard-card">
            <div className="dashboard-kicker">Digital pass first</div>
            <h2>QR is the daily share method.</h2>
            <p className="editor-copy">
              NFC cards create the physical moment. Digital Pass QR links point at permanent /p/token URLs that survive turnover.
            </p>
          </div>
        </div>
      </section>

      <section className="dashboard-wrap">
        <div className="dashboard-card">
          <div className="dashboard-kicker">Employees</div>
          <h2>Create employee profiles.</h2>
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

      <section className="dashboard-wrap">
        <div className="dashboard-card">
          <div className="dashboard-kicker">Permanent tokens</div>
          <h2>Issue a card/pass token.</h2>
          <form action={issueToken} className="editor-form" style={{ marginTop: 18 }}>
            <input type="hidden" name="organization_id" value={organization.id} />
            <div className="editor-grid">
              <label className="editor-label">
                Assign to employee
                <select className="editor-input" name="assigned_member_id" defaultValue="">
                  <option value="">Leave unassigned</option>
                  {activeMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="editor-label">
                Token type
                <select className="editor-input" name="token_type" defaultValue="both">
                  <option value="both">NFC card + digital pass</option>
                  <option value="nfc_card">NFC card</option>
                  <option value="digital_pass">Digital pass</option>
                </select>
              </label>
            </div>
            <button className="button primary" type="submit">Create token</button>
          </form>
        </div>
      </section>

      <section className="dashboard-wrap">
        <div className="dashboard-grid">
          {tokens.map((token) => {
            const member = token.assigned_member_id ? memberById.get(token.assigned_member_id) : null;
            const url = tokenUrl(token.token);
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=360x360&data=${encodeURIComponent(url)}`;

            return (
              <article className="dashboard-card" key={token.id}>
                <div className="dashboard-kicker">{token.token_type.replace("_", " ")}</div>
                <h2>{member?.name || "Unassigned token"}</h2>
                <p className="editor-copy">
                  {member?.title || "Permanent URL"} · {token.status}
                </p>
                <div className="pass-qr-frame" style={{ maxWidth: 220 }}>
                  <img src={qrUrl} alt={`QR code for ${url}`} />
                </div>
                <p className="editor-copy" style={{ wordBreak: "break-all" }}>{url}</p>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Link className="button secondary" href={`/p/${token.token}`}>Open</Link>
                  <CopyLinkButton value={url} />
                  <button className="button secondary" type="button" disabled aria-disabled="true">
                    Add/save digital pass
                  </button>
                </div>
                <form action={updateTokenAssignment} className="editor-form" style={{ marginTop: 16 }}>
                  <input type="hidden" name="organization_id" value={organization.id} />
                  <input type="hidden" name="token_id" value={token.id} />
                  <label className="editor-label">
                    Reassign token
                    <select className="editor-input" name="assigned_member_id" defaultValue={token.assigned_member_id || ""}>
                      <option value="">Unassigned</option>
                      {activeMembers.map((candidate) => (
                        <option key={candidate.id} value={candidate.id}>
                          {candidate.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button className="button secondary" type="submit">Save assignment</button>
                </form>
                <form action={deactivateToken} style={{ marginTop: 10 }}>
                  <input type="hidden" name="organization_id" value={organization.id} />
                  <input type="hidden" name="token_id" value={token.id} />
                  <button className="button secondary" type="submit">Deactivate token</button>
                </form>
              </article>
            );
          })}
        </div>
      </section>

      <section className="dashboard-wrap">
        <div className="dashboard-card">
          <div className="dashboard-kicker">Employee status</div>
          <h2>Deactivate employees without changing token URLs.</h2>
          <div className="status-list">
            {members.map((member) => {
              const assignedToken = tokens.find((token) => token.assigned_member_id === member.id);
              return (
                <div className="status-row" key={member.id}>
                  <span>
                    {member.name}
                    <br />
                    <small>
                      {member.role === "admin" ? "Business admin" : member.title || "Member"} · {assignedToken ? `/p/${assignedToken.token}` : "No token"}
                    </small>
                  </span>
                  <strong>{member.status}</strong>
                  {member.status === "active" ? (
                    <form action={deactivateEmployee}>
                      <input type="hidden" name="organization_id" value={organization.id} />
                      <input type="hidden" name="member_id" value={member.id} />
                      <button className="button secondary" type="submit">Deactivate</button>
                    </form>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </Shell>
  );
}
