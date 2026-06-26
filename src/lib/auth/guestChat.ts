import "server-only";

import { AUTH_BYPASS_CONFIG } from "@/config/auth-bypass";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile } from "@/types/database";

type GuestProfileResult =
  | {
      ok: true;
      data: Profile;
    }
  | {
      ok: false;
      error: string;
    };

const GUEST_FULL_NAME = "AI Buddy Guest Student";

export function isGuestChatEnabled() {
  return AUTH_BYPASS_CONFIG.enabled;
}

async function getProfileById(profileId: string): Promise<GuestProfileResult> {
  const supabase = createAdminClient();

  if (!supabase) {
    return {
      ok: false,
      error: "Supabase service role is not configured.",
    };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, created_at, updated_at")
    .eq("id", profileId)
    .maybeSingle();

  if (error) {
    return {
      ok: false,
      error: error.message,
    };
  }

  if (!data) {
    return {
      ok: false,
      error:
        "Guest profile was not found. PUBLIC_CHAT_GUEST_USER_ID must match an existing Supabase Auth user profile.",
    };
  }

  return {
    ok: true,
    data,
  };
}

async function findAuthUserIdByEmail(email: string) {
  const supabase = createAdminClient();

  if (!supabase) {
    return {
      ok: false as const,
      error: "Supabase service role is not configured.",
    };
  }

  const normalizedEmail = email.trim().toLowerCase();

  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 100,
    });

    if (error) {
      return {
        ok: false as const,
        error: error.message,
      };
    }

    const matchingUser = data.users.find(
      (user) => user.email?.trim().toLowerCase() === normalizedEmail
    );

    if (matchingUser) {
      return {
        ok: true as const,
        userId: matchingUser.id,
      };
    }

    if (data.users.length < 100) {
      break;
    }
  }

  return {
    ok: true as const,
    userId: null,
  };
}

async function createGuestAuthUser(email: string) {
  const supabase = createAdminClient();

  if (!supabase) {
    return {
      ok: false as const,
      error: "Supabase service role is not configured.",
    };
  }

  const randomPassword = `${crypto.randomUUID()}-${crypto.randomUUID()}`;

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: randomPassword,
    email_confirm: true,
    user_metadata: {
      full_name: GUEST_FULL_NAME,
    },
  });

  if (error) {
    return {
      ok: false as const,
      error: error.message,
    };
  }

  if (!data.user) {
    return {
      ok: false as const,
      error: "Guest auth user could not be created.",
    };
  }

  return {
    ok: true as const,
    userId: data.user.id,
  };
}

async function upsertGuestProfile({
  userId,
  email,
}: {
  userId: string;
  email: string;
}): Promise<GuestProfileResult> {
  const supabase = createAdminClient();

  if (!supabase) {
    return {
      ok: false,
      error: "Supabase service role is not configured.",
    };
  }

  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: userId,
        email,
        full_name: GUEST_FULL_NAME,
        role: "student",
      },
      {
        onConflict: "id",
      }
    )
    .select("id, email, full_name, role, created_at, updated_at")
    .single();

  if (error) {
    return {
      ok: false,
      error: error.message,
    };
  }

  return {
    ok: true,
    data,
  };
}

// export async function ensureGuestProfile(): Promise<GuestProfileResult> {
//   if (!isGuestChatEnabled()) {
//     return {
//       ok: false,
//       error: "Guest chat is not enabled.",
//     };
//   }

//   if (AUTH_BYPASS_CONFIG.guestUserId) {
//     return getProfileById(AUTH_BYPASS_CONFIG.guestUserId);
//   }

//   const guestEmail = AUTH_BYPASS_CONFIG.guestEmail;

//   const existingUserResult = await findAuthUserIdByEmail(guestEmail);

//   if (!existingUserResult.ok) {
//     return {
//       ok: false,
//       error: existingUserResult.error,
//     };
//   }

//   const userId =
//     existingUserResult.userId ??
//     (await createGuestAuthUser(guestEmail)).ok
//       ? existingUserResult.userId
//       : null;

//   if (userId) {
//     return upsertGuestProfile({
//       userId,
//       email: guestEmail,
//     });
//   }

//   const createUserResult = await createGuestAuthUser(guestEmail);

//   if (!createUserResult.ok) {
//     return {
//       ok: false,
//       error: createUserResult.error,
//     };
//   }

//   return upsertGuestProfile({
//     userId: createUserResult.userId,
//     email: guestEmail,
//   });
// }

export async function ensureGuestProfile(): Promise<GuestProfileResult> {
  if (!isGuestChatEnabled()) {
    return {
      ok: false,
      error: "Guest chat is not enabled.",
    };
  }

  if (AUTH_BYPASS_CONFIG.guestUserId) {
    return getProfileById(AUTH_BYPASS_CONFIG.guestUserId);
  }

  const guestEmail = AUTH_BYPASS_CONFIG.guestEmail;

  const existingUserResult = await findAuthUserIdByEmail(guestEmail);

  if (!existingUserResult.ok) {
    return {
      ok: false,
      error: existingUserResult.error,
    };
  }

  if (existingUserResult.userId) {
    return upsertGuestProfile({
      userId: existingUserResult.userId,
      email: guestEmail,
    });
  }

  const createUserResult = await createGuestAuthUser(guestEmail);

  if (!createUserResult.ok) {
    return {
      ok: false,
      error: createUserResult.error,
    };
  }

  return upsertGuestProfile({
    userId: createUserResult.userId,
    email: guestEmail,
  });
}