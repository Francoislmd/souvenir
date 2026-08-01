import styles from "@/app/(operator)/operator.module.css";
import { publicationStatusLabel, type PublicationStatus } from "@/lib/sorties";

export function StatusTag({ status }: { status: PublicationStatus }) {
  return <span className={`${styles.statusTag} ${styles[status]}`}>{publicationStatusLabel(status)}</span>;
}
