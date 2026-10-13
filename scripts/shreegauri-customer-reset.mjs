#!/usr/bin/env node
/**
 * SHREE GAURI CUSTOMER/ORDER RESET
 *
 * Safety gates:
 *  1) Creates and verifies a local JSON backup before any destructive action.
 *  2) Runs a read-only dry run.
 *  3) Requires --execute --confirm-reset to perform deletion.
 *
 * IMPORTANT:
 * - Run with SUPABASE_SERVICE_ROLE_KEY, never the public/anon key.
 * - Backup files contain customer data. They are gitignored and must NOT be committed.
 * - This script intentionally does not run during `next build`.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "https://hhtqnpxarrbagyvswqrj.supabase.co";
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const args = new Set(process.argv.slice(2));
const execute = args.has("--execute");
const confirm = args.has("--confirm-reset");

if (!SERVICE_ROLE) {
  console.error("ABORTED: SUPABASE_SERVICE_ROLE_KEY is required.");
  console.error("Use the Supabase service-role secret locally. Never commit it to GitHub or expose it to the browser.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupDir = path.resolve("backups");
const backupFile = path.join(backupDir, `shreegauri-reset-${stamp}.json`);

const candidateTables = [
  "customers",
  "customer_addresses",
  "orders",
  "order_items",
  "return_requests",
  "abandoned_carts"
];

async function readAll(table) {
  const pageSize = 1000;
  let offset = 0;
  const rows = [];
  while (true) {
    const { data, error } = await supabase.from(table).select("*").range(offset, offset + pageSize - 1);
    if (error) {
      if (error.code === "42P01" || /relation .* does not exist/i.test(error.message || "")) {
        return { exists: false, rows: [], error: null };
      }
      return { exists: true, rows, error };
    }
    rows.push(...(data || []));
    if (!data || data.length < pageSize) break;
    offset += pageSize;
  }
  return { exists: true, rows, error: null };
}

async function listAuthUsers() {
  const users = [];
  let page = 1;
  const perPage = 1000;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const batch = data?.users || [];
    users.push(...batch);
    if (batch.length < perPage) break;
    page++;
  }
  return users;
}

function getAdminAuthIds(adminRows, authUsers) {
  const authIds = new Set(authUsers.map(u => u.id));
  const keys = ["auth_user_id", "user_id", "auth_id", "userId", "authUserId"];
  const ids = new Set();

  for (const row of adminRows) {
    for (const key of keys) {
      const value = row?.[key];
      if (typeof value === "string" && authIds.has(value)) ids.add(value);
    }
    // Some installations use the admin record's `id` as the auth user id.
    if (typeof row?.id === "string" && authIds.has(row.id)) ids.add(row.id);
  }
  return [...ids];
}

async function countExisting(table) {
  const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true });
  if (error) {
    if (error.code === "42P01" || /relation .* does not exist/i.test(error.message || "")) {
      return { exists: false, count: 0 };
    }
    throw error;
  }
  return { exists: true, count: count ?? 0 };
}

async function backupAndDryRun() {
  const authUsers = await listAuthUsers();

  // Protect real staff identities from public.admin_users, which is the
  // table checked by private.is_admin() and the live RLS policies.
  const staffResult = await readAll("admin_users");
  if (staffResult.error) throw staffResult.error;
  if (!staffResult.exists || staffResult.rows.length === 0) {
    throw new Error("ABORTED: public.admin_users is missing or empty. Main-admin protection cannot be verified.");
  }
  const adminAuthIds = getAdminAuthIds(staffResult.rows, authUsers);
  if (adminAuthIds.length === 0) {
    throw new Error("ABORTED: no admin_users identity matched an auth user. Refusing to risk deleting the main administrator.");
  }

  const adminResult = await readAll("admins");
  if (adminResult.error) throw adminResult.error;

  const backup = {
    generated_at: new Date().toISOString(),
    supabase_url: SUPABASE_URL,
    warning: "CONFIDENTIAL CUSTOMER DATA. DO NOT COMMIT THIS FILE.",
    tables: {},
    auth_users: authUsers,
    admins: adminResult.rows,
    admin_users: staffResult.rows,
    admin_auth_ids: adminAuthIds
  };

  const counts = {};
  for (const table of candidateTables) {
    const result = await readAll(table);
    if (result.error) throw result.error;
    backup.tables[table] = result.exists ? result.rows : null;
    counts[table] = result.exists ? result.rows.length : 0;
  }

  await fs.mkdir(backupDir, { recursive: true });
  await fs.writeFile(backupFile, JSON.stringify(backup, null, 2), "utf8");

  const stat = await fs.stat(backupFile);
  if (stat.size < 2) throw new Error("ABORTED: backup verification failed; backup file is empty.");
  const verification = JSON.parse(await fs.readFile(backupFile, "utf8"));
  if (!verification.auth_users || !verification.admins || !verification.admin_users || !verification.tables) {
    throw new Error("ABORTED: backup verification failed; expected sections are missing.");
  }

  console.log("\n=== SHREE GAURI RESET — BACKUP VERIFIED ===");
  console.log(`Backup: ${backupFile}`);
  console.log(`Backup size: ${stat.size} bytes`);

  console.log("\n=== DRY RUN — NO DATA CHANGED ===");
  for (const [table, count] of Object.entries(counts)) {
    console.log(`${table.padEnd(22)} ${count}`);
  }
  console.log(`auth users total       ${authUsers.length}`);
  console.log(`admin auth users KEEP  ${adminAuthIds.length}`);
  console.log(`customer auth users DEL ${authUsers.filter(u => !adminAuthIds.includes(u.id)).length}`);

  console.log("\nProtected: admins, products, categories, coupons, payment configuration, site configuration.");
  console.log("RLS/table structure are not changed by this tool.");

  if (!execute || !confirm) {
    console.log("\nDRY RUN COMPLETE. Nothing was deleted.");
    console.log("To execute, first review the report and then run:");
    console.log("  npm run sg:reset -- --execute --confirm-reset");
    return;
  }

  await executeReset(backup, counts, adminAuthIds);
}

async function deleteAll(table) {
  const { error } = await supabase.from(table).delete().not("id", "is", null);
  if (error) throw new Error(`${table}: ${error.message}`);
}

async function executeReset(backup, counts, adminAuthIds) {
  console.log("\n=== EXECUTION STARTING ===");
  console.log("Backup exists and was verified. Dry run completed.");
  console.log("Deleting only customer/order data...");

  // Child records first.
  for (const table of ["order_items", "customer_addresses", "return_requests", "abandoned_carts", "orders", "customers"]) {
    if (backup.tables[table] !== null && counts[table] > 0) {
      await deleteAll(table);
      console.log(`Cleared ${table}: ${counts[table]}`);
    }
  }

  const authUsers = backup.auth_users || [];
  const adminSet = new Set(adminAuthIds);
  for (const user of authUsers) {
    if (adminSet.has(user.id)) continue;
    const { error } = await supabase.auth.admin.deleteUser(user.id);
    if (error) throw new Error(`auth user ${user.id}: ${error.message}`);
  }

  // Final verification.
  for (const table of ["orders", "customer_addresses", "return_requests", "abandoned_carts", "customers"]) {
    const result = await countExisting(table);
    if (result.exists && result.count !== 0) {
      throw new Error(`POST-RESET VERIFICATION FAILED: ${table} still contains ${result.count} records.`);
    }
  }

  const remainingAuth = await listAuthUsers();
  const remainingAdmins = getAdminAuthIds(backup.admin_users, remainingAuth);
  if (remainingAdmins.length !== adminAuthIds.length) {
    throw new Error("POST-RESET VERIFICATION FAILED: admin authentication count changed.");
  }

  console.log("\n=== RESET SUCCESSFUL ===");
  console.log("Customer/order data is cleared.");
  console.log(`Admin auth users preserved: ${adminAuthIds.length}`);
  console.log(`Backup retained at: ${backupFile}`);
  console.log("\nIMPORTANT: Do not commit the backup file to GitHub.");
}

backupAndDryRun().catch(err => {
  console.error("\nRESET ABORTED — NO FURTHER DESTRUCTIVE OPERATIONS WILL RUN.");
  console.error(err?.stack || err);
  process.exit(1);
});
