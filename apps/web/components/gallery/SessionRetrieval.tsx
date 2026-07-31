"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import styles from "@/app/g/s/[shareToken]/retrieval.module.css";
import type { GroupDaySummary, GroupSlotSummary } from "@/lib/gallery-group";

const RECENCY_LABELS: Record<GroupDaySummary["recency"], string> = {
  today: "Aujourd'hui",
  yesterday: "Hier",
  week: "Cette semaine",
  earlier: "Plus tôt",
};
const RECENCY_ORDER: GroupDaySummary["recency"][] = ["today", "yesterday", "week", "earlier"];

const HOUR_BUCKETS: { key: GroupSlotSummary["hourBucket"]; label: string }[] = [
  { key: "morning", label: "Matin" },
  { key: "afternoon", label: "Après-midi" },
  { key: "evening", label: "Soir" },
];

/**
 * Écrans 1 (jour) et 2 (créneau) de la page de récupération de galerie de
 * groupe — voir souvenir-handoff.md. La galerie/tunnel d'achat (écran 3)
 * est hors périmètre : onConfirm() y renvoie la main au composant parent.
 */
export function SessionRetrieval({
  shareToken,
  operatorName,
  operatorLogoUrl,
  days,
  onConfirm,
}: {
  shareToken: string;
  operatorName: string;
  operatorLogoUrl: string | null;
  days: GroupDaySummary[];
  onConfirm: (slot: GroupSlotSummary, dateLabel: string) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const dateKey = searchParams.get("date");
  const activeDay = useMemo(() => days.find((d) => d.dateKey === dateKey) ?? null, [days, dateKey]);

  const [dir, setDir] = useState<"fwd" | "back">("fwd");
  const [slots, setSlots] = useState<GroupSlotSummary[]>([]);
  const [slotsDateLabel, setSlotsDateLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [activityFilter, setActivityFilter] = useState("all");

  useEffect(() => {
    setActivityFilter("all");
    if (!activeDay) {
      setSlots([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(false);
    fetch(`/api/g/s/${shareToken}/days/${encodeURIComponent(activeDay.dateKey)}/slots`)
      .then((res) => {
        if (!res.ok) throw new Error("failed");
        return res.json() as Promise<{ dateLabel: string; slots: GroupSlotSummary[] }>;
      })
      .then((data) => {
        if (cancelled) return;
        setSlots(data.slots);
        setSlotsDateLabel(data.dateLabel);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeDay, shareToken]);

  function openDay(day: GroupDaySummary): void {
    setDir("fwd");
    router.push(`${pathname}?date=${day.dateKey}`, { scroll: false });
  }
  function goBack(): void {
    setDir("back");
    router.push(pathname, { scroll: false });
  }

  const activities = useMemo(() => {
    const map = new Map<string, { key: string; label: string; count: number }>();
    for (const s of slots) {
      const cur = map.get(s.activityKey);
      if (cur) cur.count += 1;
      else map.set(s.activityKey, { key: s.activityKey, label: s.activity, count: 1 });
    }
    return Array.from(map.values());
  }, [slots]);

  const visibleSlots = activityFilter === "all" ? slots : slots.filter((s) => s.activityKey === activityFilter);

  const header = (
    <div className={styles.topbar}>
      {activeDay ? (
        <button type="button" className={styles.back} aria-label="Retour aux dates" onClick={goBack}>
          <svg viewBox="0 0 20 20" fill="none">
            <path d="M12.5 5L7.5 10L12.5 15" stroke="#101418" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      ) : null}
      <div className={styles.avatar}>
        {operatorLogoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={operatorLogoUrl} alt="" />
        ) : (
          operatorName.slice(0, 2).toUpperCase()
        )}
      </div>
      <div className={styles.who}>
        <b>{operatorName}</b>
      </div>

      {/* Desktop uniquement (≥821px, masqué en CSS sous ce seuil) — décoratif :
          ce produit n'a ni pages secondaires ni compte client (cf CLAUDE.md
          §3), ces liens ne mènent donc nulle part. */}
      <nav className={styles.nav}>
        <a href="#" className={styles.navLink}>
          Nos sorties
        </a>
        <a href="#" className={`${styles.navLink} ${styles.navLinkActive}`}>
          Mes photos
        </a>
        <a href="#" className={styles.navLink}>
          Tarifs
        </a>
        <a href="#" className={styles.navLink}>
          Aide
        </a>
      </nav>
      <div className={styles.actions}>
        <button type="button" className={styles.iconBtn} aria-label="Mon compte">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="3.6" />
            <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
          </svg>
        </button>
        <button type="button" className={styles.iconBtn} aria-label="Panier">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 7h14l-1.2 12.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8z" />
            <path d="M9 7V5.5a3 3 0 0 1 6 0V7" />
          </svg>
        </button>
      </div>
    </div>
  );

  if (!activeDay) {
    return (
      <div className={styles.retrieval}>
        {header}
        <div className={`${styles.hero} ${dir === "fwd" ? styles.fwd : styles["back-anim"]}`}>
          <h1>
            Quel jour
            <br />
            êtes-vous <em>sorti</em> ?
          </h1>
          <p>Sélectionnez la date de votre activité pour retrouver vos photos.</p>
        </div>

        {days.length === 0 ? (
          <div className={styles.state}>
            <b>Aucune sortie publiée</b>
            <p>Revenez un peu plus tard.</p>
          </div>
        ) : (
          <div className={styles.list}>
            {RECENCY_ORDER.map((recency) => {
              const items = days.filter((d) => d.recency === recency);
              if (items.length === 0) return null;
              return (
                <div key={recency} className={styles.group}>
                  <div className={styles.groupLabel}>{RECENCY_LABELS[recency]}</div>
                  {items.map((day) => (
                    <button key={day.dateKey} type="button" className={styles.date} onClick={() => openDay(day)}>
                      <span className={styles.tile}>
                        <span className={styles.mo}>{day.monthAbbr}</span>
                        <span className={styles.dy}>{day.dayNumber}</span>
                      </span>
                      <span className={styles.meta}>
                        <span className={styles.wd}>
                          {day.weekday}
                          {day.recency === "today" ? <span className={styles.today}>Aujourd&rsquo;hui</span> : null}
                        </span>
                        <span className={styles.sub}>
                          <b>{day.sessionCount}</b> sortie{day.sessionCount > 1 ? "s" : ""} · {day.photoCount} photo{day.photoCount > 1 ? "s" : ""}
                        </span>
                      </span>
                      <span className={styles.chev}>
                        <svg viewBox="0 0 20 20" fill="none">
                          <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={styles.retrieval}>
      {header}
      <div className={`${styles.hero} ${dir === "fwd" ? styles.fwd : styles["back-anim"]}`}>
        <h1>
          Vos photos du
          <br />
          <em>{slotsDateLabel || activeDay.dateLabel}</em>
        </h1>
        <p>Sélectionnez votre sortie pour retrouver vos photos.</p>
      </div>

      {activities.length > 1 ? (
        <div className={styles.chips} role="tablist" aria-label="Filtrer par activité">
          <button
            type="button"
            role="tab"
            aria-selected={activityFilter === "all"}
            className={`${styles.chip} ${activityFilter === "all" ? styles.on : ""}`}
            onClick={() => setActivityFilter("all")}
          >
            Tout <small>{slots.length}</small>
          </button>
          {activities.map((a) => (
            <button
              key={a.key}
              type="button"
              role="tab"
              aria-selected={activityFilter === a.key}
              className={`${styles.chip} ${activityFilter === a.key ? styles.on : ""}`}
              onClick={() => setActivityFilter(a.key)}
            >
              {a.label} <small>{a.count}</small>
            </button>
          ))}
        </div>
      ) : null}

      <div className={styles.listSlot}>
        {loading ? (
          <>
            <div className={styles.skeletonCard} />
            <div className={styles.skeletonCard} />
            <div className={styles.skeletonCard} />
          </>
        ) : error ? (
          <div className={styles.state}>
            <b>Impossible de charger vos sorties</b>
            <p>Réessayez dans un instant.</p>
          </div>
        ) : visibleSlots.length === 0 ? (
          <div className={styles.state}>
            <b>Aucune sortie ce jour-là</b>
            <p>Vérifiez la date, ou revenez au choix du jour.</p>
          </div>
        ) : (
          <>
            {HOUR_BUCKETS.map((bucket) => {
              const items = visibleSlots.filter((s) => s.hourBucket === bucket.key);
              if (items.length === 0) return null;
              const bucketCount = HOUR_BUCKETS.filter((b) => visibleSlots.some((s) => s.hourBucket === b.key)).length;
              return (
                <div key={bucket.key} className={styles.group}>
                  {bucketCount > 1 ? <div className={styles.groupLabel}>{bucket.label}</div> : null}
                  {items.map((slot) => (
                    <button
                      key={slot.id}
                      type="button"
                      className={styles.slot}
                      onClick={() => onConfirm(slot, slotsDateLabel || activeDay.dateLabel)}
                    >
                      <span className={styles.meta}>
                        <span className={styles.slotTitle}>
                          {slot.activity}
                          <span className={styles.tm}>{slot.label}</span>
                        </span>
                        {slot.guide ? <span className={styles.ssub}>{`guide ${slot.guide}`}</span> : null}
                      </span>
                      <span className={styles.count}>{slot.photoCount} photos</span>
                    </button>
                  ))}
                </div>
              );
            })}

            <div className={styles.help}>
              <b>Un doute sur l&rsquo;horaire ?</b>
              <p>Retrouvez l&rsquo;heure de départ sur votre billet, ou demandez à votre moniteur.</p>
              <a href="#" onClick={(e) => e.preventDefault()}>
                Contacter {operatorName}
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
