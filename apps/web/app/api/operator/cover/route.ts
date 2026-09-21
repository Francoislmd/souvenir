import { getOperatorUser } from "@/lib/current-user";
import { PREVIEWS_BUCKET, getPreviewUrl, uploadObject } from "@/lib/storage";

// La couverture de la boutique de groupe. Même chemin que le logo, à deux
// différences près : c'est une photo, donc pas de SVG, et elle s'affiche en
// pleine largeur, donc la limite est plus haute — un JPEG sorti d'un reflex
// dépasse les 5 Mo du logo.
const MAX_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];

export async function POST(request: Request): Promise<Response> {
  const dbUser = await getOperatorUser();
  if (!dbUser) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "Fichier manquant" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return Response.json({ error: "Format non supporté (PNG, JPG ou WEBP)" }, { status: 400 });
  }
  if (file.size > MAX_SIZE_BYTES) {
    return Response.json({ error: "Image trop lourde (max 10 Mo)" }, { status: 400 });
  }

  const extension = file.type.split("/")[1];
  const key = `covers/${dbUser.operatorId}-${Date.now()}.${extension}`;

  try {
    await uploadObject(PREVIEWS_BUCKET, key, Buffer.from(await file.arrayBuffer()), { contentType: file.type });
  } catch (error) {
    console.error("[API operator upload]", error);
    return Response.json({ error: "L'envoi a échoué, réessaie." }, { status: 502 });
  }

  const coverUrl = getPreviewUrl(key);

  return Response.json({ coverUrl }, { status: 200 });
}
