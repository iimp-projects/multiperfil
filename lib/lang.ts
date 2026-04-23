export type Lang = "es" | "en";

export const parseGoogTransCookieValue = (value?: string | null): Lang => {
  if (!value) return "es";

  // Expected formats seen in the app: "/es/en" or "\/es\/en" (cookie-decoded)
  const trimmed = value.trim();
  const match = trimmed.match(/^\/[^/]+\/([^/]+)$/);
  const target = (match?.[1] || "").toLowerCase();
  return target === "en" ? "en" : "es";
};
