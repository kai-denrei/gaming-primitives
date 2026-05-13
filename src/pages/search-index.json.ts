import { getCollection } from 'astro:content';

// Build-time search index. One JSON record per family / variant / applied.
// Fetched once by SearchOverlay; filtered in-browser. Designed for ~150 records;
// scales to a few thousand before we'd need a real search index.

export async function GET() {
  const families = await getCollection('primitiveFamilies');
  const variants = await getCollection('primitiveVariants');
  const applied  = await getCollection('applied');

  const records = [
    ...families.map((f: any) => ({
      type: 'family',
      url: `/p/${f.data.slug}/`,
      title: f.data.name,
      body: f.data.oneliner,
      tags: [String(f.data.order).padStart(2, '0')],
    })),
    ...variants.map((v: any) => {
      const [family, , slug] = v.id.split('/');
      return {
        type: 'variant',
        url: `/p/${family}/#${slug}`,
        title: `${v.data.name}  ·  ${family}`,
        body: v.data.description,
        tags: [family, v.data.status, ...((v.data.in_the_wild || []).map((w: any) => w.applied))],
      };
    }),
    ...applied.filter((a: any) => a.id !== '__test__' && !a.id.startsWith('__test__/')).map((a: any) => ({
      type: 'applied',
      url: `/a/${a.id}/`,
      title: a.data.name,
      body: `${a.data.player_verb}. ${a.data.canonical_game} (${a.data.canonical_year}, ${a.data.canonical_developer}).`,
      tags: [
        a.data.canonical_game,
        a.data.canonical_developer,
        String(a.data.canonical_year),
        a.data.canonical_platform,
        a.data.era_bucket,
        a.data.taxonomy_node,
        a.data.status,
      ].filter(Boolean),
    })),
  ];

  return new Response(JSON.stringify(records), {
    headers: { 'Content-Type': 'application/json' },
  });
}
