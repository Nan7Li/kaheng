/** Identity values that may be used to bind the admin area to one account. */
export type AdminIdentity = {
  id: string;
  email: string | null;
};

export type AdminConfig = {
  userId?: string;
  email?: string;
};

/**
 * Compare a verified session identity with the deployment's admin allowlist.
 * Email matching is deliberately case-insensitive; user ids remain exact.
 */
export function isAdminIdentity(
  identity: AdminIdentity | null,
  config: AdminConfig,
): boolean {
  if (!identity) return false;
  const userId = config.userId?.trim();
  const email = config.email?.trim().toLowerCase();
  return Boolean(
    (userId && identity.id === userId) ||
      (email && identity.email?.trim().toLowerCase() === email),
  );
}

