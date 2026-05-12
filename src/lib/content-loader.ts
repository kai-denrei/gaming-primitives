// Each applied primitive lives in src/content/applied/{id}/ with up to three files:
// stub.md (collection entry), research.md, spec.md. Astro's collection only
// reads the first; this helper reads the other two from disk at build time.
//
// Uses node:fs (not import.meta.glob) so it runs in both Astro's build context
// and a plain Vitest test runner.

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const PRIMS = join(HERE, '..', 'content', 'applied');

export type PrimitiveExtras = {
  research?: { rawContent: string };
  spec?: { rawContent: string };
};

export function loadExtras(id: string): PrimitiveExtras {
  const out: PrimitiveExtras = {};
  const r = join(PRIMS, id, 'research.md');
  const s = join(PRIMS, id, 'spec.md');
  if (existsSync(r)) out.research = { rawContent: readFileSync(r, 'utf8') };
  if (existsSync(s)) out.spec = { rawContent: readFileSync(s, 'utf8') };
  return out;
}
