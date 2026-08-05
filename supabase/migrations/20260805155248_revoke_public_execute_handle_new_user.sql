/*
# Revoke PUBLIC execute on handle_new_user

## Purpose
PostgreSQL grants EXECUTE on functions to PUBLIC by default. The previous REVOKE from
anon/authenticated was insufficient. This revokes from PUBLIC and re-grants only to
the postgres (service) role so the trigger can still fire.

## Security
- REVOKE EXECUTE FROM PUBLIC on handle_new_user
- Function remains callable by the database owner (trigger runs as function owner)
*/

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
