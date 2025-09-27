# SQL Files

This directory contains SQL scripts for database management and troubleshooting.

## Current Active Files

- `minimal-fix.sql` - **CURRENTLY ACTIVE** - Simple fix for RLS and user organization creation
- `check-database-status.sql` - Diagnostic script to check current database state

## Migration Files

- `fix-database.sql` - Comprehensive RLS and subscription fixes (superseded by minimal-fix.sql)
- `proper-rls-fix.sql` - Alternative RLS fix approach
- `better-fix-rls.sql` - Another RLS fix attempt

## Step-by-Step Fixes

- `step1-disable-rls.sql` - Disable RLS temporarily
- `step2-drop-policies.sql` - Drop existing policies
- `step3-create-policies.sql` - Create new policies
- `step4-enable-rls.sql` - Re-enable RLS

## Troubleshooting Files

- `debug-rls-status.sql` - Check RLS status and policies
- `immediate-fix.sql` - Quick fix for immediate issues
- `quick-fix-disable-rls.sql` - Quick RLS disable
- `fix-rls-policies.sql` - Fix RLS policies
- `test-org-creation.sql` - Test organization creation

## Usage

**For current setup, use:**
```sql
-- Run this in Supabase SQL Editor
\i minimal-fix.sql
```

**For diagnostics, use:**
```sql
-- Check current database state
\i check-database-status.sql
```

## Notes

- The `minimal-fix.sql` is the current working solution
- Other files are kept for reference and troubleshooting
- Always backup your database before running any SQL scripts
- Test scripts in a development environment first
