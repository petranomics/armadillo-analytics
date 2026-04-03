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

  // Check if user already exists (we store clerk_id in the id field won't work —
  // we need a clerk_id column. But to avoid a migration right now, we use email as the lookup key.)
  // Actually, let's add a clerk_id lookup. First check by email, then upsert.
  const existing = await sql`
    SELECT * FROM user_accounts WHERE email = ${opts.email ?? null} LIMIT 1
  `;

  if (existing.length > 0) {
    return existing[0] as DbUserAccount;
  }

  // Create new account — default to 'influencer' free plan, user can change in onboarding
  const rows = await sql`
    INSERT INTO user_accounts (display_name, email, user_type, plan)
    VALUES (${opts.displayName}, ${opts.email ?? null}, 'influencer', 'free')
    ON CONFLICT (email) DO UPDATE SET display_name = EXCLUDED.display_name
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
