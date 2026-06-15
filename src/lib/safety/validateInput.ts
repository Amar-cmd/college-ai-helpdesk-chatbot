const MAX_CHAT_MESSAGE_LENGTH = 600;

export function validateChatMessageInput(input: unknown):
  | {
      ok: true;
      value: string;
    }
  | {
      ok: false;
      error: string;
    } {
  if (typeof input !== "string") {
    return {
      ok: false,
      error: "Message must be a valid text value.",
    };
  }

  const cleanInput = input.trim();

  if (!cleanInput) {
    return {
      ok: false,
      error: "Message cannot be empty.",
    };
  }

  if (cleanInput.length > MAX_CHAT_MESSAGE_LENGTH) {
    return {
      ok: false,
      error: `Message cannot exceed ${MAX_CHAT_MESSAGE_LENGTH} characters.`,
    };
  }

  return {
    ok: true,
    value: cleanInput,
  };
}