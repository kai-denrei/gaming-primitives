---
id: baba-is-you-rewrite
status: researched
research_date: 2026-05-11
sources_used: 8
---

## Player verb

The player pushes word-tiles across a Sokoban-style grid to form, break, or rearrange `[SUBJECT] IS [PREDICATE]` sentences that the game re-parses at the end of every turn, mutating which objects are controllable, walkable, lethal, or victorious before the next input is accepted.

## Canonical originator

*Baba Is You*, Hempuli Oy / Arvi "Hempuli" Teikari, March 13 2019, Windows/Mac/Linux/Switch (later iOS, Android, PS4, Xbox One)[^1][^2]. The released game grew out of a 48-hour entry to the 2017 Nordic Game Jam, where the rule-as-pushable-object idea won the jam's main prize; Teikari then spent roughly two years expanding the jam build into a 200+ level commercial release[^1][^3]. The shipped engine and editor are written in Multimedia Fusion 2, the same Clickteam toolchain Teikari used for *Environmental Station Alpha*; level data is plain text describing tile placements per layer[^3].

Prior art for "the rules are in the world" is small but real. Zach Gage's *SpellTower* (2011) and the chalkboard-puzzle game *Scribblenauts* (5th Cell, 2009) both let words alter play, but neither makes the word *itself* a movable object subject to the same physics as the things it describes. *Recursed* (Portponky, 2016) shows a Sokoban variant where pushable rooms reorder the world graph, but its rules are still fixed. Teikari's earlier prototype *Sokoblock* and a string of Ludum Dare entries circled the idea; the 2017 jam build was the synthesis — the formal innovation is that the rule set is recomputed every turn from the grid's geometry, so any sentence the player can read on the board *is* a rule, including sentences the player did not intend to form[^3][^4].

## Variations and successors

- *Recursed* (Portponky, 2016, PC): predecessor in spirit — pushable rooms-within-rooms but no in-world rule text[^5].
- *Patrick's Parabox* (Patrick Traynor, 2022, PC): successor that strips the rule-rewriting back out and pushes the *nesting* axis instead; see [[patrick-parabox-nested]][^6].
- *Scribblenauts* (5th Cell, 2009, NDS): rule-modification by typed noun summoning; varies in input (typing vs. pushing) and persistence (one-shot summon vs. continuous parse)[^7].
- *Sokoban* (Hiroyuki Imabayashi, 1982, PC-8801): the ancestral push-on-grid verb; *Baba* inherits its 4-connected step model and chain-push resolution wholesale[^8].
- *Stephen's Sausage Roll* (Stephen Lavelle, 2016, PC): contemporary "thinky-puzzle" of fixed rules but extreme depth-per-rule; cited as design-DNA conversation partner, not a rule-rewriting game[^4].
- *Snakebird* (Noumenon Games, 2015, PC): contemporary puzzle, fixed rules, multi-segment body; included as a reference point for the "few rules, large state-space" school *Baba* sits inside [NEEDS VERIFICATION: direct lineage claim].
- *Baba Is You: New Adventures* (Hempuli, 2023, level pack DLC): adds new words `EAT`, `BLUE`, `RED`, several global modifiers, and the `LEVEL IS` self-referential family[^2].
- *Babataba* / community mods (various, 2019–): user level packs distributed through Hempuli's editor, hundreds of fan rule sets.
- *MirrorMoon EP* and *Understand* (Andrew Shouldice, 2019, PC) sit adjacent — rules are *hidden* and the verb is hypothesis-test, not rewrite. Included to mark the boundary.
- *Notpron* / *Antichamber* (Bruckner, 2013, PC): "the rules of the world are the puzzle" but at the architectural rather than rule-token level.

## Algorithm / math

The behaviour is reconstructed from Teikari's own GDC 2020 talk, his ongoing blog at hempuli.com, and direct gameplay analysis; the MMF2 source is not public[^3][^4][^9].

```text
Grid:
  cells[W][H][LAYER]            # multiple objects may share a cell
  Each cell entry is an Object:
    kind:   NOUN_INSTANCE | TEXT_NOUN | TEXT_VERB | TEXT_PROPERTY
    name:   e.g. "baba", "rock", "flag", "wall", "is", "you", "win", ...
    facing: optional, for directional objects

Rule set (recomputed every turn):
  rules: Set[(subject_name, predicate_name)]
  derived_properties: Map[name -> Set[property]]
  derived_substitutions: Map[name -> Set[name]]   # for NOUN-IS-NOUN

Per-turn loop:
  1. read_input(dir)                # ↑ ↓ ← → or "wait"
  2. ids_of_you = { o | "you" ∈ derived_properties[o.name] }
  3. for each o in ids_of_you in deterministic order:
       attempt_move(o, dir)
  4. parse_rules()                  # rebuild rule set from grid
  5. apply_derived_effects()        # SINK, HOT/MELT, DEFEAT, OPEN/SHUT...
  6. parse_rules()                  # second pass — effects can destroy
                                    # tokens, freeing new sentences
  7. check_win()                    # any YOU object also WIN?
  8. animate, await next input.

attempt_move(o, dir):
  chain = [o]
  cur   = neighbour(o.pos, dir)
  while cell_nonempty(cur):
    others = objects_in(cur)
    if any(blocks(x, o, dir) for x in others): return  # STOP wall
    pushables = [x for x in others if is_pushable(x)]
    if not pushables: break                            # walkable space
    chain.extend(pushables)
    cur = neighbour(cur, dir)
  if in_bounds(cur):
    for x in reversed(chain): x.pos = neighbour(x.pos, dir)

is_pushable(x):
  return x.kind in {TEXT_*} or "push" ∈ derived_properties[x.name]

parse_rules():
  rules.clear()
  for row in grid_rows:                  # horizontal scan
    scan_sentences(row)
  for col in grid_cols:                  # vertical scan
    scan_sentences(col)
  apply_NOUN_IS_NOUN_substitutions()     # transitive closure
  recompute derived_properties

scan_sentences(line):
  # walk tokens; whenever we see TEXT_NOUN, TEXT_VERB("is"),
  # TEXT_NOUN | TEXT_PROPERTY in three consecutive cells, emit a rule.
  # Conjunctions AND extend the subject/predicate lists.

apply_derived_effects():
  # Order matters; Hempuli's published order is roughly:
  #   DEFEAT  — any YOU sharing a cell with DEFEAT is destroyed
  #   SINK    — any two objects in the same cell where one is SINK
  #             destroys both
  #   HOT+MELT — MELT object on cell with HOT object is destroyed
  #   OPEN+SHUT — co-located OPEN and SHUT destroy each other
  #   WEAK     — any push that lands on WEAK destroys the WEAK
  for effect in [DEFEAT, SINK, HOT_MELT, OPEN_SHUT, WEAK]:
    apply(effect)

check_win():
  return any(o for o in all_objects
             if "you" ∈ derived_properties[o.name]
             and "win" ∈ derived_properties[o.name])
```

Three subtleties the parser must handle: (a) `X IS X` makes `X` immune to substitution by other `X IS Y` rules — Teikari calls this the "identity lock"[^3]; (b) `TEXT IS PUSH` is the *default* for all text tokens, but a `TEXT IS STOP` or `TEXT IS YOU` rule overrides it, which is how text can become the player; (c) the two-pass `parse_rules → apply_effects → parse_rules` ordering matters because destroying a text token (e.g. by walking it into LAVA when `TEXT IS MELT` and `LAVA IS HOT`) must dissolve the rule that token formed *before* the win check[^9].

## Player-experience hooks

The mastery curve is not motor — every input is a 4-way step — but *combinatorial*. Early puzzles teach single-rule rewrites (push `WIN` off the flag and onto a rock; the rock is now the goal). Mid-game introduces *rule breakage as a verb*: smash `WALL IS STOP` by pushing `IS` out of the line, walk through walls, reform it elsewhere. Late-game weaponises self-reference (`TEXT IS YOU`, `BABA IS BABA` immunity, `LEVEL IS WIN`) and forces solutions that involve momentarily having no controllable object[^4][^9]. The signature *aha* feel is the inversion moment: a wall in the corner of the level is also the literal three-letter word `WIN` you can shove into a sentence. The dominant failure mode is **rule-blindness** — the player overlooks a sentence the engine sees because the level's geometry hides it on the diagonal of the player's attention. Swink's vocabulary is mostly inapplicable; the relevant cognitive frame is closer to symbolic-logic puzzle-solving than to game-feel.

## Convergence notes

Shares Sokoban-chain push resolution with [[patrick-parabox-nested]] and the rock-and-boulder physics of [[boulder-dash-falling-rocks]], but differs in what the push *does*: Parabox folds space, Boulder Dash triggers gravity, *Baba* re-parses the rule set. Shares the "the puzzle is the rules" structural conceit with [[wordle-letter-deduce]] (both treat the rule-system as the play surface) and with [[obra-dinn-identity-grid]] (player deduces a hidden mapping), but *Baba* is the only one where the player *writes* the rules with motor input. Distinct from time-manipulation primitives like [[braid-time-rewind]] in that *Baba*'s state-space is fully combinatorial-discrete; there is no continuous axis to scrub.

## Suggested mini-game scope

Single HTML file, canvas-2D, vanilla JS, no assets. A 12×9 grid stored as `Object[][][]` (three layers max per cell). One hand-authored level with the tokens `BABA`, `IS`, `YOU`, `FLAG`, `WIN`, `WALL`, `STOP`, `ROCK`, `PUSH` — five rule pieces and a clear win path through one obvious rewrite (push `WIN` off `FLAG`, onto `ROCK`, walk a `BABA` into a rock). Implement the full per-turn loop: input → push-chain → parse-rules (both axes) → apply effects (only `STOP`, `PUSH`, `YOU`, `WIN` — skip SINK/HOT/MELT/DEFEAT for scope) → win-check. Aim ~350 LOC. The rule parser is the hard part: a 30-line two-axis scan returning `Set<[subj,pred]>`. The goal in 30 seconds: the player must form a new sentence by pushing a word tile, then observe the world change behaviour mid-puzzle.

## References

[^1]: Baba Is You — Wikipedia — https://en.wikipedia.org/wiki/Baba_Is_You — retrieved 2026-05-11
[^2]: Baba Is You — Hempuli Oy product page — https://hempuli.com/baba/ — retrieved 2026-05-11
[^3]: Arvi Teikari — Wikipedia — https://en.wikipedia.org/wiki/Arvi_Teikari — retrieved 2026-05-11
[^4]: How the rules of Baba Is You give it almost infinite depth — Game Maker's Toolkit (Mark Brown), 2019, timestamp 02:10–06:45 — https://www.youtube.com/watch?v=zMyo7Ee0RFY — retrieved 2026-05-11
[^5]: Recursed (2016) — MobyGames — https://www.mobygames.com/game/82288/recursed/ — retrieved 2026-05-11
[^6]: Patrick's Parabox — Wikipedia — https://en.wikipedia.org/wiki/Patrick%27s_Parabox — retrieved 2026-05-11
[^7]: Scribblenauts — Wikipedia — https://en.wikipedia.org/wiki/Scribblenauts — retrieved 2026-05-11
[^8]: Sokoban — Wikipedia — https://en.wikipedia.org/wiki/Sokoban — retrieved 2026-05-11
[^9]: Hempuli developer blog (Arvi Teikari) — design notes on Baba Is You rule system — https://www.hempuli.com/blog/ — retrieved 2026-05-11
