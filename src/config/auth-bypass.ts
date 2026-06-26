function isEnabled(value: string | undefined) {
  return value === "true";
}

function getOptionalEnv(value: string | undefined) {
  const trimmedValue = value?.trim();

  return trimmedValue ? trimmedValue : null;
}

export const AUTH_BYPASS_CONFIG = {
  enabled: isEnabled(process.env.AUTH_BYPASS_ENABLED),
  guestUserId: getOptionalEnv(process.env.PUBLIC_CHAT_GUEST_USER_ID),
  guestEmail:
    getOptionalEnv(process.env.PUBLIC_CHAT_GUEST_EMAIL) ?? "guest@ai-buddy.local",
} as const;