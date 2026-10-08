import { NextResponse } from 'next/server';
import { getDb, pingDb } from '@/db/client';

export const dynamic = 'force-dynamic';

/** Liveness + database check. Exposes no versions, hosts, or configuration. */
export async function GET() {
  let database: 'up' | 'down' = 'down';
  try {
    database = (await pingDb(await getDb())) ? 'up' : 'down';
  } catch {
    database = 'down';
  }
  const status = database === 'up' ? 'ok' : 'degraded';
  return NextResponse.json(
    { status, database, timestamp: new Date().toISOString() },
    { status: status === 'ok' ? 200 : 503, headers: { 'Cache-Control': 'no-store' } },
  );
}
