/** Turns any thrown value into a short, user-friendly Turkish message. */
export function toTurkishError(error: unknown): string {
  let message = "";

  if (error instanceof Error) {
    message = error.message;
  } else if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  ) {
    message = (error as { message: string }).message;
  } else if (typeof error === "string") {
    message = error;
  } else if (error) {
    message = String(error);
  }

  const lower = message.toLowerCase();

  if (message.includes("42501") || lower.includes("row-level security")) {
    return "Bu işlem için yetkiniz yok. Lütfen çıkış yapıp tekrar giriş yapın.";
  }
  if (message.includes("Invalid login credentials")) {
    return "E-posta veya şifre hatalı.";
  }
  if (message.includes("Email not confirmed")) {
    return "E-posta adresiniz henüz doğrulanmamış.";
  }
  if (message.includes("already registered")) {
    return "Bu e-posta adresi zaten kayıtlı.";
  }
  if (message.includes("Password should be")) {
    return "Şifre en az 6 karakter olmalı.";
  }
  if (message.includes("23502")) {
    return "Zorunlu alanları doldurun.";
  }
  if (message.includes("23505")) {
    return "Bu kayıt zaten mevcut.";
  }
  if (message.includes("22P02")) {
    return "Girilen değer biçimi geçersiz.";
  }
  if (
    lower.includes("jwt expired") ||
    lower.includes("invalid jwt") ||
    lower.includes("token has expired") ||
    lower.includes("refresh token") ||
    lower.includes("auth session missing") ||
    lower.includes("session missing")
  ) {
    return "Oturum süreniz doldu. Lütfen çıkış yapıp tekrar giriş yapın.";
  }
  if (
    lower.includes("project is paused") ||
    lower.includes("project has been paused") ||
    lower.includes("project is inactive") ||
    lower.includes("database is not available") ||
    lower.includes("service unavailable") ||
    message.includes("503")
  ) {
    return "Veritabanı şu anda yanıt vermiyor. Supabase projesi duraklatılmış olabilir; panelden Resume project deyin ve birkaç saniye sonra tekrar deneyin.";
  }
  if (
    lower.includes("failed to fetch") ||
    lower.includes("fetch failed") ||
    lower.includes("load failed") ||
    lower.includes("networkerror") ||
    lower.includes("network request failed") ||
    lower.includes("econnreset") ||
    lower.includes("etimedout") ||
    lower.includes("enotfound")
  ) {
    return "Bağlantı hatası. İnternet bağlantınızı kontrol edip tekrar deneyin.";
  }

  return message || "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.";
}
