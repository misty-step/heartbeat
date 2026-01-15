/**
 * InkAtmosphere - Kyoto Moss Design System
 *
 * Organic sumi-ink blur shapes for atmospheric depth.
 * Inspired by Japanese ink wash paintings (sumi-e).
 *
 * NO gradients, NO glow effects - just soft blurred shapes
 * that create subtle depth and visual interest.
 */
export function InkAtmosphere() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
      {/* Large ink wash - top right (moss green) */}
      <div
        className="absolute top-[-15%] right-[-10%] w-[70vw] h-[70vw] max-w-[900px] max-h-[900px] rounded-full"
        style={{
          background: "var(--color-text-primary)",
          opacity: 0.025,
          filter: "blur(100px)",
        }}
      />

      {/* Secondary ink wash - bottom left (clay accent) */}
      <div
        className="absolute bottom-[5%] left-[-5%] w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] rounded-full"
        style={{
          background: "var(--color-text-tertiary)",
          opacity: 0.02,
          filter: "blur(80px)",
        }}
      />
    </div>
  );
}
