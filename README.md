# GRISAILLE

> Color was taken. Make it again.

A top-down twin-stick roguelite about liberating color, one pigment at a time. The world is
the underpainting — bleached, catalogued, covered in dust sheets — and every kill you make
stains it back.

**Play the current build:** https://mathieudutour.github.io/grisaille/

No engine, no build step: plain HTML5 canvas, procedural watercolor rendering, zero image
assets. Open `index.html` in a browser and it runs.

## Current slice

The game is structured as **raids from a persistent hub** (§7.5): each accession is a run
of combat bays → an archive (pick one swatch) → the objective room. Death is re-shelving —
back to the hub, colors kept, swatches and excess pigment forfeit.

- **Prologue — The Inventory.** Greyscale. Conservation Staff process you while you learn
  to read shape signatures one entity at a time. Ends at **Vermilion's cold forge** — the
  flip: the same crowd resolves at a glance, and the red guild enters the pool.
- **The flooded hatch.** Liberate **Ultramarine**. The two-slot weapon grid opens:
  delivery × payload, hot-swapped mid-fight (`Q` / `E`).
- **The buried vault.** Liberate **Orpiment** — the **Quill** hitscan beam that pierces the
  room and overheats fast, and the **Chain** payload that arcs to nearby targets. Its guild
  snipes from range behind a telegraph line. Grid = 9.
- **Resonance (§9).** Each secondary has its own meter: mixed red/blue kills reveal the
  **Tyrian kiln**, blue/yellow the **Scheele's Green kiln**, red/yellow the **Realgar kiln**.
  The mix is the key, not the reward.
- **The Firings (§7.6).** Only kills made with the mandated mix feed a kiln; its two parent
  guilds attack, each resisting half of it; swapping to the pure counter-color is always
  locally optimal — and feeds nothing. Reach temperature and the first things of that color
  ever to exist are born from the kiln mouth, immediately hostile: Tyrian spiral shells that
  phase in and out, Scheele's creeping damask that trails poison wallpaper, Realgar bursts
  that run at you and explode. Six colors → **the full 36-weapon grid**: Sponge (seeking
  spores) × Leech (heal + hazard pools), Bellows (cluster burst) × Detonate (blast +
  knockback), Compass (phase bolt) × Singularity (crowd vacuum), and every cross-mix.
- **Act IV — The Restoration (§2.5, §11.5).** With all six colors loose, the **Central
  Catalogue** opens: L. Hargreaves, archive staff, A-17 — an elderly conservator in a lab
  coat, noticeably more overexposed than the room. **The mirror fight:** he reads your two
  slots and, after a filing delay, his attack pattern *is* your current delivery, tinted
  with your mix — and he resists whatever he's currently holding, so staying one swap ahead
  of his paperwork is the whole fight. He reads faster as his condition worsens; at the end
  he holds everything, and the Whitening itself expands from him in bleach rings. The ending
  is authored, and it is release (§2.6) — closing on a final condition report filed on the
  world. RECOMMENDATION: none.
- **The Processing Floors (endless).** Escalating bays with a **branching route map** (§7.5):
  cleared bays open onto labelled routes — VERMILION BAY, ARCHIVE, an occasional SEALED BAY —
  so routing *is* the cross-harvest decision: pick the bay that grows the pigment you lack.

**Swatches (§7.3):** archive rooms offer loose pigment samples; each buffs one slot of one
color ("brush dabs pierce", "chill stacks faster", "quill overheats slower"…). *Fugitive*
swatches are stronger but fade; *permanent* ones last the run.

**The story arrives as paperwork (§2.5):** an opening condition report filed on the world
itself; each Warden introduced by their report and their own argument — they all volunteered
(§2.3), and the game never fully refutes any of them; the kiln reveal; and once all six
colors exist, an interdepartmental memo from the desk of L. Hargreaves, archive staff, A-17.
Each document shows once per save, and the world holds still while the paperwork speaks.

**Relics (§7.9):** every archive may also hold one piece of stationery or lab equipment —
pigment vial (+damage for one color), catalogue leaf (routes always labelled), humidity
gauge (fugitive swatches fade slower), crate seal (a fourth swatch on offer), conservator's
key (opens sealed bays), swatch book (resonance builds twice as fast).

Systems in: per-color charge meters read off Payne's fissures, pigment-drop economy,
permanent drying stains — the hub's layer persists forever, each bay is its own painting
(§3.6) — re-shelving with Working Stock (§7.7), condition-report HUD, liberation
persistence across sessions (localStorage), mouse/keyboard + twin-stick touch.

## Controls

| Input | Action |
|---|---|
| `WASD` / arrows | move |
| mouse | aim · hold click — fire |
| `Space` | dash |
| `Q` / `E` | swap delivery / payload color |
| touch | left half — move · right half — aim & fire · on-screen buttons — swap |

## Repository

- `index.html` + `game.js` — the game
- `docs/design-v0.7.md` — the design document
- `prototypes/flip-test.html` — the original flip-test prototype (§13, gate 1) —
  [play it here](https://mathieudutour.github.io/grisaille/prototypes/flip-test.html)
- `.github/workflows/deploy.yml` — auto-deploys the repo to GitHub Pages on every push

## Design pillars (see the doc for the full argument)

1. **Color is information.** Shape signatures are always legible but attentive; color is
   preattentive. Liberation buys perception *bandwidth*.
2. **Two slots, any color.** Delivery × payload: `n` colors → `n²` weapons from `2n` pieces.
3. **Synthesis beats subtraction.** Mixing is the key, not the reward.
4. **Bureaucratic preservation, not dark fantasy.** The antagonists are conservators.
   Death is re-shelving. The paperwork is always correct.
