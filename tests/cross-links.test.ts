import { describe, it, expect } from 'vitest';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import matter from 'gray-matter';

async function loadAllStubs(dir: string, filename: string): Promise<{ id: string; data: any }[]> {
  const out: { id: string; data: any }[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    try {
      const raw = await readFile(join(dir, entry.name, filename), 'utf-8');
      out.push({ id: entry.name, data: matter(raw).data });
    } catch {}
  }
  return out;
}

async function loadVariants(rootDir: string): Promise<{ family: string; slug: string; data: any }[]> {
  const out: { family: string; slug: string; data: any }[] = [];
  for (const fam of await readdir(rootDir, { withFileTypes: true })) {
    if (!fam.isDirectory()) continue;
    const variantsDir = join(rootDir, fam.name, 'variants');
    try {
      for (const file of await readdir(variantsDir)) {
        if (!file.endsWith('.md')) continue;
        const raw = await readFile(join(variantsDir, file), 'utf-8');
        out.push({ family: fam.name, slug: file.replace(/\.md$/, ''), data: matter(raw).data });
      }
    } catch {}
  }
  return out;
}

describe('cross-link integrity', () => {
  it('every applied.decomposition entry resolves to an existing family + variant', async () => {
    const applied = await loadAllStubs('src/content/applied', 'stub.md');
    const variants = await loadVariants('src/content/primitives');
    const variantSet = new Set(variants.map(v => `${v.family}/${v.slug}`));

    for (const a of applied) {
      for (const dec of (a.data.decomposition ?? [])) {
        expect(variantSet.has(`${dec.family}/${dec.variant}`), `${a.id} → ${dec.family}/${dec.variant} not found`).toBe(true);
      }
    }
  });

  it('every variant.in_the_wild entry resolves to an existing applied id', async () => {
    const applied = await loadAllStubs('src/content/applied', 'stub.md');
    const variants = await loadVariants('src/content/primitives');
    const appliedSet = new Set(applied.map(a => a.id));

    for (const v of variants) {
      for (const use of (v.data.in_the_wild ?? [])) {
        expect(appliedSet.has(use.applied), `${v.family}/${v.slug}.in_the_wild → ${use.applied} not found`).toBe(true);
      }
    }
  });
});
