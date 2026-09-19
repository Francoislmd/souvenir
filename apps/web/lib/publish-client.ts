import { NDJSON, type ProgressEvent } from "@/lib/progress-stream";

/**
 * Lance la publication d'une sortie (GROUPE : /publish, INDIVIDUEL : /send)
 * et remonte chaque étape au fil de l'eau. Rend `true` seulement si le
 * serveur a confirmé la fin (`{"t":"done"}`) : une connexion coupée en
 * route n'est pas une réussite.
 */
export async function runPublication(sortieId: string, isGroup: boolean, onEvent: (event: ProgressEvent) => void): Promise<boolean> {
  const endpoint = isGroup ? `/api/sorties/${sortieId}/publish` : `/api/sorties/${sortieId}/send`;
  const res = await fetch(endpoint, { method: "POST", headers: { Accept: NDJSON } });
  if (!res.ok) return false;
  if (!res.body || !(res.headers.get("content-type") ?? "").includes(NDJSON)) return true;

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  // Un objet plutôt qu'une variable : TypeScript ne suit pas une affectation
  // faite dans la fermeture ci-dessous.
  const result: { outcome: boolean | null } = { outcome: null };
  const handle = (line: string): void => {
    if (!line.trim()) return;
    let event: ProgressEvent;
    try {
      event = JSON.parse(line) as ProgressEvent;
    } catch {
      return;
    }
    if (event.t === "done") result.outcome = true;
    else if (event.t === "error") result.outcome = false;
    else onEvent(event);
  };

  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let cut = buffer.indexOf("\n");
    while (cut !== -1) {
      handle(buffer.slice(0, cut));
      buffer = buffer.slice(cut + 1);
      cut = buffer.indexOf("\n");
    }
  }
  handle(buffer + decoder.decode());
  return result.outcome === true;
}
