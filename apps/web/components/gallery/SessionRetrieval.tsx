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
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    setSelectedId(null);
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

  useEffect(() => {
    setSelectedId((cur) => (cur && !visibleSlots.some((s) => s.id === cur) ? null : cur));
  }, [visibleSlots]);

  const selectedSlot = slots.find((s) => s.id === selectedId) ?? null;

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
      <div className={styles.powered}>
        <i />
        Souvenir
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
                <div key={recency}>
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
              const seenCollisions = new Set<string>();
              return (
                <div key={bucket.key}>
                  {bucketCount > 1 ? <div className={styles.groupLabel}>{bucket.label}</div> : null}
                  {items.map((slot, i) => {
                    const isSelected = selectedId === slot.id;
                    const isLastOfCollision = !!slot.groupSizeLabel && items.slice(i + 1).every((s) => s.label !== slot.label);
                    const showHint = !!slot.groupSizeLabel && isLastOfCollision && !seenCollisions.has(slot.label);
                    if (showHint) seenCollisions.add(slot.label);
                    return (
                      <div key={slot.id}>
                        <button
                          type="button"
                          className={`${styles.slot} ${isSelected ? styles.selected : ""}`}
                          onClick={() => setSelectedId((cur) => (cur === slot.id ? null : slot.id))}
                        >
                          <span className={styles.meta}>
                            <span className={styles.slotTitle}>
                              {slot.activity}
                              <span className={styles.tm}>{slot.label}</span>
                            </span>
                            {slot.guide || slot.groupSizeLabel ? (
                              <span className={styles.ssub}>
                                {[slot.guide ? `guide ${slot.guide}` : null, slot.groupSizeLabel].filter(Boolean).join(" · ")}
                              </span>
                            ) : null}
                          </span>
                          <span className={styles.count}>{slot.photoCount} photos</span>
                          <span className={styles.check}>
                            <svg viewBox="0 0 16 16" fill="none">
                              <path d="M3 8.5L6.5 12L13 4.5" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </span>
                        </button>
                        {showHint ? (
                          <div className={styles.hintTwin}>
                            <span>💡</span>
                            <span>Deux départs à {slot.label} : distinguez le vôtre selon la taille du groupe (grand ou petit).</span>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
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

      <div className={`${styles.ctaWrap} ${selectedSlot ? styles.show : ""}`}>
        <button
          type="button"
          className={styles.cta}
          disabled={!selectedSlot}
          onClick={() => selectedSlot && onConfirm(selectedSlot, slotsDateLabel || activeDay.dateLabel)}
        >
          {selectedSlot ? `Voir mes ${selectedSlot.photoCount} photos · ${selectedSlot.activity} ${selectedSlot.label}` : "Voir mes photos"}
        </button>
      </div>
    </div>
  );
}
