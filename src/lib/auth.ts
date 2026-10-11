import { configHint, supabase } from "./supabase";
import { toTurkishError } from "./errors";

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
