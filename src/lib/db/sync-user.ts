import { getDb } from './neon';
import type { DbUserAccount } from './types';

/**
 * Ensures a Clerk user has a corresponding row in user_accounts.
 * Called on first page load after sign-in. Idempotent.
 */
export async function syncClerkUser(clerkUserId: string, opts: {
  displayName: string;
  email?: string | null;
}): Promise<DbUserAccount> {
  const sql = getDb();

  // Try clerk_id first, then email
  const existing = await sql`
    SELECT * FROM user_accounts
    WHERE clerk_id = ${clerkUserId} OR email = ${opts.email ?? null}
    LIMIT 1
  `;

  if (existing.length > 0) {
    const row = existing[0] as DbUserAccount;
    // Backfill clerk_id if missing
    if (!row.clerk_id) {
      await sql`UPDATE user_accounts SET clerk_id = ${clerkUserId} WHERE id = ${row.id}`;
      row.clerk_id = clerkUserId;
    }
    return row;
  }

  // Create new account
  const rows = await sql`
    INSERT INTO user_accounts (display_name, email, clerk_id, user_type, plan, beta_status)
    VALUES (${opts.displayName}, ${opts.email ?? null}, ${clerkUserId}, 'influencer', 'free', 'none')
    ON CONFLICT (email) DO UPDATE SET
      display_name = EXCLUDED.display_name,
      clerk_id = COALESCE(user_accounts.clerk_id, EXCLUDED.clerk_id)
    RETURNING *
  `;

  return rows[0] as DbUserAccount;
}

/**
 * Get the user_accounts row for a given email.
 */
export async function getUserAccountByEmail(email: string): Promise<DbUserAccount | null> {
  const sql = getDb();
  const rows = await sql`
    SELECT * FROM user_accounts WHERE email = ${email} LIMIT 1
  `;
  return (rows[0] as DbUserAccount) ?? null;
}

/**
 * Get beta access status for a Clerk user.
 */
export async function getBetaStatus(clerkUserId: string): Promise<{ status: string; maxPlatforms: number }> {
  const sql = getDb();
  const rows = await sql`
    SELECT u.beta_status, COALESCE(b.max_platforms, 3) as max_platforms
    FROM user_accounts u
    LEFT JOIN beta_requests b ON b.clerk_id = u.clerk_id AND b.status = 'approved'
    WHERE u.clerk_id = ${clerkUserId}
    LIMIT 1
  `;
  if (rows.length === 0) return { status: 'none', maxPlatforms: 3 };
  return {
    status: (rows[0] as { beta_status: string }).beta_status || 'none',
    maxPlatforms: Number((rows[0] as { max_platforms: number }).max_platforms) || 3,
  };
}
