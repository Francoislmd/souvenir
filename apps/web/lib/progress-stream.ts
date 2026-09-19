/**
 * Réponse en flux NDJSON (un objet JSON par ligne) pour les gestes longs de
 * l'espace opérateur — publier une galerie, envoyer les galeries. Le travail
 * tourne toujours dans la requête (CLAUDE.md §2, aucune queue) : le flux ne
 * fait que raconter, au fil de l'eau, ce qui est vraiment fait.
 *
 * Le statut HTTP part avant la fin du travail : l'issue se lit donc dans la
 * dernière ligne, `{"t":"done"}` ou `{"t":"error"}`.
 */
export type ProgressEvent =
  | { t: "start"; total: number }
  | { t: "photo"; id: string; done: number; total: number }
  | { t: "sorting" }
  | { t: "client"; done: number; total: number }
  | { t: "done" }
  | { t: "error" };

export const NDJSON = "application/x-ndjson";

/** Le client qui sait lire le flux le demande ; les autres (un onglet resté
 *  ouvert sur l'ancienne version) gardent la réponse JSON d'avant. */
export function wantsStream(request: Request): boolean {
  return (request.headers.get("accept") ?? "").includes(NDJSON);
}

export function progressResponse(label: string, run: (emit: (event: ProgressEvent) => void) => Promise<void>): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let open = true;
      const emit = (event: ProgressEvent): void => {
        if (!open) return;
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        } catch {
          // Le navigateur a fermé la connexion : le travail continue quand même
          // jusqu'au bout, seul le récit s'arrête.
          open = false;
        }
      };
      try {
        await run(emit);
        emit({ t: "done" });
      } catch (error) {
        console.error(`[${label}]`, error);
        emit({ t: "error" });
      } finally {
        if (open) controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": `${NDJSON}; charset=utf-8`,
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
