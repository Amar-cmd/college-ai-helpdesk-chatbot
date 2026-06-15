import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

type GetCurrentUserResult = {
  user: {
    id: string;
    email?: string;
  } | null;
  profile: Profile | null;
  error: string | null;
};

export async function getCurrentUser(): Promise<GetCurrentUserResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      user: null,
      profile: null,
      error: userError?.message ?? "User is not authenticated.",
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, created_at, updated_at")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return {
      user: {
        id: user.id,
        email: user.email,
      },
      profile: null,
      error: profileError.message,
    };
  }

  if (!profile) {
    return {
      user: {
        id: user.id,
        email: user.email,
      },
      profile: {
        id: user.id,
        email: user.email ?? "",
        full_name: null,
        role: "student",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      error: null,
    };
  }

  return {
    user: {
      id: user.id,
      email: user.email,
    },
    profile,
    error: null,
  };
}