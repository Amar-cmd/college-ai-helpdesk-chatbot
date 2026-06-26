const GUEST_CLIENT_ID_KEY = "aiBuddy.guestClientId";
const GUEST_SESSION_ID_KEY = "aiBuddy.guestSessionId";

function canUseSessionStorage() {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

function createClientId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `guest-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function getOrCreateGuestClientId() {
  if (!canUseSessionStorage()) {
    return createClientId();
  }

  const existingClientId = window.sessionStorage.getItem(GUEST_CLIENT_ID_KEY);

  if (existingClientId) {
    return existingClientId;
  }

  const clientId = createClientId();
  window.sessionStorage.setItem(GUEST_CLIENT_ID_KEY, clientId);

  return clientId;
}

export function getStoredGuestSessionId() {
  if (!canUseSessionStorage()) {
    return null;
  }

  return window.sessionStorage.getItem(GUEST_SESSION_ID_KEY);
}

export function storeGuestSessionId(sessionId: string) {
  if (!canUseSessionStorage()) {
    return;
  }

  window.sessionStorage.setItem(GUEST_SESSION_ID_KEY, sessionId);
}

export function clearGuestChatSession() {
  if (!canUseSessionStorage()) {
    return;
  }

  window.sessionStorage.removeItem(GUEST_SESSION_ID_KEY);
}