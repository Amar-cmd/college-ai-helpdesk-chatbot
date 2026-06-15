# Migration Log

## 0001_init_profiles.sql

Date:
2026-06-15

Feature:
Auth and roles foundation.

Reason:
The app needs student/admin roles before chat, admin knowledge base, and RLS-protected data can be built.

Tables affected:
- public.profiles

RLS changed:
Yes. RLS enabled on profiles.

Indexes added:
No extra indexes.

Destructive:
No.

Sanity checks:
- Check profiles table exists.
- Check RLS is enabled.
- Check policies exist.
- Create a test user from the app and confirm profile row is created.

Rollback notes:
Drop trigger on auth.users first, then drop functions, then drop public.profiles if no dependent tables exist.