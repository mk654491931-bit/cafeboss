import { supabase } from "./supabase";
import { toTurkishError } from "./errors";

/**
 * Admin panelinde e-posta yerine kısa bir kullanıcı adı kullanılır.
 * "admin" girilirse "admin@bosscafe.com" olarak eşlenir; içinde "@" bulunan
 * değerler e-posta sayılıp olduğu gibi kullanılır.
 */
export const ADMIN_USERNAME = "admin";
const ADMIN_EMAIL_DOMAIN = "bosscafe.com";

/** Supabase anahtarları yokken kullanılan yerel önizleme girişi. */
export const PREVIEW_PASSWORD = "admin";
export const PREVIEW_AUTH_EVENT = "boss-cafe-preview-auth";
const PREVIEW_STORAGE_KEY = "boss-cafe-preview-admin";

export function resolveAdminEmail(identifier: string): string {
  const value = identifier.trim();
  return value.includes("@") ? value : `${value}@${ADMIN_EMAIL_DOMAIN}`;
}

function setPreviewSession(active: boolean): void {
  try {
    if (active) window.localStorage.setItem(PREVIEW_STORAGE_KEY, "1");
    else window.localStorage.removeItem(PREVIEW_STORAGE_KEY);
  } catch {
    // Depolama kapalıysa oturum yalnızca bu sayfa yenilenene kadar sürer.
  }
  window.dispatchEvent(new Event(PREVIEW_AUTH_EVENT));
}

/**
 * Supabase tanımlı değilken yerel önizleme oturumunun açık olup olmadığını
 * söyler. Supabase bağlandığında bu yol tamamen devre dışı kalır.
 */
export function isPreviewSession(): boolean {
  if (supabase) return false;
  try {
    return window.localStorage.getItem(PREVIEW_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

/** Signs the admin in. Returns null on success, a Turkish message on failure. */
export async function signIn(
  email: string,
  password: string,
): Promise<string | null> {
  if (!supabase) {
    const isPreviewLogin =
      email.trim().toLocaleLowerCase("tr") ===
        resolveAdminEmail(ADMIN_USERNAME).toLocaleLowerCase("tr") &&
      password === PREVIEW_PASSWORD;

    if (!isPreviewLogin) {
      return `Önizleme modunda kullanıcı adı "${ADMIN_USERNAME}", şifre "${PREVIEW_PASSWORD}" olmalı.`;
    }

    setPreviewSession(true);
    return null;
  }

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
  if (!supabase) {
    setPreviewSession(false);
    return null;
  }
  try {
    const { error } = await supabase.auth.signOut();
    return error ? toTurkishError(error) : null;
  } catch (error) {
    return toTurkishError(error);
  }
}
