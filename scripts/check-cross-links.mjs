#!/usr/bin/env node
// Standalone CLI mirror of tests/cross-links.test.ts.
// Exits 0 on pass, 1 on any dangling reference.

import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import matter from 'gray-matter';

async function loadAllStubs(dir, filename) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    try {
      const raw = await readFile(join(dir, entry.name, filename), 'utf-8');
      out.push({ id: entry.name, data: matter(raw).data });
    } catch {}
  }
  return out;
}

async function loadVariants(rootDir) {
  const out = [];
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

const errors = [];
const applied = await loadAllStubs('src/content/applied', 'stub.md');
const variants = await loadVariants('src/content/primitives');
const appliedSet = new Set(applied.map(a => a.id));
const variantSet = new Set(variants.map(v => `${v.family}/${v.slug}`));

for (const a of applied) {
  for (const dec of (a.data.decomposition ?? [])) {
    if (!variantSet.has(`${dec.family}/${dec.variant}`)) {
      errors.push(`applied/${a.id} → ${dec.family}/${dec.variant} (decomposition)`);
    }
  }
}
for (const v of variants) {
  for (const use of (v.data.in_the_wild ?? [])) {
    if (!appliedSet.has(use.applied)) {
      errors.push(`primitives/${v.family}/${v.slug} → ${use.applied} (in_the_wild)`);
    }
  }
}

if (errors.length) {
  console.error('cross-link check FAILED:');
  for (const e of errors) console.error('  ' + e);
  process.exit(1);
}
console.log(`cross-link check OK (${applied.length} applied, ${variants.length} variants)`);
