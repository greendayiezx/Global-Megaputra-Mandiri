'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { whatsappLink } from '@/config/contact';
import { WhatsAppIcon } from './whatsapp-icon';

const NEEDS = ['Rumah', 'Usaha / kantor', 'Sekolah / kursus', 'Gaming / streaming', 'Lainnya'];
const DEVICES = ['1–3 perangkat', '4–8 perangkat', 'Lebih dari 8 perangkat', 'Belum tahu'];
const BUDGETS = [
  'Di bawah Rp200.000/bulan',
  'Rp200.000–350.000/bulan',
  'Rp350.000–500.000/bulan',
  'Di atas Rp500.000/bulan',
  'Belum tahu',
];

/**
 * Turns the answers into a tidy WhatsApp message. Nothing is sent to or stored on the GMM
 * server: the visitor's own WhatsApp opens with the text ready to send.
 */
export function ConsultForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const v = (k: string) => String(f.get(k) ?? '').trim();
    const next: Record<string, string> = {};
    if (v('name').length < 2) next.name = 'Isi nama Anda.';
    if (v('location').length < 3) next.location = 'Isi kelurahan/kecamatan dan kota.';
    setErrors(next);
    if (Object.keys(next).length) return;

    const lines = [
      'Halo GMM, saya ingin konsultasi internet.',
      '',
      `Nama: ${v('name')}`,
      `Lokasi pemasangan: ${v('location')}`,
      `Kebutuhan: ${v('need')}`,
      `Jumlah perangkat: ${v('devices')}`,
      `Anggaran: ${v('budget')}`,
      v('current') ? `Provider saat ini: ${v('current')}` : null,
      v('note') ? `Catatan: ${v('note')}` : null,
    ].filter((l) => l !== null);
    window.open(whatsappLink(lines.join('\n')), '_blank', 'noopener,noreferrer');
  };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id="c-name" label="Nama" required error={errors.name}>
          {(aria) => <Input {...aria} name="name" autoComplete="name" maxLength={80} />}
        </Field>
        <Field
          id="c-location"
          label="Lokasi pemasangan"
          required
          hint="Kelurahan/kecamatan dan kota"
          error={errors.location}
        >
          {(aria) => (
            <Input
              {...aria}
              name="location"
              maxLength={120}
              placeholder="Mis. Kebayoran Baru, Jakarta Selatan"
            />
          )}
        </Field>
        <Field id="c-need" label="Untuk apa internetnya?">
          {(aria) => (
            <Select {...aria} name="need" defaultValue={NEEDS[0]}>
              {NEEDS.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </Select>
          )}
        </Field>
        <Field id="c-devices" label="Jumlah perangkat">
          {(aria) => (
            <Select {...aria} name="devices" defaultValue={DEVICES[0]}>
              {DEVICES.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </Select>
          )}
        </Field>
        <Field id="c-budget" label="Anggaran per bulan">
          {(aria) => (
            <Select {...aria} name="budget" defaultValue={BUDGETS[1]}>
              {BUDGETS.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </Select>
          )}
        </Field>
        <Field id="c-current" label="Provider saat ini" hint="Opsional">
          {(aria) => (
            <Input {...aria} name="current" maxLength={60} placeholder="Kosongkan bila belum ada" />
          )}
        </Field>
      </div>
      <Field id="c-note" label="Ceritakan kendala atau pertanyaan Anda" hint="Opsional">
        {(aria) => (
          <Textarea
            {...aria}
            name="note"
            maxLength={600}
            placeholder="Mis. sering putus saat meeting, butuh untuk 2 lantai…"
          />
        )}
      </Field>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-fg-muted text-[13px]">
          Isian tidak disimpan di server GMM; langsung menjadi pesan WhatsApp yang Anda kirim
          sendiri.
        </p>
        <Button
          type="submit"
          size="lg"
          className="shrink-0 bg-[#25D366] hover:bg-[#1ebe5b] active:bg-[#1aa851]"
        >
          <WhatsAppIcon className="size-5" /> Kirim lewat WhatsApp
        </Button>
      </div>
    </form>
  );
}
