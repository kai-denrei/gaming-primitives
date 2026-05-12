---
slug: behavior-tree
name: Behavior Tree
status: built
description: Action selection walks a tree of selector/sequence nodes each tick.
parameters:
  - { type: int,   id: tree_depth,    min: 2,   max: 4, default: 3,            label: tree-depth }
  - { type: float, id: tick_interval, min: 0.5, max: 3, default: 1, unit: s,   label: tick-interval }
in_the_wild:
  - { applied: pacman-power-pellet, note: "Namco 1980 — ghosts can be modelled as a behaviour tree rooted at a selector: (frightened-flee → eaten-return → mode-router); the tree shape replaces tangled FSM transitions as states multiply." }
  - { applied: vampire-survivors-evolve, note: "Poncle 2022 — weapon evolutions and enemy spawn logic walk a tree of priority selectors each frame, so adding a new behaviour is one leaf insertion rather than a transition matrix rewrite." }
code_anchor: public/d/state-machines/behavior-tree.js
---
