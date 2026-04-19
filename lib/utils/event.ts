/**
 * Generates a dynamic event code based on the current vertical and year.
 * Format: VERTICAL_UPPERCASE + LAST_2_DIGITS_OF_YEAR (e.g., PROEXPLO26)
 */
export const getDynamicEventCode = (vertical: string = "proexplo"): string => {
  const yearSuffix = new Date().getFullYear().toString().slice(-2);
  const normalizedVertical = (vertical || "proexplo").toUpperCase();
  return `${normalizedVertical}${yearSuffix}`;
};
