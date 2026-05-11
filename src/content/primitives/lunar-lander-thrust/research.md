---
id: lunar-lander-thrust
status: researched
research_date: 2026-05-11
sources_used: 8
---

## Player verb

The player aims a thrust vector under constant downward gravity and pulses it against a depleting fuel budget, attempting to null both horizontal and vertical velocity at the instant the lander touches a designated landing pad.

## Canonical originator

*Lunar Lander*, Atari, August 1979, Arcade. Designed by Rich Moore and programmed by Rich Moore with hardware by Howard Delman; cabinet driver electronics co-engineered with the *Asteroids* team[^1][^2]. The cabinet runs a MOS 6502 paired with Atari's QuadraScan vector generator on an XY monitor, with a four-button panel (Abort, Left, Right, and a large analog Thrust lever wired through a potentiometer) instead of a joystick[^1][^3]. Atari produced roughly 4,830 cabinets before retooling the line to *Asteroids*, which shipped three months later on closely-related hardware[^1].

The prior art is a long text-and-graphics lineage. The seminal version is *Lunar*, written in FOCAL by Jim Storer in 1969 as a high-school project on a DEC PDP-8; the program asked the player to type a fuel-burn-per-second every ten seconds and printed an updated altitude, velocity, and fuel[^4][^5]. DEC's David Ahl ported it to BASIC for the *101 BASIC Computer Games* anthology (1973), seeding hundreds of home-computer ports[^4]. The first real-time graphical descendant was *Moonlander* by Jack Burness on a DEC GT40 vector terminal in 1973[^4]. *Highnoon* (1973, PDP-10) is sometimes mis-listed as the parent of the genre but is a typed-input western duel and not lineage-relevant. What Atari's 1979 cabinet added over Moonlander was the analog thrust lever — a continuous physical input that mapped directly to engine power rather than discrete keypresses — and the surface-zoom mechanic: as the ship approaches the terrain, the playfield magnifies to make a precision touchdown legible at vector-monitor resolution[^1][^6]. The verb is irreducible because removing any one of the three — gravity, finite fuel, or velocity-at-contact — collapses the whole loop.

## Variations and successors

- *Moonlander* (Burness/DEC, 1973, GT40 vector terminal): vector graphics, light-pen input, hidden McDonald's easter egg if you land off-pad. The direct visual ancestor.
- *Lunar Lander* (Atari, 1979, Arcade): the canonical entry. Adds analog thrust lever, surface zoom, multiple pads with score multipliers.
- *Lander* / *Rescue at Rigel*-era home ports (1979–1982, Atari 800, TRS-80, Apple II): keyboard substitutes for the lever; usually one fixed pad per stage.
- *Lunar Rescue* (Taito, 1979, Arcade): hybrid — *Lunar Lander* descent verb stitched to a *Space Invaders* ascent shooter; the lander must shoot through a wall of aliens on the way back up[^7].
- *Gravitar* (Atari, 1982, Arcade): the verb generalised — rotate-thrust under per-planet gravity wells with multiple landing sites and tractor-beam rescue; the lineage explicitly bridges to [[asteroids-rotate-thrust]].
- *Space Taxi* (Muse, 1984, C64): see [[space-taxi-precision-thrust]] — replaces the lander's geometric pad with passenger pickup/drop in a chambered, non-wrapping map; same soft-touchdown kernel.
- *Thrust* (Superior Software, 1986, BBC Micro/C64): rotate-thrust under gravity inside tunnel mazes, plus a tethered cargo pod whose swing physics doubles the control surface[^8].
- *Solar Jetman* (Zippo Games / Rare, 1990, NES): rotate-thrust gravity over freely-scrolling planet interiors with a towed cargo pod; descends from *Thrust* with stronger production.
- *Oids* (FTL, 1987, Atari ST/Amiga): hostage rescue inside gravity caverns; pure *Thrust*-family hybrid.
- *Lunar Lander* (Atari, 1988 home conversions): C64, Spectrum, Amiga reissues with discrete-keyboard thrust.
- *Lunar Lander 3D* (Crawfish Interactive / Atari, 2000, Win/PS1): polygonal reimagining with the same kernel verb.
- *Mars Lander* / *Lunar Flight* (Shovsoft, 2012, Win/Mac): sim-leaning modern revival with realistic mass, RCS thrusters, and ground navigation.

## Algorithm / math

The original 1979 cabinet integrates motion at the vertical-blanking interrupt of the QuadraScan, so the integration step is implicitly one frame; the analog thrust lever is sampled per frame through a potentiometer-fed ADC and quantised to a small thrust scalar[^1][^3]. Source code for the Atari ROM is not in clean public circulation, so the loop below reconstructs the *visible* behaviour and prescribes a frame-rate-independent form for modern ports.

```text
State per tick:
  pos:        (x, y)            # y grows downward on screen
  vel:        (vx, vy)
  fuel:       f                 # scalar, depletes while thrust_on
  thrust_on:  bool              # lever > deadband
  thrust_mag: t in [0, T_MAX]   # analog lever sample
  angle:      θ                 # tilt: 0 = straight up, +CW
                                # (1979 cabinet: θ ∈ {-30°, 0, +30°}
                                # via Left/Right buttons; θ stays
                                # where you leave it)

Constants (target gameplay tuning, MKS-style):
  G            = 1.62 m/s²      # lunar surface gravity, scaled to feel
  T_MAX        = 4.5 * G        # max engine acceleration (TWR ~4.5)
  BURN_RATE    = 0.18 fuel/sec at full throttle, linear in lever
  V_SAFE_X     = 1.0 m/s        # horizontal touchdown limit
  V_SAFE_Y     = 2.0 m/s        # vertical touchdown limit
  ROT_STEP     = 3° per tick while button held
  FUEL_START   = 1000

Per-tick update (semi-implicit Euler, dt = real frame time):
  # 1. Inputs
  if rotate_l: θ -= ROT_STEP * dt
  if rotate_r: θ += ROT_STEP * dt
  thrust_mag  = sample_lever_or_button()
  thrust_on   = thrust_mag > 0 and fuel > 0

  # 2. Acceleration from thrust + gravity
  ax = 0
  ay = G                        # gravity always pulls down
  if thrust_on:
    a = thrust_mag              # scalar engine accel this tick
    ax += a * sin(θ)
    ay -= a * cos(θ)            # thrust pushes "up" relative to lander
    fuel -= BURN_RATE * thrust_mag/T_MAX * dt
    fuel  = max(fuel, 0)

  # 3. Semi-implicit Euler: update velocity first, then position
  vx += ax * dt
  vy += ay * dt
  x  += vx * dt
  y  += vy * dt

  # 4. Terrain test
  if y >= terrain_height_at(x):
    if on_landing_pad(x)
       and abs(vx) < V_SAFE_X
       and abs(vy) < V_SAFE_Y:
       win(score = pad_multiplier(x) * fuel)
    else:
       crash()
```

The collision against terrain is a per-column height-map lookup (`terrain_height_at(x)`), not a polygon test; pads are flat runs of equal-height columns flagged with a multiplier byte. The original arcade's score formula rewards both *unused fuel* (efficiency) and *pad difficulty* (the short, high-multiplier pads), creating two orthogonal scoring axes from one landing event[^1][^6].

Two implementation hazards a modern port must address. **Framerate coupling.** The 1979 build uses implicit `dt = 1 frame`, so the velocity, gravity, fuel-burn and rotation constants are calibrated to QuadraScan refresh; reproducing the constants on a 144 Hz canvas without multiplying by `dt` makes the lander effectively immune to gravity. **Semi-implicit ordering.** Updating position before velocity (explicit Euler) makes vertical landings energy-gain under gravity and visibly springy; updating velocity first (semi-implicit / symplectic Euler) is stable for the constant-gravity case and matches the felt behaviour of the cabinet. RK4 is overkill — the system is linear-with-step-input and semi-implicit Euler is the right tool.

## Player-experience hooks

The verb's signature feeling is **inverted braking**. Gravity is constant and free; the engine is finite and expensive. Every burn the player makes early in a descent is fuel they cannot spend at the bottom, where it is the only thing that matters. Beginners fight altitude — they hover and slow-creep, run dry, and free-fall the last 50 metres into a crater. Experts plan a **suicide burn**: they let gravity accumulate downward velocity, then commit to a single, precisely-timed full-throttle decel that reaches zero velocity exactly at the pad. Steve Swink would call the feel "delayed acknowledgement with high deferred cost"; the failure mode is **last-second over-commit** — once you are below the height where your remaining fuel can cancel your current velocity, the lander is dead and the player is still flying it. The horizontal axis is the lesser monster: small angle inputs translate to large lateral drift because the engine vector is the only counter, and there is no aerodynamic damping. The tilt-and-translate trick — angle to acquire lateral velocity, then immediately mirror-tilt to kill it — is the entire lateral mastery curve.

## Convergence notes

Shares semi-implicit Euler integration of a thrust vector with [[asteroids-rotate-thrust]] (same Atari hardware family, same year, same integration scheme) and with [[space-taxi-precision-thrust]] (which inherits the soft-touchdown kernel and adds passenger pickup); differs from Asteroids in *gravity* (constant downward vs. zero) and *topology* (bounded terrain vs. torus). Shares Newton's-law ballistic-trajectory-under-gravity with [[defender-of-the-crown-catapult]], but the catapult is a *one-shot pre-commit* of angle and power, while Lunar Lander is a *continuous closed-loop* control problem — the projectile cannot be steered, the lander must be. The split between pre-commit and closed-loop is one of the cleaner forks in the momentum family.

## Suggested mini-game scope

Single HTML file, canvas-2D, vanilla JS, no assets. One lander as three line segments plus a flame triangle when thrusting. Terrain is a `Float32Array` of column heights generated by midpoint-displacement, with three flat pads stamped in at random columns and tagged with `[2x, 5x, 10x]` multipliers. Three inputs: rotate-left, rotate-right, thrust (hold for analog feel; tap-feathering is the skill). Use `requestAnimationFrame` with a measured `dt`, semi-implicit Euler, no rigid-body library. HUD: altitude (height above terrain at current x), vertical and horizontal velocity, fuel, score. Land successfully if `|vx| < V_SAFE_X and |vy| < V_SAFE_Y` while overlapping a pad column; crash otherwise. Skip surface zoom, multiple lives, and sound. Aim ~250 LOC. Goal: in 30 seconds the player should feel that fuel is a deferred cost.

## References

[^1]: Lunar Lander (1979 video game) — Wikipedia — https://en.wikipedia.org/wiki/Lunar_Lander_(1979_video_game) — retrieved 2026-05-11
[^2]: Lunar Lander — MobyGames — https://www.mobygames.com/game/8743/lunar-lander/ — retrieved 2026-05-11
[^3]: Lunar Lander — International Arcade Museum (Killer List of Videogames) — https://www.arcade-museum.com/Videogame/lunar-lander — retrieved 2026-05-11
[^4]: A History of Lunar Lander (1969–1979) — Technologizer (Harry McCracken) — https://www.technologizer.com/2009/07/19/lunar-lander/ — retrieved 2026-05-11
[^5]: Jim Storer's original Lunar (FOCAL, 1969) — source listing and history, cs.brandeis.edu — http://www.cs.brandeis.edu/~storer/LunarLander/LunarLander.html — retrieved 2026-05-11
[^6]: Atari Lunar Lander — The Arcade Blogger — https://arcadeblogger.com/2017/09/27/atari-lunar-lander-1979/ — retrieved 2026-05-11
[^7]: Lunar Rescue — Wikipedia — https://en.wikipedia.org/wiki/Lunar_Rescue — retrieved 2026-05-11
[^8]: Thrust (video game) — Wikipedia — https://en.wikipedia.org/wiki/Thrust_(video_game) — retrieved 2026-05-11
