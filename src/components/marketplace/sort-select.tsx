'use client';

import { Label, Select } from '@/components/ui/field';

/** Sort control that belongs to the filter form (via `form`) and applies immediately. */
export function SortSelect({
  id,
  formId,
  value,
  options,
}: {
  id: string;
  formId: string;
  value: string;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex items-center gap-2">
      <Label htmlFor={id} className="text-fg-muted mb-0 shrink-0">
        Urutkan
      </Label>
      <Select
        id={id}
        name="sort"
        form={formId}
        defaultValue={value}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="h-10 min-w-48 text-sm"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
    </div>
  );
}
