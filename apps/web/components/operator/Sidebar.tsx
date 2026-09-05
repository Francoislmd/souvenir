import styles from "@/app/(operator)/operator.module.css";
import { NavList } from "@/components/operator/NavList";

export function Sidebar({ operatorName }: { operatorName: string }) {
  return (
    <aside className={styles.side}>
      <NavList operatorName={operatorName} />
    </aside>
  );
}
