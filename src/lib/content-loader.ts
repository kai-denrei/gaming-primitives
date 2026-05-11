// Each primitive lives in src/content/primitives/{id}/ with up to three files:
// stub.md (collection entry), research.md, spec.md. Astro's collection only
// reads the first; this helper grabs the others at render time.

const allMd = import.meta.glob<{ rawContent: () => string; Content: any }>(
  '/src/content/primitives/*/*.md',
  { eager: true }
);

export type PrimitiveExtras = {
  research?: { rawContent: string };
  spec?: { rawContent: string };
};

export function loadExtras(id: string): PrimitiveExtras {
  const out: PrimitiveExtras = {};
  for (const [path, mod] of Object.entries(allMd)) {
    if (!path.includes(`/${id}/`)) continue;
    if (path.endsWith('/research.md')) {
      out.research = { rawContent: (mod as any).rawContent?.() ?? '' };
    } else if (path.endsWith('/spec.md')) {
      out.spec = { rawContent: (mod as any).rawContent?.() ?? '' };
    }
  }
  return out;
}
