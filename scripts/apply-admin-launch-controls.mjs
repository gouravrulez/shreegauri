import fs from "node:fs";

const path = "app/admin/admin-dashboard.tsx";
let source = fs.readFileSync(path, "utf8");

function replaceOnce(needle, replacement, label) {
  if (source.includes(replacement)) return;
  if (!source.includes(needle)) throw new Error(`Admin launch patch failed: ${label}`);
  source = source.replace(needle, replacement);
}

replaceOnce(
  `  Users,\n} from "lucide-react";`,
  `  Users,\n  ShieldCheck,\n  UserPlus,\n  UserX,\n} from "lucide-react";`,
  "staff icons"
);

replaceOnce(
  `    [lastSeenActivity, setLastSeenActivity] = useState(0);`,
  `    [lastSeenActivity, setLastSeenActivity] = useState(0),\n    [staffRole, setStaffRole] = useState<string>("loading"),\n    [staffRows, setStaffRows] = useState<any[]>([]),\n    [staffEmail, setStaffEmail] = useState(""),\n    [staffInviteRole, setStaffInviteRole] = useState("orders"),\n    [needsPasswordSetup, setNeedsPasswordSetup] = useState(false),\n    [newStaffPassword, setNewStaffPassword] = useState("");`,
  "staff state"
);

replaceOnce(
  `  async function load() {\n    const [a, b, c, d, o, u] = await Promise.all([`,
  `  async function load() {\n    const { data: { session: currentSession } } = await supabase.auth.getSession();\n    if (!currentSession) return;\n    const roleResponse = await fetch("/api/admin/manage", { headers: { Authorization: \`Bearer \${currentSession.access_token}\` } });\n    const roleData = await roleResponse.json().catch(() => ({}));\n    if (!roleResponse.ok) { setStaffRole("unauthorized"); setNotice(roleData.error || "Admin access could not be verified."); return; }\n    setStaffRole(roleData.role);\n    setStaffRows(roleData.staff || []);\n    setNeedsPasswordSetup(Boolean(roleData.needs_password_setup));\n    const [a, b, c, d, o, u] = await Promise.all([`,
  "load role"
);

const helpers = `  async function runAdminAction(action: string, payload: Record<string, unknown> = {}) {\n    const { data: { session: currentSession } } = await supabase.auth.getSession();\n    if (!currentSession) { setNotice("Your session expired. Please sign in again."); return false; }\n    const response = await fetch("/api/admin/manage", { method: "POST", headers: { "Content-Type": "application/json", Authorization: \`Bearer \${currentSession.access_token}\` }, body: JSON.stringify({ action, ...payload }) });\n    const result = await response.json().catch(() => ({}));\n    setNotice(result.message || result.error || (response.ok ? "Done." : "Action failed."));\n    if (response.ok) await load();\n    return response.ok;\n  }\n  async function deleteAdminRecord(kind: "customer" | "order", id: string) {\n    if (staffRole !== "admin") { setNotice("Only the main administrator can delete records."); return; }\n    const warning = kind === "order"\n      ? "Permanently delete this order and its line items/reservations? A restricted audit record will retain its payment reference for reconciliation."\n      : "Delete this customer profile and personal data? Any linked order history will be anonymized and retained for financial reconciliation.";\n    if (!window.confirm(warning)) return;\n    await runAdminAction(kind === "order" ? "delete_order" : "delete_customer", { id });\n  }\n  async function inviteStaff(e: FormEvent) {\n    e.preventDefault();\n    if (staffRole !== "admin") return;\n    const ok = await runAdminAction("invite_staff", { email: staffEmail, role: staffInviteRole });\n    if (ok) setStaffEmail("");\n  }\n  async function removeStaff(userId: string) {\n    if (staffRole !== "admin" || !window.confirm("Revoke this staff member’s Shree Gauri admin access? Their sign-in account will not be deleted.")) return;\n    await runAdminAction("remove_staff", { user_id: userId });\n  }\n  async function saveStaffPassword(e: FormEvent) {\n    e.preventDefault();\n    if (newStaffPassword.length < 12) { setNotice("Use at least 12 characters."); return; }\n    const ok = await runAdminAction("set_password", { password: newStaffPassword });\n    if (ok) { setNewStaffPassword(""); await supabase.auth.refreshSession(); }\n  }\n\n`;
replaceOnce(
  `  async function upload(file: File, kind: "cat" | "prod") {`,
  helpers + `  async function upload(file: File, kind: "cat" | "prod") {`,
  "admin action helpers"
);

replaceOnce(
  `        <button\n          className={tab === "customers" ? "on" : ""}`,
  `        {["admin", "manager", "orders", "support"].includes(staffRole) && (\n        <button\n          className={tab === "customers" ? "on" : ""}`,
  "customer navigation permission"
);
replaceOnce(
  `        <button\n          className={tab === "categories" ? "on" : ""}`,
  `        )}\n        {["admin", "manager", "catalog"].includes(staffRole) && (<button\n          className={tab === "categories" ? "on" : ""}`,
  "category navigation permission"
);
replaceOnce(
  `        <button\n          className={tab === "products" ? "on" : ""}`,
  `        )}\n        {["admin", "manager", "catalog"].includes(staffRole) && (<button\n          className={tab === "products" ? "on" : ""}`,
  "product navigation permission"
);
replaceOnce(
  `        <button\n          className={tab === "reviews" ? "on" : ""}`,
  `        )}\n        {["admin", "manager"].includes(staffRole) && (<button\n          className={tab === "reviews" ? "on" : ""}`,
  "review navigation permission"
);
replaceOnce(
  `        <button\n          className={tab === "settings" ? "on" : ""}`,
  `        )}\n        {staffRole === "admin" && (<button\n          className={tab === "settings" ? "on" : ""}`,
  "settings navigation permission"
);
replaceOnce(
  `        <a href="/">View Store</a>`,
  `        )}\n        {staffRole === "admin" && (\n          <button className={tab === "staff" ? "on" : ""} onClick={() => setTab("staff")}>\n            <ShieldCheck /> Staff & Permissions\n          </button>\n        )}\n        <a href="/">View Store</a>`,
  "staff navigation"
);

replaceOnce(
  `: tab === "orders"\n                ? "Customer Orders"`,
  `: tab === "staff"\n                  ? "Staff & Permissions"\n                : tab === "orders"\n                ? "Customer Orders"`,
  "staff page heading"
);

replaceOnce(
  `  if (!session)\n    return (`,
  `  if (!session)\n    return (`,
  "login guard"
);

replaceOnce(
  `  return (\n    <main className="admin">\n      <aside>`,
  `  if (session && staffRole === "loading") return <main className="admin"><section className="admin-loading"><h1>Verifying staff access…</h1></section></main>;\n  if (session && staffRole === "unauthorized") return <main className="admin"><section className="admin-loading"><h1>Access denied</h1><p>{notice || "This account is not authorized for Shree Gauri administration."}</p><button onClick={() => supabase.auth.signOut()}>Sign out</button></section></main>;\n  if (session && needsPasswordSetup) return (\n    <main className="admin-login"><form onSubmit={saveStaffPassword}><div className="admin-login-brand"><img src="/shree-gauri-logo.png" alt="Shree Gauri" /><span>SHREE GAURI</span><small>STAFF ACCOUNT SETUP</small></div><h1>Create your password</h1><p>Use at least 12 characters. Keep this password private.</p><label>New password<input type="password" minLength={12} autoComplete="new-password" value={newStaffPassword} onChange={(e) => setNewStaffPassword(e.target.value)} required /></label>{notice && <p>{notice}</p>}<button>SET PASSWORD</button></form></main>\n  );\n  return (\n    <main className="admin">\n      <aside>`,
  "staff authorization guards"
);

const staffPanel = `        {tab === "staff" && staffRole === "admin" && (\n          <div className="staff-admin">\n            <section className="staff-intro"><ShieldCheck /><div><h2>Main administrator controls</h2><p>Invite staff by email and grant only the access they need. Only the main admin can invite or revoke staff and delete customer/order records.</p></div></section>\n            <form className="staff-invite-form" onSubmit={inviteStaff}>\n              <h2><UserPlus /> Invite staff member</h2>\n              <label>Staff email<input type="email" value={staffEmail} onChange={(e) => setStaffEmail(e.target.value)} placeholder="staff@example.com" required /></label>\n              <label>Access role<select value={staffInviteRole} onChange={(e) => setStaffInviteRole(e.target.value)}><option value="orders">Orders & fulfilment</option><option value="support">Customer support</option><option value="catalog">Products & catalogue</option><option value="manager">Store manager</option></select></label>\n              <button><UserPlus /> SEND SECURE INVITATION</button>\n            </form>\n            <section className="staff-list"><h2>Team access</h2>{staffRows.length ? staffRows.map((member) => <article key={member.user_id}><div><b>{member.email}</b><small>{({admin:"Main administrator",manager:"Store manager",orders:"Orders & fulfilment",support:"Customer support",catalog:"Products & catalogue"} as Record<string,string>)[member.role] || member.role} · Added {new Date(member.created_at).toLocaleDateString("en-IN")}</small></div>{member.role !== "admin" && <button onClick={() => removeStaff(member.user_id)}><UserX /> Revoke access</button>}</article>) : <p>No staff members yet. Invite your first staff member above.</p>}</section>\n          </div>\n        )}\n`;
replaceOnce(
  `        {tab === "settings" && settings && (`,
  staffPanel + `        {tab === "settings" && staffRole === "admin" && settings && (`,
  "staff panel"
);

replaceOnce(
  `                    {customerOrders.length > 0 && (\n                      <div className="customer-admin-orders">`,
  `                    {customerOrders.length > 0 && (\n                      <div className="customer-admin-orders">`,
  "customer delete location"
);
replaceOnce(
  `                  </article>\n                );\n              }) : <div className="admin-empty"><Users/><p>No customers yet.</p></div>}`,
  `                    {staffRole === "admin" && <div className="customer-admin-actions"><button className="delete" onClick={() => deleteAdminRecord("customer", c.id)}><Trash2 /> DELETE CUSTOMER DATA</button></div>}\n                  </article>\n                );\n              }) : <div className="admin-empty"><Users/><p>No customers yet.</p></div>}`,
  "customer deletion control"
);

replaceOnce(
  `                    </select>\n                  </div>\n                </article>`,
  `                    </select>\n                    {staffRole === "admin" && <button className="delete order-delete-button" onClick={() => deleteAdminRecord("order", o.id)}><Trash2 /> DELETE ORDER</button>}\n                  </div>\n                </article>`,
  "order deletion control"
);

const stylePath = "app/globals.css";
let css = fs.readFileSync(stylePath, "utf8");
const styles = `
/* Secure staff and main-admin controls */
.staff-admin{display:flex;flex-direction:column;gap:18px}.staff-intro{display:flex;gap:16px;align-items:flex-start;background:#fff;border:1px solid #e2d7cc;padding:22px}.staff-intro>svg{width:28px;height:28px;color:#a56b19;flex-shrink:0}.staff-intro h2,.staff-invite-form h2,.staff-list h2{font:25px Georgia,serif;color:#461015;margin:0 0 8px}.staff-intro p{color:#715d58;margin:0;line-height:1.6}.staff-invite-form,.staff-list{background:#fff;border:1px solid #e2d7cc;padding:24px;display:flex;flex-direction:column;gap:16px}.staff-invite-form h2{display:flex;gap:9px;align-items:center}.staff-invite-form h2 svg{width:21px}.staff-invite-form label{display:flex;flex-direction:column;gap:7px;font-size:13px;font-weight:700;color:#674f4d}.staff-invite-form input,.staff-invite-form select{width:100%;padding:12px;border:1px solid #d9cabe;background:#fff}.staff-invite-form>button{align-self:flex-start;display:flex;align-items:center;gap:8px;background:#3b080d;color:#fff;border:0;padding:13px 17px;font-weight:800}.staff-invite-form>button svg{width:17px}.staff-list article{display:flex;justify-content:space-between;align-items:center;gap:15px;border-top:1px solid #eee4db;padding:15px 0}.staff-list article div{display:flex;flex-direction:column;gap:5px;min-width:0}.staff-list article b{overflow-wrap:anywhere}.staff-list article small{color:#806e68}.staff-list article button,.customer-admin-actions button,.order-delete-button{display:flex;align-items:center;gap:7px;border:1px solid #b52531;background:#fff;color:#a31f2a;padding:9px 12px;font-size:11px;font-weight:800}.staff-list article button svg,.customer-admin-actions svg,.order-delete-button svg{width:15px;height:15px}.customer-admin-actions{border-top:1px solid #eee3da;padding-top:14px;display:flex;justify-content:flex-end}.order-delete-button{align-self:flex-end}.admin-loading{padding:60px 24px;text-align:center}.admin-loading h1{font:30px Georgia,serif;color:#461015}.admin-loading p{color:#715d58}
`;
if (!css.includes("/* Secure staff and main-admin controls */")) fs.writeFileSync(stylePath, css + styles);
fs.writeFileSync(path, source);
console.log("Admin launch controls patched.");
