import { defineCollection, z } from 'astro:content';

export const eraEnum = z.enum([
  'PoC',
  'arcade-early',
  'arcade-golden-age',
  'home-8bit',
  'home-16bit',
  'early-3d',
  'modern-console-pc',
  'indie-modern',
]);

export type Era =
  | 'PoC'
  | 'arcade-early'
  | 'arcade-golden-age'
  | 'home-8bit'
  | 'home-16bit'
  | 'early-3d'
  | 'modern-console-pc'
  | 'indie-modern';

const primitiveStub = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/, 'kebab-case only'),
  name: z.string(),
  player_verb: z.string(),
  canonical_game: z.string(),
  canonical_year: z.number().int().min(1958).max(2100),
  canonical_platform: z.string(),
  canonical_developer: z.string(),
  era_bucket: eraEnum,
  taxonomy_node: z.string(),
  status: z.enum(['stub', 'researched', 'speced', 'built']),
  orientation: z.enum(['auto', 'portrait', 'landscape']).default('auto'),
});

export const collections = {
  primitives: defineCollection({
    type: 'content',
    schema: primitiveStub,
  }),
};
