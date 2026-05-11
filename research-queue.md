# Research queue

The to-do list. The Discovery agents append to this; Research agents check off from it. Group by **wave** so batches are coherent.

Format: `- [ ] {id} — {one-line player verb} — era:{bucket} — priority:{1-3}`

Priority:
- **1** = canonical, must-have. Build before anything else converges on it.
- **2** = important variation or successor.
- **3** = niche, build last.

---

## Wave 0 — seed (pre-populated, hand-curated; CLI does NOT regenerate these)

These are seeded by hand to verify the pipeline. Run the Research agent against these first, in parallel batches of 5.

- [ ] `lunar-lander-thrust` — apply fuel-limited vector thrust under gravity to null velocity at a target — era:arcade-early — priority:1
- [x] `asteroids-rotate-thrust` — combine angular and linear thrust with screen-wrap topology — era:arcade-early — priority:1
- [ ] `pong-paddle-volley` — deflect a ball with a vertical paddle, angle by contact point — era:arcade-early — priority:1
- [ ] `breakout-paddle-reflect` — deflect a ball at a brick field — era:arcade-early — priority:1
- [ ] `space-invaders-vertical-shot` — fire fixed-vector projectiles at a descending grid — era:arcade-early — priority:1
- [ ] `pacman-power-pellet` — invert predator/prey for a timed window — era:arcade-golden-age — priority:1
- [x] `qix-area-claim` — draw closed polygons to claim shared space — era:arcade-golden-age — priority:1
- [ ] `defender-radar-rescue` — patrol a wrapping world with a strategic minimap — era:arcade-golden-age — priority:1
- [ ] `robotron-twin-stick` — separate move and aim vectors — era:arcade-golden-age — priority:1
- [ ] `donkey-kong-platform-arc` — variable-height ballistic jump with hazard timing — era:arcade-golden-age — priority:1
- [ ] `mario-platform-arc` — refined variable-jump with horizontal control — era:home-8bit — priority:1
- [ ] `space-taxi-precision-thrust` — thrust + soft passenger pickup — era:home-8bit — priority:1
- [ ] `boulder-dash-falling-rocks` — gravity-falling objects as both hazard and puzzle — era:home-8bit — priority:1
- [ ] `lode-runner-dig-fall` — dig holes to trap pursuers — era:home-8bit — priority:1
- [ ] `tetris-line-clear` — orient falling tetrominoes to clear rows — era:home-8bit — priority:1
- [ ] `defender-of-the-crown-catapult` — pre-commit angle and power for a ballistic shot — era:home-8bit — priority:1
- [ ] `lemmings-assign-roles` — assign behaviors to a stream of autonomous agents — era:home-16bit — priority:1
- [ ] `populous-terraform` — reshape terrain as a god-level verb — era:home-16bit — priority:1
- [ ] `dune-2-rts-base` — extract resource, build base, command units — era:home-16bit — priority:1
- [ ] `worms-bazooka-wind` — turn-based artillery with environmental modifiers — era:home-16bit — priority:1
- [ ] `pinball-flipper-deflect` — timed paddle deflects ball through table — era:arcade-early — priority:1
- [ ] `doom-bsp-arena` — first-person navigation of a sector-based map — era:early-3d — priority:1
- [ ] `tomb-raider-tank-controls` — grid-aware 3D platforming with discrete actions — era:early-3d — priority:2
- [ ] `resident-evil-fixed-cam-survival` — pre-rendered cameras + scarce resources — era:early-3d — priority:2
- [ ] `portal-momentum-warp` — preserve velocity through teleport — era:modern-console-pc — priority:1
- [ ] `braid-time-rewind` — rewind player-only or selective time — era:modern-console-pc — priority:1
- [ ] `dark-souls-bonfire-recovery` — die, return to checkpoint, lose dropped progress — era:modern-console-pc — priority:1
- [ ] `slay-the-spire-deck-run` — build a deck during a one-run roguelike — era:indie-modern — priority:1
- [ ] `vampire-survivors-evolve` — auto-attack survivor with item evolutions — era:indie-modern — priority:1
- [ ] `baba-is-you-rewrite` — push word-tiles to rewrite game rules — era:indie-modern — priority:1
- [ ] `patrick-parabox-nested` — push boxes through nested rooms — era:indie-modern — priority:1
- [ ] `obra-dinn-identity-grid` — assign identity hypotheses against constraint feedback — era:indie-modern — priority:1
- [ ] `wordle-letter-deduce` — narrow a hidden word from per-letter feedback — era:indie-modern — priority:2

---

## Wave 1 — discovery output (CLI appends after agent 01 runs)

(empty — Discovery agents fill this section, one bucket per agent)

### PoC
- [ ] _to be filled by discovery agent_

### arcade-early
- [ ] _to be filled by discovery agent_

### arcade-golden-age
- [ ] _to be filled by discovery agent_

### home-8bit
- [ ] _to be filled by discovery agent_

### home-16bit
- [ ] _to be filled by discovery agent_

### early-3d
- [ ] _to be filled by discovery agent_

### modern-console-pc
- [ ] _to be filled by discovery agent_

### indie-modern
- [ ] _to be filled by discovery agent_

---

## Wave 2 — gaps from collapse + re-fit

(empty — Collapse and Taxonomy agents append here after wave 1 research completes)

---

## Done

(completed entries move here, with research date)
