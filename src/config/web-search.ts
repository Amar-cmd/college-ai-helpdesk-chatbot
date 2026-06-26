function isEnabled(value: string | undefined, defaultValue = false) {
  if (value === undefined) {
    return defaultValue;
  }

  return value === "true";
}

function getPositiveInteger(value: string | undefined, defaultValue: number) {
  if (!value) {
    return defaultValue;
  }

  const parsedValue = Number.parseInt(value, 10);

  if (Number.isNaN(parsedValue) || parsedValue <= 0) {
    return defaultValue;
  }

  return parsedValue;
}

function parseCsv(value: string | undefined) {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export const WEB_SEARCH_CONFIG = {
  enabled: isEnabled(
    process.env.ENABLE_WEB_SEARCH_FALLBACK,
    Boolean(process.env.BRAVE_SEARCH_API_KEY)
  ),
  provider: "brave",
  braveApiKey: process.env.BRAVE_SEARCH_API_KEY || "",
  resultLimit: Math.min(
    getPositiveInteger(process.env.WEB_SEARCH_RESULT_LIMIT, 5),
    8
  ),
  timeoutMs: getPositiveInteger(process.env.WEB_SEARCH_TIMEOUT_MS, 7000),
  siteHints: parseCsv(
    process.env.WEB_SEARCH_SITE_HINTS || "ims-ghaziabad.ac.in"
  ),
  allowedDomains: parseCsv(process.env.WEB_SEARCH_ALLOWED_DOMAINS),
} as const;