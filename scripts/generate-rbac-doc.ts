import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderRbacMarkdown } from '../src/modules/auth/domain/rbac-doc';

const out = resolve(process.cwd(), 'docs/06-rbac-matrix.md');
writeFileSync(out, renderRbacMarkdown());
console.warn(`wrote ${out}`);
