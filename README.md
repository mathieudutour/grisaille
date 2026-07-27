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
- **Resonance (§9).** Kills with mixed red/blue weapons reveal the **Purple Kiln** in
  unaccessioned territory. The mix is the key, not the reward.
- **The Firing (§7.6).** Only kills made with the mix feed the kiln; both parent guilds
  attack, each resisting half of it; swapping to the pure counter-color is always locally
  optimal — and feeds nothing. Reach temperature and the first purple things ever to exist
  are born from the kiln mouth, immediately hostile. Purple brings the **Compass** phase
  bolt and the **Singularity** payload. Grid = 16.
- **The Processing Floors (endless).** Escalating bays, all factions, archives every fourth
  room. Own-color resistance and the cross-harvest loop throughout.

**Swatches (§7.3):** archive rooms offer three loose pigment samples; each buffs one slot of
one color ("brush dabs pierce", "chill stacks faster", "quill overheats slower"…). *Fugitive*
swatches are stronger but fade after 100 seconds; *permanent* ones last the run.

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
