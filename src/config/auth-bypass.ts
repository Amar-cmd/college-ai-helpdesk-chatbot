function isEnabled(value: string | undefined) {
  return value === "true";
}

function getOptionalEnv(value: string | undefined) {
  const trimmedValue = value?.trim();

  if (!trimmedValue) {
    return null;
  }

  if (
    trimmedValue === "null" ||
    trimmedValue === "undefined" ||
    trimmedValue === "00000000-0000-4000-8000-000000000001"
  ) {
    return null;
  }

  return trimmedValue;
}

export const AUTH_BYPASS_CONFIG = {
  enabled: isEnabled(process.env.AUTH_BYPASS_ENABLED),
  guestUserId: getOptionalEnv(process.env.PUBLIC_CHAT_GUEST_USER_ID),
  guestEmail:
    getOptionalEnv(process.env.PUBLIC_CHAT_GUEST_EMAIL) ?? "guest@ai-buddy.local",
} as const;