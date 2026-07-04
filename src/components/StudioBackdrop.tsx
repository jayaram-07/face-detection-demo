/**
 * Quiet studio backdrop: a faint contact-sheet grid on paper with a soft
 * light-table vignette. Static and low-contrast — it sets a surface, it
 * doesn't perform.
 */
export function StudioBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
      {/* fine registration grid */}
      <div
        className="absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(23,21,15,0.04) 1px, transparent 1px),' +
            'linear-gradient(to bottom, rgba(23,21,15,0.04) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
      {/* light-table glow, warm center falling to paper edges */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 90% at 50% 0%, rgba(255,255,255,0.55), transparent 60%),' +
            'radial-gradient(100% 100% at 50% 120%, rgba(23,21,15,0.05), transparent 55%)',
        }}
      />
    </div>
  );
}
