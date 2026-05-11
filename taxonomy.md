# Taxonomy

The hypothesis: most gameplay primitives compress into ~15 higher-order families. This tree is a **living document** — re-fit after each research wave by agent 04.

Leaves are primitive `id`s. Names without ids are conjectured but not yet seeded.

## SPATIAL

### spatial-claim
- `qix-area-claim` — close polygons in shared space
- `tron-light-cycle` — trail-as-wall, deny corridors
- `splatoon-ink-territory` — paint floor area
- `go-influence` — surround empty space (tabletop heritage)
- `snake-trail-growth` — your body claims its path

### spatial-traversal
- `mario-platform-arc` — variable-height ballistic jump
- `bionic-commando-swing` — pendulum locomotion
- `worms-ninja-rope` — grapple + swing-physics
- `metroidvania-ability-gate` — backtrack with new traversal verb
- `portal-teleport-momentum` — preserve velocity through warp
- `parkour-vault-flow` — context-action chains (Mirror's Edge)

### spatial-rotation
- `tetris-orient-drop` — rotate falling piece
- `marble-madness-tilt` — rotate world to roll ball
- `and-yet-it-moves-rotate` — rotate world to redirect gravity
- `cameltry-roll` — same with explicit rotation input

### spatial-perspective
- `fez-axis-rotate` — 2D view of 3D world
- `echochrome-figure-ground` — what-you-see-is-what-is
- `monument-valley-impossible` — Escher geometry
- `superliminal-forced-perspective` — size by camera distance
- `antichamber-non-euclidean` — space breaks topology

## MOMENTUM

### momentum-thrust
- `lunar-lander-thrust` — fuel-limited 2D thrust under gravity
- `asteroids-rotate-thrust` — angular + linear thrust, screen-wrap
- `space-taxi-precision-thrust` — thrust + delicate passenger pickup
- `thrust-c64-cargo` — thrust with payload tether physics

### momentum-conservation
- `pinball-flipper-deflect` — timed paddle changes ball vector
- `breakout-paddle-reflect` — angle of contact maps to angle out
- `pong-paddle-volley` — same, minimal version
- `arkanoid-paddle-power` — Breakout + power-up cascade

### momentum-drift
- `mario-kart-drift-boost` — counter-steer charge
- `sega-rally-handbrake` — surface-aware traction
- `f-zero-banking` — high-speed cornering inertia

## PROJECTILE

### projectile-arc
- `defender-of-the-crown-catapult` — pre-commit angle+power
- `angry-birds-slingshot` — drag-back, release vector
- `worms-bazooka-wind` — arc + environmental modifier
- `scorched-earth-artillery` — turn-based same
- `cut-the-rope-physics` — release into rope-pendulum

### projectile-direct
- `space-invaders-vertical-shot` — fixed-vector projectile
- `galaga-aimed-shot` — same, minor angle variation
- `geometry-wars-twin-stick` — analog aim vector
- `robotron-twin-stick` — the canonical two-stick

### projectile-pattern
- `bullet-hell-danmaku` — parametric bullet curtains
- `ikaruga-polarity` — projectile-as-resource-by-color
- `touhou-graze` — risk-reward proximity scoring

## PATTERN-MATCH

### pattern-line
- `tetris-line-clear` — fill row → clear
- `puyo-puyo-chain` — connected color groups pop
- `columns-line-clear` — Tetris variant with falling triplet

### pattern-cascade
- `bejeweled-swap-match` — swap adjacent → cascade clear
- `candy-crush-objectives` — swap-match + level objectives
- `puzzle-bobble-shoot` — shoot-to-cluster bubble match
- `dr-mario-virus-clear` — match-3 with targets

### pattern-merge
- `threes-merge` — slide-and-combine pairs
- `2048-double` — Threes variant, power-of-two merge
- `donut-county-grow` — accretion by absorbing smaller things
- `katamari-roll-grow` — same in 3D rolling

### pattern-deduction
- `mastermind-color-guess` — feedback-driven elimination
- `wordle-letter-deduce` — same with letters
- `obra-dinn-identity-grid` — multi-hypothesis logic table
- `picross-nonogram` — constraint-row deduction

## TIMING

### timing-rhythm
- `parappa-press-on-beat` — input-on-beat
- `ddr-step-on-beat` — same, physical
- `necrodancer-move-on-beat` — locomotion gated by beat
- `thumper-rail-rhythm` — rhythm-on-rails action
- `beat-saber-slice-on-beat` — VR motion on beat
- `rez-fire-on-beat` — shoot-em-up with beat-locked SFX

### timing-window
- `qte-context-press` — press button now (Shenmue lineage)
- `bushido-blade-frame-perfect` — one-shot kill timing
- `parry-window` — defensive frame catch (3rd Strike, Sekiro)
- `just-frame-input` — single-frame command (KOF)

### timing-charge
- `mega-man-charge-shot` — hold to power
- `monster-hunter-charge-blade` — multi-level charge with phases
- `withers-power-meter` — golf-swing tri-stop (PGA Tour)

## RESOURCE

### resource-cascade
- `mule-supply-demand` — auctioned scarcity
- `factorio-throughput` — pipe/belt logistics
- `dyson-sphere-program-tier` — scale-tier supply chains
- `offworld-trading-market` — RTS with stock-market

### resource-conversion
- `civilization-tech-tree` — research as conversion
- `slay-the-spire-deck-add` — combat-as-deck-conversion
- `mr-mosquito-blood-meter` — drain-rate as resource

### resource-decay
- `survival-hunger-thirst` — meters that tick down (Don't Starve)
- `eternal-darkness-sanity` — fear-meter with system feedback
- `amnesia-light-fuel` — light as expendable safety
- `pikmin-day-timer` — hard real-time decay per run

## RULE

### rule-modification
- `baba-is-you-rewrite` — push words to change rules
- `scribblenauts-summon` — type-noun-to-spawn
- `recursed-self-contain` — rooms contain themselves
- `patrick-parabox-nested` — same, refined

### rule-emergence
- `nethack-interaction-matrix` — every object × every object
- `dwarf-fortress-simulation` — story from simulation depth
- `rimworld-incident-script` — director-driven emergence
- `noita-pixel-sim` — falling-pixel emergent chaos

### rule-inversion
- `pacman-power-pellet` — predator/prey flip
- `ikaruga-color-flip` — bullet/shield duality
- `vvvvvv-gravity-flip` — flip world axis

## CONCEAL

### conceal-identity
- `among-us-imposter` — hidden-role bluff
- `mafia-werewolf` — same, tabletop heritage
- `secret-hitler-vote-block` — role + voting mechanism
- `town-of-salem-role` — many-role variant

### conceal-information
- `xcom-fog-of-war` — line-of-sight discovery
- `thief-noise-detection` — sound-cone perception
- `mgs-alert-state` — staged-awareness AI
- `commandos-cone-of-view` — vision-cone planning

### conceal-deceive
- `phoenix-wright-cross` — present evidence to expose lies
- `la-noire-face-read` — interrogate via tells
- `mafia-deception-vote` — same as conceal-identity?

## ECONOMY-LOOP

### loop-extract-craft-build
- `minecraft-extract-craft` — mine, recipe, place
- `terraria-extract-craft-fight` — same + boss progression
- `valheim-craft-tier` — tier-gated tool progression

### loop-permadeath-procedural
- `rogue-permadeath-procgen` — die, regenerate, retry
- `spelunky-tile-procgen` — same, action-platformer
- `hades-meta-progression` — permadeath + persistent upgrades
- `slay-the-spire-run-deck` — same, deckbuilder
- `vampire-survivors-evolve` — same, autobattler-shmup
- `binding-of-isaac-synergy` — same with item-stacking

### loop-incremental
- `cookie-clicker-multiply` — exponential resource
- `universal-paperclips-pivot` — incremental with phase shifts
- `idle-prestige-reset` — sacrifice for bonus multiplier

## SOCIAL

### social-async
- `dark-souls-message` — async player notes
- `spelunky-daily` — shared seed leaderboard
- `trackmania-ghost` — replay-as-opponent
- `f-zero-staff-ghost` — developer-replay benchmark

### social-trade
- `eve-online-market` — player-driven economy
- `runescape-grand-exchange` — player marketplace
- `animal-crossing-stalk-market` — fluctuating prices

## EXPRESSION

### expression-author
- `mario-maker-build` — build-and-share level
- `little-big-planet-create` — same, richer toolkit
- `roblox-platform` — author-as-platform
- `dreams-engine-in-game` — full engine as game

### expression-photograph
- `pokemon-snap-photo-score` — graded photos
- `umurangi-generation-photo` — narrative through photography
- `beyond-good-evil-photo-quest` — photo as collection verb

### expression-draw
- `okami-brushstroke` — gesture-as-action
- `drawn-to-life-author-sprite` — draw your own avatar
- `passpartout-paint-sell` — drawing-as-economy-game

## NEGOTIATION

### negotiation-dialogue
- `mass-effect-wheel` — paragon/renegade slider
- `disco-elysium-dice-talk` — dialogue skill-check
- `oblivion-persuasion-wheel` — minigame-as-persuasion
- `monkey-island-insult-swordfight` — memorized riposte

### negotiation-faction
- `mount-blade-relations` — faction-trust matrix
- `crusader-kings-relations` — character-trust web
- `morrowind-disposition` — single faction-disposition value

---

## Convergence observations (seeded — refine in collapse waves)

- **Drift-boost and dash-cancel** may be the same primitive at different scales (vehicle vs avatar).
- **Pong-paddle-reflect, Breakout, Pinball-flipper, Arkanoid** all reduce to *vector-reflection-with-paddle-bias* — possibly one primitive with four exhibits.
- **Roguelike permadeath-procgen, Hades meta-progression, Vampire Survivors evolve** form a clear lineage; the splits may be the *meta-progression shape* (none / soft / hard) not the core loop.
- **Phoenix Wright cross-examine, LA Noire face-read, Obra Dinn identity-grid** all reduce to *hypothesis-testing against a hidden truth table*.
- **Asteroids gravity, Lunar Lander, Space Taxi, Thrust, Mario Galaxy local gravity** — all *force-vector-integration under bounded fuel/control*.

The Collapse agent (`agent-prompts/03-collapse.md`) is responsible for proposing merges and splits after each research wave.

## Era buckets

Used by Discovery agent for quota balancing:

1. **PoC** (pre-1971): Tennis for Two, Spacewar!, OXO, Nimrod
2. **arcade-early** (1971–1979): Pong, Breakout, Space Invaders, Asteroids
3. **arcade-golden-age** (1980–1985): Pac-Man, Defender, Qix, Donkey Kong, Robotron, Tempest
4. **home-8bit** (1982–1990): C64, Apple II, NES, Atari 2600, Spectrum, MSX
5. **home-16bit** (1987–1995): Amiga, Atari ST, SNES, Genesis, arcade-3D-transition
6. **early-3d** (1993–1999): Doom, Quake, Tomb Raider, Mario 64, OoT
7. **modern-console-pc** (2000–2012): immersive sims peak, Half-Life 2, Demon's/Dark Souls, Portal, Braid
8. **indie-modern** (2008–present): Spelunky, Hades, Baba, Vampire Survivors, Patrick's Parabox
