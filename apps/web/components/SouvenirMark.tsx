type Size = "sm" | "md" | "lg";

const SIZES: Record<Size, { tw: number; th: number }> = {
  sm: { tw: 28, th: 24 },
  md: { tw: 36, th: 31 },
  lg: { tw: 46, th: 40 },
};

export function SouvenirMark({ size = "sm", dark = false }: { size?: Size; dark?: boolean }) {
  const { tw, th } = SIZES[size];
  const pad = Math.round(tw * 0.13);
  const padB = Math.round(tw * 0.33);

  return (
    <span
      style={{
        display: "inline-block",
        background: "#fff",
        padding: `${pad}px ${pad}px ${padB}px`,
        borderRadius: 3,
        boxShadow: dark
          ? "0 7px 18px rgba(0,0,0,.32)"
          : "0 7px 18px rgba(27,39,51,.2)",
        transform: "rotate(-5deg)",
        flexShrink: 0,
      }}
    >
      <i
        style={{
          display: "block",
          width: tw,
          height: th,
          borderRadius: 1,
          background:
            "linear-gradient(135deg,#2f5fd0 0%,#5b8bf0 50%,#d64b3f 130%)",
        }}
      />
    </span>
  );
}
