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

type AuthUserLookupResult =
  | {
      ok: true;
      userId: string | null;
    }
  | {
      ok: false;
      error: string;
    };

const GUEST_FULL_NAME = "AI Buddy Guest Student";

export function isGuestChatEnabled() {
  return AUTH_BYPASS_CONFIG.enabled;
}

function getAdminClientOrError() {
  const supabase = createAdminClient();

  if (!supabase) {
    return {
      ok: false as const,
      error:
        "Supabase service role is not configured. Set SUPABASE_SERVICE_ROLE_KEY in the server environment.",
    };
  }

  return {
    ok: true as const,
    supabase,
  };
}

async function getProfileById(profileId: string): Promise<GuestProfileResult> {
  const clientResult = getAdminClientOrError();

  if (!clientResult.ok) {
    return {
      ok: false,
      error: clientResult.error,
    };
  }

  const { data, error } = await clientResult.supabase
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
        "Guest profile was not found for PUBLIC_CHAT_GUEST_USER_ID. Falling back to guest email setup.",
    };
  }

  return {
    ok: true,
    data,
  };
}

async function findAuthUserIdByEmail(
  email: string
): Promise<AuthUserLookupResult> {
  const clientResult = getAdminClientOrError();

  if (!clientResult.ok) {
    return {
      ok: false,
      error: clientResult.error,
    };
  }

  const normalizedEmail = email.trim().toLowerCase();

  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await clientResult.supabase.auth.admin.listUsers({
      page,
      perPage: 100,
    });

    if (error) {
      return {
        ok: false,
        error: error.message,
      };
    }

    const matchingUser = data.users.find(
      (user) => user.email?.trim().toLowerCase() === normalizedEmail
    );

    if (matchingUser) {
      return {
        ok: true,
        userId: matchingUser.id,
      };
    }

    if (data.users.length < 100) {
      break;
    }
  }

  return {
    ok: true,
    userId: null,
  };
}

async function createGuestAuthUser(email: string): Promise<AuthUserLookupResult> {
  const clientResult = getAdminClientOrError();

  if (!clientResult.ok) {
    return {
      ok: false,
      error: clientResult.error,
    };
  }

  const randomPassword = `${crypto.randomUUID()}-${crypto.randomUUID()}`;

  const { data, error } = await clientResult.supabase.auth.admin.createUser({
    email,
    password: randomPassword,
    email_confirm: true,
    user_metadata: {
      full_name: GUEST_FULL_NAME,
    },
  });

  if (error) {
    const normalizedMessage = error.message.toLowerCase();

    if (
      normalizedMessage.includes("already") ||
      normalizedMessage.includes("registered") ||
      normalizedMessage.includes("exists") ||
      normalizedMessage.includes("duplicate")
    ) {
      return findAuthUserIdByEmail(email);
    }

    return {
      ok: false,
      error: error.message,
    };
  }

  if (!data.user) {
    return {
      ok: false,
      error: "Guest auth user could not be created.",
    };
  }

  return {
    ok: true,
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
  const clientResult = getAdminClientOrError();

  if (!clientResult.ok) {
    return {
      ok: false,
      error: clientResult.error,
    };
  }

  const { data, error } = await clientResult.supabase
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

async function ensureGuestProfileByEmail(): Promise<GuestProfileResult> {
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

  const createdUserResult = await createGuestAuthUser(guestEmail);

  if (!createdUserResult.ok) {
    return {
      ok: false,
      error: createdUserResult.error,
    };
  }

  if (!createdUserResult.userId) {
    return {
      ok: false,
      error: "Guest auth user could not be resolved.",
    };
  }

  return upsertGuestProfile({
    userId: createdUserResult.userId,
    email: guestEmail,
  });
}

export async function ensureGuestProfile(): Promise<GuestProfileResult> {
  if (!isGuestChatEnabled()) {
    return {
      ok: false,
      error: "Guest chat is not enabled.",
    };
  }

  if (AUTH_BYPASS_CONFIG.guestUserId) {
    const profileByIdResult = await getProfileById(
      AUTH_BYPASS_CONFIG.guestUserId
    );

    if (profileByIdResult.ok) {
      return profileByIdResult;
    }

    console.warn(profileByIdResult.error);
  }

  return ensureGuestProfileByEmail();
}