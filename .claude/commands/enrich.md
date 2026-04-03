---
name: enrich
description: Manage the data enrichment pipeline — run migrations, test enrichment, check status, or refresh accounts
disable-model-invocation: true
argument-hint: [setup|status|refresh <connectionId>|test-scrape <platform> <username>|migrate]
allowed-tools: Bash(npm *), Bash(npx *), Bash(curl *), Bash(psql *), Read, Grep
---

You are managing the Armadillo Analytics data enrichment pipeline.

## Context
- Neon PostgreSQL is connected via `DATABASE_URL` in environment variables
- Anthropic API is available via `ANTHROPIC_API_KEY`
- Apify scraping keys are in `APIFY_API_KEY` (with platform-specific fallbacks)
- Schema lives in `sql/001_enrichment_schema.sql`
- Core enrichment logic is in `src/lib/db/enrichment.ts`
- DB queries are in `src/lib/db/queries.ts`
- API routes: `GET/POST /api/enrichment` (on-demand), `GET /api/cron/enrich` (scheduled batch)

## Commands

Based on `$ARGUMENTS`, do the following:

### `migrate`
Run the SQL schema against the Neon database:
```
psql "$DATABASE_URL" -f sql/001_enrichment_schema.sql
```
Report which tables were created.

### `setup`
1. Run the migration (same as `migrate`)
2. Verify all required env vars are set: `DATABASE_URL`, `ANTHROPIC_API_KEY`, `APIFY_API_KEY`
3. Test the DB connection by running `SELECT count(*) FROM user_accounts`
4. Report readiness status

### `status`
Query the database for:
- Number of user accounts and platform connections
- Latest refresh log entries (last 5)
- Number of cached insights and their expiry status
- Any failed refreshes in the last 24 hours

### `refresh <connectionId>`
Trigger on-demand enrichment for a specific connection by calling:
```
curl -X POST http://localhost:3000/api/enrichment -H 'Content-Type: application/json' -d '{"connectionId": "<connectionId>"}'
```
Report the result.

### `test-scrape <platform> <username>`
Test the scraping + normalization pipeline without saving to DB. Use the existing Apify integration to scrape the account, normalize the data, and display a summary of what was found (profile info, post count, engagement stats).

### No arguments / `help`
List the available subcommands with a brief description of each.
