import type { User } from "firebase/auth";

function normalizeEmail(value: string | null | undefined) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

const ADMIN_EMAILS = [
  process.env.EXPO_PUBLIC_ADMIN_EMAIL,
  process.env.EXPO_PUBLIC_ADMIN_TEST_EMAIL,
  "david.lerettejr@gmail.com",
]
  .map(normalizeEmail)
  .filter(Boolean);

const PRIMARY_ADMIN_EMAIL = ADMIN_EMAILS[0] || "";
const ADMIN_UID = String(process.env.EXPO_PUBLIC_ADMIN_UID || "").trim();

export function isAuthorizedAdmin(user: Pick<User, "uid" | "email"> | null | undefined) {
  if (!user) return false;

  const email = normalizeEmail(user.email);

  const uidMatches = ADMIN_UID ? user.uid === ADMIN_UID : false;
  const emailMatches = ADMIN_EMAILS.includes(email);

  // If both are configured, require both for the strongest single-admin lock.
  if (ADMIN_UID && PRIMARY_ADMIN_EMAIL) return uidMatches && emailMatches;
  if (ADMIN_UID) return uidMatches;
  if (PRIMARY_ADMIN_EMAIL) return emailMatches;

  return false;
}

export function isConfiguredAdminEmail(email: string | null | undefined) {
  if (!PRIMARY_ADMIN_EMAIL) return false;
  return ADMIN_EMAILS.includes(normalizeEmail(email));
}

export function getAdminIdentityHint() {
  if (PRIMARY_ADMIN_EMAIL) return PRIMARY_ADMIN_EMAIL;
  if (ADMIN_UID) return `uid:${ADMIN_UID}`;
  return "not-configured";
}
