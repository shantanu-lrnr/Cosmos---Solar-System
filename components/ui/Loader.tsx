'use client';
export default function Loader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-cosmos-bg">
      <div className="relative w-40 h-40">
        <div className="cosmic-ring" style={{ inset: 0 }} />
        <div className="cosmic-ring" style={{ inset: 12, animationDuration: '6s', animationDirection: 'reverse' }} />
        <div className="cosmic-ring" style={{ inset: 24, animationDuration: '4s' }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-cosmos-accent shadow-[0_0_24px_#7dd3fc]" />
        </div>
      </div>
      <div className="absolute bottom-16 text-xs tracking-[0.4em] uppercase shimmer-text">
        Calibrating Cosmos
      </div>
    </div>
  );
}
