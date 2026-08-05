/*
# Revoke execute on handle_new_user from anon and authenticated

## Purpose
The handle_new_user() function is a SECURITY DEFINER trigger that auto-creates user profiles
on signup. It should only be called by the database trigger, not via the REST API. This revokes
EXECUTE permissions from anon and authenticated roles to prevent external invocation.

## Security Changes
- REVOKE EXECUTE on public.handle_new_user from anon, authenticated
- Function remains callable by the database trigger (runs as owner)
*/

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
