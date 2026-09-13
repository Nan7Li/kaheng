/**
 * Optional Grok broker identity providers kept for the template's non-admin
 * Better Auth integration.
 *
 * The Kaheng admin area does not use these providers: /login sends the account
 * and password to the server-side admin login endpoint instead. Keep this
 * module only for preview/gate compatibility unless that integration is
 * removed as a separate task.
 */
export type GrokProvider = {
  /** This app's local provider id; also the callback path segment. */
  providerId: string;
  /** Upstream hint the broker forwards to (Better Auth social id). */
  idp: string;
  /** Human label for an optional sign-in button. */
  label: string;
};

export const GROK_PROVIDERS: readonly GrokProvider[] = [
  { providerId: "grok-google", idp: "google", label: "Google" },
  { providerId: "grok-x", idp: "twitter", label: "X" },
];
