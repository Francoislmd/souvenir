import styles from "@/app/(marketing)/landing.module.css";

const ARCADE_SRC = "https://demo.arcade.software/XiV6muU0BY6QMpsQBZZw?embed&embed_mobile=tab&embed_desktop=inline&show_copy_link=true";

export function ArcadeEmbed() {
  return (
    <div className={styles.arcadeFrame}>
      <div style={{ position: "relative", paddingBottom: "calc(53.0994% + 41px)", height: 0, width: "100%" }}>
        <iframe
          src={ARCADE_SRC}
          title="Acheter et télécharger les photos d'une activité"
          frameBorder={0}
          loading="lazy"
          allowFullScreen
          allow="clipboard-write; autoplay"
          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", colorScheme: "light" }}
        />
      </div>
    </div>
  );
}

export default ArcadeEmbed;
