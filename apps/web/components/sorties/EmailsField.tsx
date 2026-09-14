"use client";

import { useRef, useState } from "react";
import styles from "@/app/(operator)/operator.module.css";
import { parseEmails, pasteSummary } from "@/lib/emails";

/**
 * Le champ des adresses de la sortie : un cadre unique où les adresses déjà
 * retenues sont des pastilles, et où le curseur attend à la suite.
 *
 * Il est fait pour être collé, pas rempli. En fin de sortie les adresses
 * existent déjà ailleurs — carnet de réservation, tableur, fil de messages —
 * et un collage entier suffit : on n'en garde que les adresses, sans doublon,
 * quel que soit le format du texte. Saisir une adresse à la main reste
 * possible, c'est le cas du retardataire, pas celui de la liste.
 *
 * Une adresse se valide à l'entrée, à la virgule, au point-virgule, à l'espace
 * ou en quittant le champ : aucune saisie ne se perd faute d'avoir appuyé sur
 * la bonne touche. Effacer sur un champ vide retire la dernière pastille.
 */
export function EmailsField({
  emails,
  onChange,
  hint,
  placeholder = "Collez vos adresses, ou saisissez-en une",
}: {
  emails: string[];
  onChange: (emails: string[]) => void;
  hint?: string;
  placeholder?: string;
}) {
  const [text, setText] = useState("");
  const [note, setNote] = useState("");
  const input = useRef<HTMLInputElement | null>(null);

  /** Retient ce qui est une adresse. Faux si le texte n'en contenait aucune. */
  function keep(raw: string): boolean {
    if (!raw.trim()) return false;
    const parsed = parseEmails(raw, emails);
    if (parsed.emails.length === 0) {
      setNote("Ce texte ne contient aucune adresse.");
      return false;
    }
    onChange([...emails, ...parsed.emails]);
    setNote(pasteSummary(parsed));
    return true;
  }

  function commit(): void {
    if (keep(text)) setText("");
  }

  return (
    <>
      {/* Le cadre entier est la cible : viser l'espace libre après la
          dernière pastille pose le curseur, comme dans un champ ordinaire. */}
      <div
        className={styles.sdField}
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) {
            e.preventDefault();
            input.current?.focus();
          }
        }}
      >
        {emails.map((email) => (
          <span key={email} className={styles.sdPill}>
            {email}
            <button
              type="button"
              className={styles.sdPillX}
              aria-label={`Retirer ${email}`}
              onClick={() => {
                onChange(emails.filter((e) => e !== email));
                setNote("");
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </span>
        ))}

        <input
          ref={input}
          className={styles.sdFieldIn}
          type="text"
          inputMode="email"
          autoComplete="off"
          spellCheck={false}
          aria-label="Adresses de vos clients"
          placeholder={emails.length > 0 ? "" : placeholder}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setNote("");
          }}
          onPaste={(e) => {
            const raw = e.clipboardData.getData("text");
            if (!raw) return;
            e.preventDefault();
            // Un collage qui ne donne rien reste à l'écran : l'opérateur voit
            // ce qu'il a collé au lieu d'un champ resté vide sans raison.
            if (!keep(raw)) setText((prev) => `${prev}${raw}`.trim());
            else setText("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === "," || e.key === ";" || e.key === " ") {
              if (!text.trim()) return;
              e.preventDefault();
              commit();
              return;
            }
            if (e.key === "Backspace" && text.length === 0 && emails.length > 0) {
              e.preventDefault();
              onChange(emails.slice(0, -1));
              setNote("");
            }
          }}
          onBlur={commit}
        />
      </div>

      {note || hint ? <p className={styles.sdFieldNote}>{note || hint}</p> : null}
    </>
  );
}
