// Regroupement des photos d'une sortie GROUPE par créneau horaire (brief §6).
// Fonction pure, appelée depuis lib/group-publish.ts une fois l'EXIF de
// chaque photo lu. Les photos sans horodatage (EXIF absent) ne sont jamais
// mélangées à un créneau daté — un créneau régulier daté "à l'aveugle"
// pollue moins la lecture qu'un créneau dont l'heure ne correspond à rien.

export interface ClusterItem {
  id: string;
  takenAt: Date | null;
}

export interface Cluster {
  ids: string[];
  startsAt: Date;
}

const DEFAULT_GAP_MINUTES = 40;

export function clusterByTime(items: ClusterItem[], gapMinutes = DEFAULT_GAP_MINUTES, fallbackStartsAt = new Date()): Cluster[] {
  const dated = items.filter((i): i is ClusterItem & { takenAt: Date } => i.takenAt !== null);
  const undated = items.filter((i) => i.takenAt === null);

  const clusters: Cluster[] = [];
  const gapMs = gapMinutes * 60 * 1000;

  const sorted = [...dated].sort((a, b) => a.takenAt.getTime() - b.takenAt.getTime());
  let current: ClusterItem[] = [];

  for (const item of sorted) {
    const last = current[current.length - 1];
    if (last && item.takenAt.getTime() - (last.takenAt as Date).getTime() > gapMs) {
      clusters.push(toCluster(current));
      current = [];
    }
    current.push(item);
  }
  if (current.length > 0) clusters.push(toCluster(current));

  // Repli : photos sans EXIF, regroupées en un seul créneau daté sur le
  // premier créneau existant (ou sur l'heure renseignée par l'opérateur à la
  // création de la sortie s'il n'y en a aucun) — elles appartiennent toutes
  // à la même sortie, donc au même départ réel. Ne jamais les répartir en
  // plusieurs lots artificiels : ça créerait de faux créneaux distincts
  // (vus côté client comme des départs séparés / "grand groupe" vs "petit
  // groupe") pour ce qui n'est qu'une seule et même session.
  if (undated.length > 0) {
    const baseline = clusters[0]?.startsAt ?? fallbackStartsAt;
    clusters.push({ ids: undated.map((p) => p.id), startsAt: baseline });
  }

  return clusters;
}

function toCluster(items: ClusterItem[]): Cluster {
  const first = items[0]!;
  return { ids: items.map((p) => p.id), startsAt: first.takenAt as Date };
}
