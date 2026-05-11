import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

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
  id: z.string().regex(/^[a-z0-9_-]+$/, 'kebab-case or test ID'),
  name: z.string(),
  player_verb: z.string(),
  canonical_game: z.string(),
  canonical_year: z.number().int().min(1947).max(2100),
  canonical_platform: z.string(),
  canonical_developer: z.string(),
  era_bucket: eraEnum,
  taxonomy_node: z.string(),
  status: z.enum(['stub', 'researched', 'speced', 'built']),
  orientation: z.enum(['auto', 'portrait', 'landscape']).default('auto'),
});

export const collections = {
  primitives: defineCollection({
    loader: glob({ pattern: '**/index.md', base: './src/content/primitives' }),
    schema: primitiveStub,
  }),
};
