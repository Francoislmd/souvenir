import { supabaseAdmin } from "./supabase";

export const ORIGINALS_BUCKET = "originals";
export const PREVIEWS_BUCKET = "previews";

const HD_SIGNED_URL_TTL_SEC = 60 * 60 * 24; // 24h

export function getPreviewUrl(key: string): string {
  return supabaseAdmin.storage.from(PREVIEWS_BUCKET).getPublicUrl(key).data.publicUrl;
}

export async function getOriginalSignedUrl(key: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin.storage.from(ORIGINALS_BUCKET).createSignedUrl(key, HD_SIGNED_URL_TTL_SEC);
  if (error || !data) return null;
  return data.signedUrl;
}

export async function deleteStorageObjects(bucket: string, keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  await supabaseAdmin.storage.from(bucket).remove(keys);
}
