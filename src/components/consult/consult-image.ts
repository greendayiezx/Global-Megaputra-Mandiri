import 'server-only';

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  CONSULT_CARD_IMAGE,
  CONSULT_HERO_IMAGE,
  CONSULT_IMAGE,
  CONSULT_IMAGE_FALLBACK,
} from '@/config/contact';

const inPublic = (path: string) => existsSync(join(process.cwd(), 'public', path));

/** First consultation photo present in public/images for the slot, else a stock stand-in. */
export function consultImage(slot: 'hero' | 'card'): string {
  const order =
    slot === 'card' ? [CONSULT_CARD_IMAGE, CONSULT_IMAGE] : [CONSULT_HERO_IMAGE, CONSULT_IMAGE];
  const found = order.find(inPublic);
  return found ? encodeURI(found) : CONSULT_IMAGE_FALLBACK;
}
