import 'server-only';

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { CONSULT_IMAGE, CONSULT_IMAGE_FALLBACK } from '@/config/contact';

/** The consultation photo if it is in public/images, else a neutral stand-in. */
export function consultImage(): string {
  return existsSync(join(process.cwd(), 'public', CONSULT_IMAGE))
    ? encodeURI(CONSULT_IMAGE)
    : CONSULT_IMAGE_FALLBACK;
}
