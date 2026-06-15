# Table Purpose

## profiles

The `profiles` table stores role information for authenticated users.

It is required because Supabase Auth stores login identity, but the application needs its own role system:
- student
- admin

This role is used to protect admin-only routes and later knowledge-base management features.