---
name: db-verify
description: Verify database schema changes and data persistence with Prisma - client regeneration, migrations, and cache clearing
---

# Database Persistence Verification

After making database schema changes or data persistence work, explicitly verify that data survives server restarts before marking the task complete.

## Verification Steps

1. **Regenerate Prisma client**
   ```bash
   pnpm prisma generate
   ```

2. **Apply migrations**
   ```bash
   pnpm prisma migrate deploy
   ```

3. **Write test data to the database**
   - Insert test records
   - Verify the write succeeds

4. **Restart the development server**
   - Stop the server
   - Start it again

5. **Query the database to verify data persists**
   - Check that test data still exists
   - Verify relationships and constraints

6. **Clear any Redis/application cache**
   - Flush Redis if applicable
   - Clear application cache
   - Verify cache doesn't mask persistence issues

## Common Issues

- Stale Prisma client causing errors
- Migrations not applied correctly
- Cache masking data loss
- Data written but not persisting after restart

---

## Execution

When invoked, systematically run through each verification step. Report the results of each step before marking the database task complete. Do not skip any steps.
