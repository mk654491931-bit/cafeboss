import { isSupabaseConfigured, supabase } from "./supabase";

/** Bucket used for admin uploads (see supabase/schema.sql). */
const BUCKET = "site-images";
const MAX_DIMENSION = 1400;
const JPEG_QUALITY = 0.82;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const SKIP_COMPRESS_BYTES = 400 * 1024;

export const ACCEPTED_IMAGE_TYPES = "image/*";

/** Seçilen/sürüklenen dosyayı küçültüp data URL'e çevirir. */
export async function fileToDataUrl(file: File): Promise<string> {
  const dataUrl = await readAsDataUrl(file);

  // GIF animasyonu ve SVG'yi canvas'tan geçirmek zarar verir; olduğu gibi bırak.
  if (file.type === "image/gif" || file.type === "image/svg+xml") {
    return dataUrl;
  }

  const image = await loadImage(dataUrl);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(image.width, image.height));

  if (scale === 1 && file.size <= SKIP_COMPRESS_BYTES) {
    return dataUrl;
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));

  const context = canvas.getContext("2d");
  if (!context) return dataUrl;

  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const type = file.type === "image/png" ? "image/png" : "image/jpeg";
  return canvas.toDataURL(type, JPEG_QUALITY);
}

/**
 * Bir görsel dosyasını yükler ve kullanılabilir bir URL döndürür.
 * Supabase Storage yapılandırılmışsa oraya yükler, aksi hâlde gömülü
 * data URL'e düşer — böylece önizleme Supabase olmadan da çalışır.
 */
export async function uploadImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Yalnızca görsel dosyaları yükleyebilirsiniz.");
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("Görsel boyutu en fazla 10 MB olabilir.");
  }

  const dataUrl = await fileToDataUrl(file);

  if (isSupabaseConfigured && supabase) {
    const uploaded = await uploadToStorage(supabase, dataUrl);
    if (uploaded) return uploaded;
  }

  return dataUrl;
}

async function uploadToStorage(
  client: NonNullable<typeof supabase>,
  dataUrl: string,
): Promise<string | null> {
  try {
    const blob = await (await fetch(dataUrl)).blob();
    const extension = blob.type === "image/png" ? "png" : "jpg";
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;

    const { error } = await client.storage.from(BUCKET).upload(path, blob, {
      contentType: blob.type,
      cacheControl: "31536000",
      upsert: false,
    });
    if (error) return null;

    return client.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  } catch {
    // Depolama kullanılamıyorsa data URL'e düş.
    return null;
  }
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Dosya okunamadı. Tekrar deneyin."));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new Error("Görsel açılamadı. Geçerli bir resim dosyası seçin."));
    image.src = src;
  });
}
