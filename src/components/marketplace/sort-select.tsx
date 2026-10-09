'use client';

import { SelectMenu } from '@/components/ui/select-menu';

/** Sort control that belongs to the filter form (via `form`) and applies immediately. */
export function SortSelect({
  formId,
  value,
  options,
}: {
  id?: string;
  formId: string;
  value: string;
  options: { value: string; label: string }[];
}) {
  return (
    <SelectMenu
      inline
      label="Urutkan"
      name="sort"
      form={formId}
      defaultValue={value}
      options={options}
      onValueChange={(_, input) => input.form?.requestSubmit()}
      className="min-w-64"
    />
  );
}
