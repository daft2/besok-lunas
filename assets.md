# Besok Lunas — asset brief

This is the handoff list for artwork that can be generated later. The game should
remain playable with the current assets or its CSS/canvas fallbacks when an item
is marked `planned`.

## Art direction

- **Style:** thick imperfect ink lineart, flat screenprint fills, subtle paper grain.
- **Palette:** charcoal `#102c28`, bottle green `#1f5a43`, warm paper `#f4e9c9`,
  mustard `#f1c75b`, terracotta `#bd5947`.
- **Rules:** no embedded text, no logos, no gradients, no photorealism, no 3D
  renders. Keep a clear margin around every object and use a warm paper or
  transparent background consistently.

## Current generated assets

| File | Use | Format / layout | Status |
| --- | --- | --- | --- |
| `public/assets/home-lineart-v1.jpg` | Kos room / desk background | 3:2 wide illustration | wired |
| `public/assets/symbols-v2.webp` | Receh Rejeki symbols | 3 × 2 sheet, 512px cells | wired |
| `public/assets/ojol-atlas.webp` | Rider, traffic, barricade, order bags | existing sprite atlas | wired |
| `public/assets/road-lineart-v1.jpg` | Ojol route background | portrait road illustration | wired |

## Planned / nice-to-have

| Asset | Exact brief | Suggested size | Priority |
| --- | --- | --- | --- |
| `phone-icons-lineart-v1.png` | Six transparent icons: Ojol helmet, messages envelope, slot cabinet, upgrade wrench, pinjol cash, final star. Same ink treatment. | 6 × 256px cells, 1536 × 256 | high |
| `buah-symbols-lineart-v1.png` | Buah Berkah: banana, rambutan, mangosteen, mango, durian, pineapple, gold wild durian, bell scatter. | 4 × 2 cells, 512px each | medium |
| `petir-symbols-lineart-v1.png` | Kakek Petir: blue gem, pomegranate, cup, clock, ring, crown, gate, lightning orb. | 4 × 2 cells, 512px each | medium |
| `ojol-lineart-v2.png` | Same six road sprites as v1, isolated on transparent background with no cell-colored rectangles. | 3 × 2 cells, 512px each | high |
| `symbols-lineart-v2.png` | Receh symbols from `symbols-lineart-v1.jpg`, re-exported as transparent cells with no colored rectangles. | 3 × 2 cells, 512px each | medium |
| `prologue-lineart-v1.webp` | Four inward-facing comic panels matching the lineart system: family meal, parents, bills, phone temptation. | 4 separate 1536 × 1024 panels | low |
| `ending-lineart-v1.webp` | Two ending illustrations: family breakfast; Bima at the desk with the unpaid receipt. | 2 separate 1200 × 900 panels | low |

## Export requirements

- Preserve the exact cell order in the tables above.
- Prefer transparent PNG for sprites; keep the object inside roughly 78% of its
  cell so animation can scale it without clipping.
- Do not add captions or UI copy into the image; all copy belongs in TypeScript.
- Keep line weight readable at 64px on a phone screen.
