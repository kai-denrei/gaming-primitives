import type { Era } from '../content.config';

export const eraMeta: Record<Era, {
  label: string;
  range: string;
  cssVar: string;
  order: number;
}> = {
  'PoC':                { label: 'Proof of Concept',  range: 'pre-1971',   cssVar: '--era-poc',           order: 0 },
  'arcade-early':       { label: 'Arcade Early',      range: '1971–1979',  cssVar: '--era-arcade-early',  order: 1 },
  'arcade-golden-age':  { label: 'Arcade Golden Age', range: '1980–1985',  cssVar: '--era-arcade-golden', order: 2 },
  'home-8bit':          { label: 'Home 8-bit',        range: '1982–1990',  cssVar: '--era-home-8bit',     order: 3 },
  'home-16bit':         { label: 'Home 16-bit',       range: '1987–1995',  cssVar: '--era-home-16bit',    order: 4 },
  'early-3d':           { label: 'Early 3D',          range: '1993–1999',  cssVar: '--era-early-3d',      order: 5 },
  'modern-console-pc':  { label: 'Modern',            range: '2000–2012',  cssVar: '--era-modern',        order: 6 },
  'indie-modern':       { label: 'Indie Modern',      range: '2008–today', cssVar: '--era-indie',         order: 7 },
};

export const erasByOrder = (Object.keys(eraMeta) as Era[]).sort(
  (a, b) => eraMeta[a].order - eraMeta[b].order
);
