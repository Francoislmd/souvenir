"use client";

import { useState } from "react";
import type { ImportMedia, ImportGroup } from "./ImportWizard";

const inputClass =
  "h-11 rounded-control border border-border bg-surface px-3 text-sm text-ink outline-none focus:border-accent focus:ring-1 focus:ring-accent";

export function FolderCard({
  group,
  index,
  media,
  otherGroups,
  onChange,
  onMoveMedia,
  onCopyMedia,
  onRemoveMedia,
  onRemove,
}: {
  group: ImportGroup;
  index: number;
  media: Record<string, ImportMedia>;
  otherGroups: { id: string; label: string }[];
  onChange: (patch: Partial<ImportGroup>) => void;
  onMoveMedia: (mediaId: string, targetGroupId: string | "new") => void;
  onCopyMedia: (mediaId: string, targetGroupId: string) => void;
  onRemoveMedia: (mediaId: string) => void;
  onRemove: () => void;
}) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-tint text-sm font-bold text-accent">
            {index + 1}
          </span>
          <span className="text-sm font-semibold text-ink">{group.label}</span>
        </span>
        <span className="flex items-center gap-3">
          {group.mediaIds.length > 0 ? (
            <span className="text-xs text-ink-2">
              {group.mediaIds.length} média{group.mediaIds.length > 1 ? "s" : ""}
            </span>
          ) : null}
          {otherGroups.length > 0 ? (
            <button type="button" onClick={onRemove} className="text-xs font-medium text-ink-2 hover:text-danger">
              Supprimer
            </button>
          ) : null}
        </span>
      </div>

      {group.mediaIds.length > 0 ? (
        <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-5">
          {group.mediaIds.map((mediaId) => {
            const item = media[mediaId];
            return (
              <div key={mediaId} className="relative aspect-square rounded-control bg-canvas">
                <div className="absolute inset-0 overflow-hidden rounded-control">
                  {item?.localUrl ? (
                    item.kind === "VIDEO" ? (
                      <video
                        src={item.localUrl}
                        className="h-full w-full object-cover"
                        muted
                        playsInline
                        preload="metadata"
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.localUrl} alt="" className="h-full w-full object-cover" />
                    )
                  ) : null}
                  {item?.kind === "VIDEO" ? (
                    <span className="absolute bottom-1 left-1 rounded-full bg-black/50 px-1.5 py-0.5 text-[10px] text-white">▶</span>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => setOpenMenu((current) => (current === mediaId ? null : mediaId))}
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/40 text-xs font-bold text-white backdrop-blur-sm transition active:scale-90"
                  aria-label="Déplacer ce média"
                >
                  ⋯
                </button>
                {openMenu === mediaId ? (
                  <div className="absolute right-1 top-8 z-10 flex w-44 flex-col overflow-hidden rounded-control border border-border bg-surface py-1 shadow-card">
                    {otherGroups.length > 0 ? (
                      <>
                        <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted">Déplacer vers</p>
                        {otherGroups.map((other) => (
                          <button
                            key={other.id}
                            type="button"
                            onClick={() => { onMoveMedia(mediaId, other.id); setOpenMenu(null); }}
                            className="px-3 py-1.5 text-left text-sm text-ink hover:bg-canvas"
                          >
                            {other.label}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => { onMoveMedia(mediaId, "new"); setOpenMenu(null); }}
                          className="px-3 py-1.5 text-left text-sm font-medium text-accent hover:bg-accent-tint"
                        >
                          + Nouveau dossier
                        </button>
                        <hr className="my-1 border-border" />
                        <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted">Copier aussi dans</p>
                        {otherGroups.map((other) => (
                          <button
                            key={`copy-${other.id}`}
                            type="button"
                            onClick={() => { onCopyMedia(mediaId, other.id); setOpenMenu(null); }}
                            className="px-3 py-1.5 text-left text-sm text-ink hover:bg-canvas"
                          >
                            {other.label}
                          </button>
                        ))}
                        <hr className="my-1 border-border" />
                      </>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => { onRemoveMedia(mediaId); setOpenMenu(null); }}
                      className="px-3 py-1.5 text-left text-sm font-medium text-danger hover:bg-danger-tint"
                    >
                      Retirer ce média
                    </button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="rounded-control border border-dashed border-border bg-canvas px-3 py-4 text-center text-sm text-ink-2">
          Dossier vide — déplace des photos ici depuis un autre groupe.
        </p>
      )}

      {group.mediaIds.length > 0 ? (
        <div className="flex flex-col gap-2">
          <input
            type="text"
            placeholder="Prénom et nom"
            value={group.clientName}
            onChange={(event) => onChange({ clientName: event.target.value })}
            className={inputClass}
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="email"
              inputMode="email"
              placeholder="Email du client"
              value={group.clientEmail}
              onChange={(event) => onChange({ clientEmail: event.target.value })}
              className={`${inputClass} sm:flex-1`}
            />
            <input
              type="tel"
              inputMode="tel"
              placeholder="Téléphone (ex: +33 6 12 34 56 78)"
              value={group.clientPhone}
              onChange={(event) => onChange({ clientPhone: event.target.value })}
              className={`${inputClass} sm:flex-1`}
            />
          </div>
          <input
            type="text"
            placeholder="Le vol de Léa 🤩"
            value={group.title}
            onChange={(event) => onChange({ title: event.target.value, titleTouched: true })}
            className={inputClass}
          />
          {!group.clientEmail && !group.clientPhone ? (
            <p className="text-xs text-warning">Ajoute un email ou un téléphone pour pouvoir envoyer ce lot.</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
