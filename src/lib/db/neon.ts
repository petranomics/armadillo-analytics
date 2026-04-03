import { neon } from '@neondatabase/serverless';

function getConnectionString() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  return url;
}

/** Tagged-template SQL client — returns rows directly. */
export function getDb() {
  return neon(getConnectionString());
}
