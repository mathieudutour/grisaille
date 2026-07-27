# GRISAILLE

> Color was taken. Make it again.

A top-down twin-stick roguelite about liberating color, one pigment at a time. The world is
the underpainting — bleached, catalogued, covered in dust sheets — and every kill you make
stains it back.

**Play the current build:** https://mathieudutour.github.io/grisaille/

No engine, no build step: plain HTML5 canvas, procedural watercolor rendering, zero image
assets. Open `index.html` in a browser and it runs.

## Current slice

- **Prologue — The Inventory.** Greyscale. Conservation Staff process you while you learn
  to read shape signatures one entity at a time.
- **The cold forge.** Liberate **Vermilion**. The flip: the same crowd resolves at a glance.
  The red guild enters the pool and starts hunting you.
- **The flooded hatch.** Liberate **Ultramarine**. The two-slot weapon grid opens:
  delivery × payload, 4 combinations, hot-swapped mid-fight (`Q` / `E`).
- **The Liberation (endless).** Mixed factions, own-color resistance, the cross-harvest
  loop: spend the color you have to farm the color you lack.

Systems in: per-color charge meters read off Payne's fissures, pigment-drop economy,
permanent drying stains (§3.6), re-shelving with Working Stock (§7.7), condition-report
HUD, liberation persistence across sessions (localStorage), mouse/keyboard + twin-stick touch.

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
