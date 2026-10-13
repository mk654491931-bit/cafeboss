import { configHint, supabase } from "./supabase";
import { toTurkishError } from "./errors";

/**
 * Admin panelinde e-posta yerine kısa bir kullanıcı adı kullanılır.
 * "admin" girilirse "admin@bosscafe.com" olarak eşlenir; içinde "@" bulunan
 * değerler e-posta sayılıp olduğu gibi kullanılır.
 */
export const ADMIN_USERNAME = "admin";
const ADMIN_EMAIL_DOMAIN = "bosscafe.com";

export function resolveAdminEmail(identifier: string): string {
  const value = identifier.trim();
  return value.includes("@") ? value : `${value}@${ADMIN_EMAIL_DOMAIN}`;
}

/** Signs the admin in. Returns null on success, a Turkish message on failure. */
export async function signIn(
  email: string,
  password: string,
): Promise<string | null> {
  if (!supabase) return configHint;
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return error ? toTurkishError(error) : null;
  } catch (error) {
    return toTurkishError(error);
  }
}

/** Ends the admin session. Returns null on success, a message on failure. */
export async function signOut(): Promise<string | null> {
  if (!supabase) return configHint;
  try {
    const { error } = await supabase.auth.signOut();
    return error ? toTurkishError(error) : null;
  } catch (error) {
    return toTurkishError(error);
  }
}
