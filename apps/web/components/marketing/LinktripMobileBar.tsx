"use client";

import { useEffect, useState } from "react";
import styles from "@/app/linktrip.module.css";

export function LinktripMobileBar() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    function onScroll() {
      setShow(window.scrollY > 560);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className={`${styles.mbar} ${show ? styles.mbarShow : ""}`}>
      <div className={styles.mbTxt}>
        <div className={styles.t1}>Créez votre boutique</div>
        <div className={styles.t2}>Gratuit pour démarrer</div>
      </div>
      <a href="/signup" className={`${styles.btn} ${styles.btnPrimary}`}>Créer ma boutique</a>
    </div>
  );
}
