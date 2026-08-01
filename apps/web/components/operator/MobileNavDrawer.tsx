"use client";

import { useEffect, useState } from "react";
import styles from "@/app/(operator)/operator.module.css";
import { NavList } from "@/components/operator/NavList";

export function MobileNavDrawer({ operatorName, badgeCount }: { operatorName: string; badgeCount: number }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.classList.toggle("nav-open", open);
    document.body.style.overflow = open ? "hidden" : "";
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
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

  useEffect(() => {
    return () => {
      document.body.classList.remove("nav-open");
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <>
      <button
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

      {open ? <div className={styles.scrim} onClick={() => setOpen(false)} /> : null}

      <aside id="operator-drawer" className={styles.drawer}>
        <NavList operatorName={operatorName} badgeCount={badgeCount} onNavigate={() => setOpen(false)} />
      </aside>
    </>
  );
}
