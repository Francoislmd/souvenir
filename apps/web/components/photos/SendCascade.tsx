"use client";

import { useEffect, useState } from "react";
import styles from "@/app/(operator)/operator.module.css";
import { ChannelIcon } from "@/components/sorties/ChannelIcon";
import { deriveChannel } from "@/lib/channel";

export interface SendParticipant {
  id: string;
  name: string;
  contact: string;
  photoCount: number;
}

const AV_VARIANTS = ["", "b", "c"];

/**
 * L'envoi a déjà été effectué côté serveur au moment où ce composant monte —
 * l'animation en cascade sert uniquement de retour visuel.
 */
export function SendCascade({
  participants,
  onDone,
  animate = true,
}: {
  participants: SendParticipant[];
  onDone?: () => void;
  animate?: boolean;
}) {
  const [doneIds, setDoneIds] = useState<Set<string>>(() => (animate ? new Set() : new Set(participants.map((p) => p.id))));

  useEffect(() => {
    if (!animate) return;
    const timers = participants.map((p, i) =>
      setTimeout(() => {
        setDoneIds((prev) => new Set(prev).add(p.id));
        if (i === participants.length - 1) onDone?.();
      }, 300 + i * 200),
    );
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      {participants.map((p, i) => {
        const done = doneIds.has(p.id);
        const isMail = deriveChannel(p.contact) === "EMAIL";
        const variant = AV_VARIANTS[i % 3];
        return (
          <div key={p.id} className={`${styles.sendrow} ${done ? styles.done : ""}`}>
            <span className={`${styles.av} ${variant ? styles[variant] : ""}`} style={{ width: 31, height: 31, fontSize: ".72rem" }}>
              {p.name.slice(0, 2).toUpperCase()}
            </span>
            <span className={styles.pinfo}>
              <span className={styles.pn}>{p.name}</span>
              <span className={styles.pp}>
                <ChannelIcon isMail={isMail} />
                {p.photoCount} photos · {isMail ? "email" : "WhatsApp"}
              </span>
            </span>
            <span className={styles.st}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </span>
          </div>
        );
      })}
    </div>
  );
}
