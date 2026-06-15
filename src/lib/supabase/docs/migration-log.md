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

## 0002_fix_profiles_admin_policy_recursion.sql

Date:
2026-06-15

Feature:
Auth/profile RLS fix.

Reason:
The earlier admin policies checked admin role by querying profiles from inside profiles policies. This can cause recursive RLS evaluation and break profile reads after login.

Tables affected:
- public.profiles

RLS changed:
Yes. Admin read/update policies were recreated using public.is_admin(auth.uid()).

Indexes added:
None.

Destructive:
No.

Sanity checks:
- Login as a student.
- Open /chat.
- Confirm the user does not get redirected back to /login.
- Login as admin.
- Open /admin/knowledge.

Rollback notes:
Drop recreated admin policies and public.is_admin(uuid) if rollback is required.