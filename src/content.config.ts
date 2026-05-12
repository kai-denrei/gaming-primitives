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
  decomposition: z.array(z.object({
    family: z.string(),
    variant: z.string(),
    config: z.string().default(''),
  })).optional(),
});

const knobSpec = z.discriminatedUnion('type', [
  z.object({ type: z.literal('float'),  id: z.string(), min: z.number(), max: z.number(), default: z.number(), step: z.number().optional(), unit: z.string().optional(), label: z.string().optional() }),
  z.object({ type: z.literal('int'),    id: z.string(), min: z.number().int(), max: z.number().int(), default: z.number().int(), step: z.number().int().optional(), unit: z.string().optional(), label: z.string().optional() }),
  z.object({ type: z.literal('toggle'), id: z.string(), default: z.boolean(), on_label: z.string(), off_label: z.string(), label: z.string().optional() }),
  z.object({ type: z.literal('enum'),   id: z.string(), options: z.array(z.string()).min(2), default: z.string(), label: z.string().optional() }),
]);

const inTheWild = z.array(z.object({
  applied: z.string(),   // applied/<id>
  note: z.string(),
}));

const primitiveFamily = z.object({
  slug: z.string().regex(/^[a-z][a-z0-9-]+$/),
  name: z.string(),
  oneliner: z.string(),
  variants: z.array(z.string()).min(1),
});

const primitiveVariant = z.object({
  slug: z.string().regex(/^[a-z][a-z0-9-]+$/),
  name: z.string(),
  status: z.enum(['built', 'stubbed']),
  description: z.string(),
  parameters: z.array(knobSpec).optional(),
  in_the_wild: inTheWild.optional(),
  code_anchor: z.string().optional(),
});

export const collections = {
  applied: defineCollection({
    loader: glob({
      pattern: '**/stub.md',
      base: './src/content/applied',
      generateId: ({ entry }) => entry.replace(/\/stub\.md$/, '').replace(/\.md$/, ''),
    }),
    schema: primitiveStub,
  }),
  primitiveFamilies: defineCollection({
    loader: glob({
      pattern: '**/family.md',
      base: './src/content/primitives',
      generateId: ({ entry }) => entry.replace(/\/family\.md$/, ''),
    }),
    schema: primitiveFamily,
  }),
  primitiveVariants: defineCollection({
    loader: glob({
      pattern: '**/variants/*.md',
      base: './src/content/primitives',
      generateId: ({ entry }) => entry.replace(/\.md$/, ''),  // motion/variants/rotate-thrust
    }),
    schema: primitiveVariant,
  }),
};
