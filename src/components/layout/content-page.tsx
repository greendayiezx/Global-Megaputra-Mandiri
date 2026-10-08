import type { ReactNode } from 'react';
import { Breadcrumb } from '@/components/ui/primitives';

export function ContentPage({
  title,
  description,
  crumb,
  children,
  wide = false,
}: {
  title: string;
  description?: string;
  crumb: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="container-page py-6 md:py-8">
      <Breadcrumb items={[{ label: 'Beranda', href: '/' }, { label: crumb }]} />
      <div className={wide ? 'mt-4' : 'mt-4 max-w-3xl'}>
        <h1 className="text-[28px] font-bold md:text-[32px]">{title}</h1>
        {description && <p className="text-fg-muted mt-2 text-[17px]">{description}</p>}
        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}

/** Long-form text styles without a typography plugin. */
export function Prose({ children }: { children: ReactNode }) {
  return (
    <div className="text-fg-secondary [&_h2]:text-fg space-y-4 [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold [&_li]:mt-1.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5">
      {children}
    </div>
  );
}
