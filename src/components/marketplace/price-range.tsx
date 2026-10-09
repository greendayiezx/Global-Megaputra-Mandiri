'use client';

import { useState } from 'react';

const rupiah = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;

/**
 * Two-thumb monthly-price slider for a GET filter form. A thumb left at its bound submits
 * nothing, so the URL only carries the limits the user actually set.
 */
export function PriceRange({
  min,
  max,
  step,
  defaultLow,
  defaultHigh,
}: {
  min: number;
  max: number;
  step: number;
  defaultLow: number | null;
  defaultHigh: number | null;
}) {
  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  const [low, setLow] = useState(clamp(defaultLow ?? min));
  const [high, setHigh] = useState(clamp(defaultHigh ?? max));
  const pct = (n: number) => ((n - min) / (max - min)) * 100;

  const thumb =
    'pointer-events-none absolute inset-0 h-5 w-full appearance-none bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-primary [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-[0_0_0_3px_white]';

  return (
    <div>
      <div className="text-fg-secondary flex items-center justify-between gap-2 text-[13px]">
        <span>{rupiah(low)}</span>
        <span aria-hidden="true">—</span>
        <span>
          {rupiah(high)}
          {high === max ? '+' : ''}
        </span>
      </div>
      <div className="relative mt-3 h-5">
        <div className="bg-line absolute top-1/2 right-0 left-0 h-1 -translate-y-1/2 rounded-full" />
        <div
          className="bg-primary absolute top-1/2 h-1 -translate-y-1/2 rounded-full"
          style={{ left: `${pct(low)}%`, right: `${100 - pct(high)}%` }}
        />
        <input
          type="range"
          aria-label="Harga bulanan minimal"
          min={min}
          max={max}
          step={step}
          value={low}
          name={low > min ? 'minMonthly' : undefined}
          onChange={(e) => setLow(Math.min(Number(e.target.value), high - step))}
          className={thumb}
        />
        <input
          type="range"
          aria-label="Harga bulanan maksimal"
          min={min}
          max={max}
          step={step}
          value={high}
          name={high < max ? 'maxMonthly' : undefined}
          onChange={(e) => setHigh(Math.max(Number(e.target.value), low + step))}
          className={thumb}
        />
      </div>
    </div>
  );
}
