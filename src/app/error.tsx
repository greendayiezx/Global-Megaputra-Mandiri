'use client';

import { RotateCcw, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/primitives';

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  // Error details are logged on the server and never rendered to users.
  return (
    <div className="container-page py-16">
      <EmptyState
        icon={TriangleAlert}
        title="Terjadi kesalahan"
        description="Maaf, halaman ini gagal dimuat. Silakan coba lagi."
        action={
          <Button onClick={reset}>
            <RotateCcw aria-hidden="true" /> Coba lagi
          </Button>
        }
      />
    </div>
  );
}
