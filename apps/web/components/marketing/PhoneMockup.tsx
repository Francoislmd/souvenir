import { LogoMark } from "@/components/brand/Logo";

const TILES = [
  "linear-gradient(135deg, #7DD3FC 0%, #3B82F6 100%)",
  "linear-gradient(135deg, #C4B5FD 0%, #4F46E5 100%)",
  "linear-gradient(135deg, #A7F3D0 0%, #16A34A 100%)",
  "linear-gradient(135deg, #BAE6FD 0%, #6366F1 100%)",
  "linear-gradient(135deg, #FDE68A 0%, #F59E0B 100%)",
  "linear-gradient(135deg, #BFDBFE 0%, #38BDF8 100%)",
];

export function PhoneMockup({ className = "" }: { className?: string }) {
  return (
    <div className={`w-[260px] rounded-[2.25rem] border-[6px] border-ink bg-white p-3 shadow-2xl sm:w-[280px] ${className}`}>
      <div className="flex items-center gap-2.5 px-1 pb-3">
        <LogoMark className="h-8 w-8 shrink-0" />
        <div className="flex flex-col leading-tight">
          <span className="text-xs font-semibold text-ink">Vol Passion Annecy</span>
          <span className="text-[11px] text-ink-2">Le vol de Léa 🤩 · Annecy</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1">
        {TILES.map((gradient, index) => (
          <div key={gradient} className="relative aspect-square overflow-hidden rounded-[6px]" style={{ background: gradient }}>
            {index === 5 ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm">
                  <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3">
                    <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="2" />
                    <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </span>
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between rounded-full bg-brand px-4 py-2.5 text-xs font-semibold text-white shadow-card">
        <span>Débloquer mes souvenirs</span>
        <span>29 €</span>
      </div>
    </div>
  );
}
