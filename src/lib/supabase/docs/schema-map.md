# Schema Map

## profiles

Purpose:
Stores application profile data for Supabase Auth users.

Main columns:
- id
- email
- full_name
- role
- created_at
- updated_at

Owner column:
- id maps to auth.users.id

RLS:
Enabled.

Access:
- Users can read their own profile.
- Admins can read all profiles.
- Admins can update profiles.
- Normal users cannot directly insert or update their own role.

Related modules:
- src/lib/auth/getCurrentUser.ts
- src/lib/auth/requireRole.ts
- src/lib/supabase/server.ts
- src/lib/supabase/client.ts