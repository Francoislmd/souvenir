import styles from "@/app/(operator)/operator.module.css";
import { NavList } from "@/components/operator/NavList";

export function Sidebar(props: { operatorName: string; email: string; logoUrl: string | null; storeHref: string }) {
  return (
    <aside className={styles.side}>
      <NavList {...props} />
    </aside>
  );
}
