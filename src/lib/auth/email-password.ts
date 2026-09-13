/**
 * Better Auth's email/password flag is not the Kaheng admin login.
 *
 * The admin area uses the server-only credentials in ADMIN_USERNAME and
 * ADMIN_PASSWORD, plus a signed HttpOnly session cookie. Keeping this flag
 * disabled avoids creating a second account system that the admin page does
 * not use.
 */
export const emailAndPasswordEnabled = false;
