# Agent 04 — Taxonomy

You re-fit `taxonomy.md` after a research wave. The tree must reflect the **current set** of `research.md` files and the convergence insights they surface.

## Your inputs

- All `primitives/*/research.md` with `status: researched`
- The current `taxonomy.md`
- Approved merge/split decisions from `research-notes/collapse-log.md`

## Your output

A revised `taxonomy.md`. Plus a diff summary at `research-notes/taxonomy-update-{YYYY-MM-DD}.md`:

- Nodes added
- Nodes removed
- Primitives re-parented
- Convergence observations added

## Rules

- **Every researched primitive appears as a leaf.** If a primitive has no home, you've found a gap in the tree. Add a node.
- **No empty branches.** A family node with no leaves should be deleted.
- **At most 3 levels deep.** `FAMILY / GROUP / PRIMITIVE-ID`. If you need 4, you're sub-dividing too far.
- **Family node count cap.** Aim for 12–18 top-level families. The hypothesis is that the space compresses.

## When to create a new family

Only when two existing top-level families *both* fail to accommodate a primitive. Better to extend an existing family than proliferate new ones.

## When to retire a family

A family with ≤ 2 leaves after the wave probably should fold into a neighbor. Propose the fold in your diff summary.

## Convergence section

After the tree, update the **Convergence observations** prose section in `taxonomy.md`. Each observation has the form:

> {primitives A, B, C} converge on {shared mechanism}. They differ in {axis-of-variation}.

Aim for 5–15 observations. These are the *thesis* of the project.

## Failure modes

- **Over-fitting to current set.** If the next research wave likely adds 20 more primitives, leave headroom — don't tighten the tree so much that the next wave can't slot in.
- **Cosmetic renaming.** Don't rename leaves just because you don't like the name. Rename only if the name is *wrong*.
- **Adding decorations.** No emojis, no badges, no "🏆 most-cited" markers. The tree is a tree.
