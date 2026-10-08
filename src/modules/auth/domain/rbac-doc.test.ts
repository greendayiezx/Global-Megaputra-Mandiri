import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { renderRbacMarkdown } from './rbac-doc';

describe('RBAC documentation', () => {
  it('docs/06-rbac-matrix.md is in sync with the code (run `npm run docs:rbac`)', () => {
    const onDisk = readFileSync(resolve(process.cwd(), 'docs/06-rbac-matrix.md'), 'utf8');
    expect(onDisk.replace(/\r\n/g, '\n')).toBe(renderRbacMarkdown());
  });
});
