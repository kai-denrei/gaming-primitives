// scripts/gen-stubs.mjs
// Reads Wave-0 entries from research-queue.md and writes one
// src/content/primitives/{id}/stub.md per entry with minimal frontmatter
// derived from taxonomy.md + research-queue.md. Bodies are 3-sentence
// placeholders the Research agent will overwrite later.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const queue = readFileSync(join(ROOT, 'research-queue.md'), 'utf8');
const taxonomy = readFileSync(join(ROOT, 'taxonomy.md'), 'utf8');

// Hand-curated metadata for the 33 Wave-0 primitives. Year/platform/developer
// pulled from the existing taxonomy. era_bucket and priority from
// research-queue.md.
const SEED = {
  'lunar-lander-thrust':           { name: 'Lunar Lander Thrust',           game: 'Lunar Lander',           year: 1979, platform: 'Arcade',    dev: 'Atari',                                era: 'arcade-early',       node: 'MOMENTUM/momentum-thrust' },
  'asteroids-rotate-thrust':       { name: 'Asteroids Rotate-Thrust',       game: 'Asteroids',              year: 1979, platform: 'Arcade',    dev: 'Atari / Lyle Rains, Ed Logg',          era: 'arcade-early',       node: 'MOMENTUM/momentum-thrust' },
  'pong-paddle-volley':            { name: 'Pong Paddle Volley',            game: 'Pong',                   year: 1972, platform: 'Arcade',    dev: 'Atari / Allan Alcorn',                 era: 'arcade-early',       node: 'MOMENTUM/momentum-conservation' },
  'breakout-paddle-reflect':       { name: 'Breakout Paddle Reflect',       game: 'Breakout',               year: 1976, platform: 'Arcade',    dev: 'Atari / Steve Wozniak',                era: 'arcade-early',       node: 'MOMENTUM/momentum-conservation' },
  'space-invaders-vertical-shot':  { name: 'Space Invaders Vertical Shot',  game: 'Space Invaders',         year: 1978, platform: 'Arcade',    dev: 'Taito / Tomohiro Nishikado',           era: 'arcade-early',       node: 'PROJECTILE/projectile-direct' },
  'pacman-power-pellet':           { name: 'Pac-Man Power Pellet',          game: 'Pac-Man',                year: 1980, platform: 'Arcade',    dev: 'Namco / Toru Iwatani',                 era: 'arcade-golden-age',  node: 'RULE/rule-inversion' },
  'qix-area-claim':                { name: 'Qix Area Claim',                game: 'Qix',                    year: 1981, platform: 'Arcade',    dev: 'Taito / Randy & Sandy Pfeiffer',       era: 'arcade-golden-age',  node: 'SPATIAL/spatial-claim' },
  'defender-radar-rescue':         { name: 'Defender Radar Rescue',         game: 'Defender',               year: 1981, platform: 'Arcade',    dev: 'Williams / Eugene Jarvis',             era: 'arcade-golden-age',  node: 'SPATIAL/spatial-traversal' },
  'robotron-twin-stick':           { name: 'Robotron Twin Stick',           game: 'Robotron: 2084',         year: 1982, platform: 'Arcade',    dev: 'Williams / Eugene Jarvis, Larry DeMar', era: 'arcade-golden-age', node: 'PROJECTILE/projectile-direct' },
  'donkey-kong-platform-arc':      { name: 'Donkey Kong Platform Arc',      game: 'Donkey Kong',            year: 1981, platform: 'Arcade',    dev: 'Nintendo / Shigeru Miyamoto',          era: 'arcade-golden-age',  node: 'SPATIAL/spatial-traversal' },
  'mario-platform-arc':            { name: 'Mario Platform Arc',            game: 'Super Mario Bros.',      year: 1985, platform: 'NES',       dev: 'Nintendo / Shigeru Miyamoto',          era: 'home-8bit',          node: 'SPATIAL/spatial-traversal' },
  'space-taxi-precision-thrust':   { name: 'Space Taxi Precision Thrust',   game: 'Space Taxi',             year: 1984, platform: 'C64',       dev: 'Muse Software / John F. Kutcher',      era: 'home-8bit',          node: 'MOMENTUM/momentum-thrust' },
  'boulder-dash-falling-rocks':    { name: 'Boulder Dash Falling Rocks',    game: 'Boulder Dash',           year: 1984, platform: 'Atari 800', dev: 'First Star / Peter Liepa, Chris Gray', era: 'home-8bit',          node: 'RULE/rule-emergence' },
  'lode-runner-dig-fall':          { name: 'Lode Runner Dig Fall',          game: 'Lode Runner',            year: 1983, platform: 'Apple II',  dev: 'Brøderbund / Doug Smith',              era: 'home-8bit',          node: 'SPATIAL/spatial-claim' },
  'tetris-line-clear':             { name: 'Tetris Line Clear',             game: 'Tetris',                 year: 1984, platform: 'Electronika 60', dev: 'Alexey Pajitnov',                 era: 'home-8bit',          node: 'PATTERN-MATCH/pattern-line' },
  'defender-of-the-crown-catapult':{ name: 'Defender of the Crown Catapult',game: 'Defender of the Crown', year: 1986, platform: 'Amiga',     dev: 'Cinemaware / Kellyn Beck',             era: 'home-8bit',          node: 'PROJECTILE/projectile-arc' },
  'lemmings-assign-roles':         { name: 'Lemmings Assign Roles',         game: 'Lemmings',               year: 1991, platform: 'Amiga',     dev: 'DMA Design / Mike Dailly, Russell Kay', era: 'home-16bit',        node: 'RULE/rule-emergence' },
  'populous-terraform':            { name: 'Populous Terraform',            game: 'Populous',               year: 1989, platform: 'Amiga',     dev: 'Bullfrog / Peter Molyneux',            era: 'home-16bit',         node: 'RULE/rule-modification' },
  'dune-2-rts-base':               { name: 'Dune II RTS Base',              game: 'Dune II',                year: 1992, platform: 'PC-DOS',    dev: 'Westwood / Joe Bostic, Aaron Powell',  era: 'home-16bit',         node: 'ECONOMY-LOOP/loop-extract-craft-build' },
  'worms-bazooka-wind':            { name: 'Worms Bazooka Wind',            game: 'Worms',                  year: 1995, platform: 'Amiga',     dev: 'Team17 / Andy Davidson',               era: 'home-16bit',         node: 'PROJECTILE/projectile-arc' },
  'pinball-flipper-deflect':       { name: 'Pinball Flipper Deflect',       game: 'Pinball (electromech.)', year: 1947, platform: 'Arcade',    dev: 'Gottlieb',                              era: 'arcade-early',       node: 'MOMENTUM/momentum-conservation' },
  'doom-bsp-arena':                { name: 'Doom BSP Arena',                game: 'Doom',                   year: 1993, platform: 'PC-DOS',    dev: 'id Software / Carmack, Romero, Hall',  era: 'early-3d',           node: 'SPATIAL/spatial-traversal' },
  'tomb-raider-tank-controls':     { name: 'Tomb Raider Tank Controls',     game: 'Tomb Raider',            year: 1996, platform: 'PS1',       dev: 'Core Design / Toby Gard',              era: 'early-3d',           node: 'SPATIAL/spatial-traversal' },
  'resident-evil-fixed-cam-survival': { name: 'Resident Evil Fixed-Cam Survival', game: 'Resident Evil', year: 1996, platform: 'PS1',      dev: 'Capcom / Shinji Mikami',               era: 'early-3d',           node: 'RESOURCE/resource-decay' },
  'portal-momentum-warp':          { name: 'Portal Momentum Warp',          game: 'Portal',                 year: 2007, platform: 'PC',       dev: 'Valve / Kim Swift, Jeep Barnett',      era: 'modern-console-pc',  node: 'SPATIAL/spatial-traversal' },
  'braid-time-rewind':             { name: 'Braid Time Rewind',             game: 'Braid',                  year: 2008, platform: 'Xbox 360', dev: 'Number None / Jonathan Blow',          era: 'modern-console-pc',  node: 'RULE/rule-modification' },
  'dark-souls-bonfire-recovery':   { name: 'Dark Souls Bonfire Recovery',   game: "Demon's Souls",          year: 2009, platform: 'PS3',      dev: 'FromSoftware / Hidetaka Miyazaki',     era: 'modern-console-pc',  node: 'ECONOMY-LOOP/loop-permadeath-procedural' },
  'slay-the-spire-deck-run':       { name: 'Slay the Spire Deck Run',       game: 'Slay the Spire',         year: 2019, platform: 'PC',       dev: 'Mega Crit / Anthony Giovannetti, Casey Yano', era: 'indie-modern', node: 'ECONOMY-LOOP/loop-permadeath-procedural' },
  'vampire-survivors-evolve':      { name: 'Vampire Survivors Evolve',      game: 'Vampire Survivors',      year: 2022, platform: 'PC',       dev: 'poncle / Luca Galante',                era: 'indie-modern',       node: 'ECONOMY-LOOP/loop-permadeath-procedural' },
  'baba-is-you-rewrite':           { name: 'Baba Is You Rewrite',           game: 'Baba Is You',            year: 2019, platform: 'PC',       dev: 'Hempuli / Arvi Teikari',               era: 'indie-modern',       node: 'RULE/rule-modification' },
  'patrick-parabox-nested':        { name: "Patrick's Parabox Nested",      game: "Patrick's Parabox",      year: 2022, platform: 'PC',       dev: 'Patrick Traynor',                       era: 'indie-modern',       node: 'RULE/rule-modification' },
  'obra-dinn-identity-grid':       { name: 'Obra Dinn Identity Grid',       game: 'Return of the Obra Dinn',year: 2018, platform: 'PC',       dev: 'Lucas Pope',                            era: 'indie-modern',       node: 'PATTERN-MATCH/pattern-deduction' },
  'wordle-letter-deduce':          { name: 'Wordle Letter Deduce',          game: 'Wordle',                 year: 2021, platform: 'Web',      dev: 'Josh Wardle',                           era: 'indie-modern',       node: 'PATTERN-MATCH/pattern-deduction' },
};

// Parse verbs from research-queue.md so they stay in sync with the queue file
const verbMap = new Map();
for (const line of queue.split('\n')) {
  const m = line.match(/- \[ \] `([^`]+)` — ([^—]+) —/);
  if (m) verbMap.set(m[1], m[2].trim());
}

let written = 0, skipped = 0;
for (const [id, meta] of Object.entries(SEED)) {
  const dir = join(ROOT, 'src/content/primitives', id);
  const file = join(dir, 'stub.md');
  if (existsSync(file)) { skipped++; continue; }
  mkdirSync(dir, { recursive: true });
  const verb = verbMap.get(id) ?? meta.name.toLowerCase();
  const fm = [
    '---',
    `id: ${id}`,
    `name: ${meta.name}`,
    `player_verb: "${verb}"`,
    `canonical_game: "${meta.game}"`,
    `canonical_year: ${meta.year}`,
    `canonical_platform: ${meta.platform}`,
    `canonical_developer: "${meta.dev.replace(/"/g, '\\"')}"`,
    `era_bucket: ${meta.era}`,
    `taxonomy_node: ${meta.node}`,
    'status: stub',
    'orientation: auto',
    '---',
    '',
    `Stub for **${meta.name}**. The player ${verb}. Research agent will overwrite this body with full algorithm + variations + citations per agent-prompts/02-research.md.`,
    '',
  ].join('\n');
  writeFileSync(file, fm);
  written++;
}

console.log(`stubs: wrote ${written}, skipped ${skipped} (already existed)`);
