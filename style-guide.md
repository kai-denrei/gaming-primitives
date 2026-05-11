# Style Guide

## Voice
Declarative. Dense. No hedging. No "it could be argued that." Either it is or it isn't, and you have a citation either way.

**Yes**: "Asteroids' physics integrates thrust as Euler velocity updates with screen-wrap topology, framerate-dependent on the original 6502 hardware."

**No**: "Asteroids is generally considered to be a game that some would say uses a kind of physics that integrates thrust in a somewhat Euler-like manner, though this can vary."

## Tense
Present, even for historical games. "Pac-Man's ghosts use a four-state FSM." Not "used."

## Person
Third person. No "I think." If you need to mark uncertainty, say "evidence suggests" or "sources disagree on" with a citation.

## Sentence length
Vary. Short sentences carry weight. Long sentences carry mechanism. Mix.

## Jargon
Use it. Assume the reader is a game-literate adult builder. "Verlet integration", "BSP tree", "rollback netcode", "i-frames" — all fair game without defining.

## Forbidden phrases
- "In conclusion" / "To summarize" — just stop writing.
- "It's important to note that" — if it's important, just say it.
- "This article will explore" — the file's existence already says that.
- "Plays a crucial role" — vague. What role exactly?
- "Revolutionary" / "groundbreaking" — overused. Be specific about what changed.

## Citations
Footnote-style. Place the marker after the claim, before punctuation.

**Yes**: "Tetris was developed by Alexey Pajitnov in 1984 at the Soviet Academy of Sciences[^1]."

**No**: "Tetris was developed by Alexey Pajitnov in 1984 [1] at the Soviet Academy of Sciences."

Every factual claim about dates, authorship, platforms needs a citation. Common-knowledge mechanisms (e.g. "Tetris uses a 10x20 grid") do not.

## Wikilinks
For cross-primitive references. `[[primitive-id]]` resolves to `/primitives/{id}/`. Use them liberally — convergence is the point.

## Code blocks
Pseudocode in triple-backtick blocks tagged `text` or as actual JS/Python tagged `js`/`python`. Math in LaTeX-compatible `$...$` for inline, `$$...$$` for display.

## Length budgets
- `stub.md`: ≤ 200 words total
- `research.md`: 800–1500 words total
- `spec.md`: 400–700 words total
- Mini-game `README.md`: ≤ 200 words

If you're over budget, you're padding. Cut.

## Headings
ATX style (`#`, `##`, `###`). No skipping levels. No trailing `#`s.

## Lists
Use bullets for unordered, numbers for ordered rulesets/steps. Don't bullet-pad single sentences into lists.

## Emojis
None in research files. Mini-game UIs may use them. Commit messages may use them sparingly.

## When you don't know something
Write `[NEEDS VERIFICATION: claim]` inline. The Collapse agent will pick these up and either resolve them or flag them for human review.
