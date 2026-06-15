export function getCacheTtlHours() {
  const rawValue = process.env.CACHE_TTL_HOURS;
  const parsedValue = Number(rawValue);

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return 24;
  }

  return parsedValue;
}

export function getCacheExpiryDate() {
  const expiryDate = new Date();
  expiryDate.setHours(expiryDate.getHours() + getCacheTtlHours());

  return expiryDate;
}