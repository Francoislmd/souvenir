import styles from "@/app/(operator)/operator.module.css";
import { NavList } from "@/components/operator/NavList";

export function Sidebar({ operatorName, badgeCount }: { operatorName: string; badgeCount: number }) {
  return (
    <aside className={styles.side}>
      <NavList operatorName={operatorName} badgeCount={badgeCount} />
    </aside>
  );
}
