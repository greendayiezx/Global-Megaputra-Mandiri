/**
 * Soft curve that hands a photo hero over to the page, with a thin blue line along its edge
 * and a short highlight that travels the line on a loop (static for reduced motion).
 */
const EDGE = 'M0 44C360 84 1080 4 1440 44';

export function HeroCurve() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1440 80"
      preserveAspectRatio="none"
      className="text-canvas absolute inset-x-0 -bottom-px h-10 w-full sm:h-14 lg:h-20"
    >
      <path fill="currentColor" d={`${EDGE}V80H0Z`} />
      <path
        d={EDGE}
        fill="none"
        stroke="#2563eb"
        strokeOpacity="0.85"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d={EDGE}
        className="hero-curve-flow"
        fill="none"
        stroke="#7dd3fc"
        strokeWidth="3.5"
        strokeLinecap="round"
        pathLength={1000}
        strokeDasharray="180 820"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
