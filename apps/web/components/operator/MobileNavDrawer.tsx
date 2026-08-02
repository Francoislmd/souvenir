"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import styles from "@/app/(operator)/operator.module.css";
import { NavList } from "@/components/operator/NavList";

const FOCUSABLE_SELECTOR = "a[href], button:not([disabled])";

export function MobileNavDrawer({ operatorName, badgeCount }: { operatorName: string; badgeCount: number }) {
  const [open, setOpen] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const pathname = usePathname();
  const burgerRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);

  // Portalé vers #mobile-drawer-root (sœur de <header>, enfant de .app) plutôt
  // que document.body : .app définit les tokens de couleur (--ink, --side…)
  // utilisés par le tiroir — un portal vers body en sortirait et casserait
  // tout le style (fond transparent, texte sans couleur, box-sizing perdu).
  useEffect(() => setPortalTarget(document.getElementById("mobile-drawer-root")), []);

  // Ferme sur changement de route (lien dans le tiroir déjà géré par
  // onNavigate, ceci couvre aussi retour navigateur / navigation externe).
  useEffect(() => {
    setOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    const appRoot = document.getElementById("app-root");
    document.body.classList.toggle("nav-open", open);
    document.body.style.overflow = open ? "hidden" : "";
    appRoot?.setAttribute("aria-hidden", open ? "true" : "false");

    if (!open) return;

    closeButtonRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key !== "Tab") return;
      const container = drawerRef.current;
      if (!container) return;
      const focusables = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    function onResize() {
      if (window.innerWidth > 720) setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  // Rend le focus au bouton menu à la fermeture (mais pas au montage initial).
  const wasOpen = useRef(false);
  useEffect(() => {
    if (!open && wasOpen.current) burgerRef.current?.focus();
    wasOpen.current = open;
  }, [open]);

  useEffect(() => {
    return () => {
      document.body.classList.remove("nav-open");
      document.body.style.overflow = "";
      document.getElementById("app-root")?.setAttribute("aria-hidden", "false");
    };
  }, []);

  const overlay = (
    <>
      {open ? <div className={styles.scrim} onClick={() => setOpen(false)} /> : null}
      <aside
        id="operator-drawer"
        ref={drawerRef}
        className={styles.drawer}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        aria-hidden={!open}
      >
        <NavList operatorName={operatorName} badgeCount={badgeCount} onNavigate={() => setOpen(false)} closeButtonRef={closeButtonRef} />
      </aside>
    </>
  );

  return (
    <>
      <button
        ref={burgerRef}
        type="button"
        className={styles.burger}
        aria-label="Ouvrir le menu"
        aria-expanded={open}
        aria-controls="operator-drawer"
        onClick={() => setOpen(true)}
      >
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>

      {/* .hdr a un backdrop-filter, qui devient le containing block de tout
          descendant position:fixed — le voile et le tiroir se retrouvaient
          confinés à la hauteur du header (64px) au lieu de couvrir l'écran. */}
      {portalTarget ? createPortal(overlay, portalTarget) : null}
    </>
  );
}
