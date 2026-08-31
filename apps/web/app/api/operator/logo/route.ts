import { getOperatorUser } from "@/lib/current-user";
import { getPreviewUrl, uploadObject, PREVIEWS_BUCKET } from "@/lib/storage";

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

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
    return Response.json({ error: "Format non supporté (PNG, JPG, WEBP ou SVG)" }, { status: 400 });
  }
  if (file.size > MAX_SIZE_BYTES) {
    return Response.json({ error: "Image trop lourde (max 5 Mo)" }, { status: 400 });
  }

  const extension = file.type === "image/svg+xml" ? "svg" : file.type.split("/")[1];
  const key = `logos/${dbUser.operatorId}-${Date.now()}.${extension}`;

  try {
    await uploadObject(PREVIEWS_BUCKET, key, Buffer.from(await file.arrayBuffer()), { contentType: file.type });
  } catch (error) {
    console.error("[api/operator/logo] envoi du logo en échec", error);
    return Response.json({ error: "L'envoi a échoué, réessaie." }, { status: 502 });
  }

  return Response.json({ logoUrl: getPreviewUrl(key) }, { status: 200 });
}
