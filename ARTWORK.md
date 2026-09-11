# Generated artwork

## v0.6 parody atlases

Created with OpenLux (seedream-5), then packed and normalized with sharp. Final runtime files:

- `public/assets/buah-atlas.webp`: 2880×1440, 4×2 grid of 720px cells. Banana, rambutan, mangosteen, mango / durian, pineapple, golden durian WILD with star badge, golden bell SCATTER. First generation was grid-accurate; converted straight to WebP.
- `public/assets/petir-atlas.webp`: 2048×1024, 4×2 grid of 512px cells on uniform `#f8d094` (the thunder machine gets its own golden reel backdrop). Blue gem, red gem, hourglass, ring / laurel, crown, lightning-gate SCATTER, lightning orb. Took three generations: v1 baked the prompt's hex tokens and a `MULTLIPER` typo into corners; v2 came back with tile frames and a gradient background that bleached symbols when flattened; v3 (label-free symbols, no dimension tokens in the prompt, chalice swapped for a crown by the model) packed cleanly. `docs/provenance/petir-source.jpg` retains the v3 source.

Final petir prompt (no hex codes, no dimensions, no tile/frame language — those tokens leak into the artwork as text):

> Production sprite atlas for a cartoon slot game, funny Greek-god theme. ONE wide landscape image with exactly eight symbols arranged in 4 columns and 2 rows, floating directly on a plain flat solid warm ivory background with generous empty space around each symbol, no tiles, no frames, no panels, no grid lines, no dividers, no borders. Chunky cartoon style with very heavy near-black ink outlines, compact chunky silhouettes, angular hard cel shading, playful mobile-game illustration, saturated gold purple and teal colors. Reading order: blue sapphire gem, red ruby gem, golden chalice, hourglass with gold caps, golden ring with red jewel, golden laurel crown, grey stone gate with glowing lightning bolt, glowing purple gold lightning orb. Each object about 70 percent of its cell. Absolutely no text, no letters, no numbers, no labels, no watermark anywhere.

Packing notes: connected-component detection ordered the scrambled v3 layout into spec order; each symbol fit to 380px in its 512px cell; backgrounds unified per machine (ivory for fruit, thunder-gold for petir) so sprite crops sit seamless on the reel canvas.


## v0.5 home, phone, rider and tree assets

Created with the built-in image_gen tool. Final runtime files:

- `public/assets/home-v05.webp`: illustrated desk and phone home scene.
- `public/assets/progression-atlas.webp`: clock, clover, money, slot cabinet, helmet and toolbox; used in tree nodes and phone apps.
- `public/assets/road-v05.webp`: scrolling Indonesian neighborhood environment.
- `public/assets/ojol-atlas.webp`: delivery rider, car, angkot, barricade, bag and parcel. The generator returned a painted checkerboard instead of alpha in early attempts. The final revision uses white background; the game renders cropped sprites using multiply compositing onto the road. No transparency is claimed.

### Home desk

Use case: stylized-concept. Landscape1536x1024 original illustrated game home scene Indonesian modest kos bedroom, intimate closeup of worn wooden desk viewed slightly from above. Thick nearblack outlines chunky angular cel shading polished indiegamecomic style teal shadows warmgolden morninglight. Foreground desk occupies lower65percent, believable roomy composition. A large dark smartphone lying on desk at center-right (center x1000 y670) slightly tilted clockwise, screen facing viewer, darkblank screen no UI. Leftside foreground green ojolhelmet resting naturally, small kopi glass and a family photo frame farleft. Backwall at top with barred window warm morninglight, small calendar illegible, hanging greenjacket edge, fan upperright. Thoughtful lived-in atmosphere no misery caricature. Main phone is focal point, desk details peripheral. NO words, labels, numbers, icons, gameUI or watermark. Draw one single coherent scene, not panels. Boldconfident blackstroke and saturated purposeful colors. Camera close enough phone can become clickable object. Original art.

### Progression atlas

Use case: stylized-concept. Game skilltree icon atlas, exactly3 columns2rows,1536x1024, eachcell512x512. Flat uniform warm ivory background #fff0ce. Six bold celshaded cartoon item icons centered eachcell, generous80px margin. Thick almostblack outlines, angular hard shadows, emerald amber coral palette matching Indonesian darkcomedy game. Readingorder top-left ornate golden alarmclock withcreamclockface no numbers; top-middle emerald fourleafclover with gold rim; top-right greenrupiahcash stack withgoldcoins; bottom-left small magnificent burgundy gold slotmachine showingthree stars; bottom-middle green delivery helmet withnavyvisor; bottom-right coral red mechanictoolbox withchunky wrench. Exactly6 objects no extra decoration outsideobjects, no readable text, no logos, no gridlines. All icons contained inside340x340 centeredineach512cell.

### Road environment

Use case: stylized-concept. Portrait1024x1536 top-down overhead Indonesian neighborhood street for three-lane motorcycle arcadegame. Perfectly straight vertical warm grey asphalt road occupying middle70percent x150to874, flatorthographic no perspectivevanishingpoint. Two subtle dashed ivory lane separators atx391 and633 create threeequal lanes. Peripheral sides only: narrow brickwalkways, colorful warung roofs, pottedplants, draincovers, stripedcurb, powercables. Bold almostblack thick outlines chunky hardcelshadedcartoon, warm muted sand/teal roofs. Mainroad empty, no vehicles, no people, no obstacles. Richcraftedindiegameenvironment, subtle asphalttexture butnotnoisy. Uniform roadwidth topbottom, edges align for scrolling. No text logos labels UI.

### Ojol initial atlas

Use case: stylized-concept. Production game sprite atlas for BESOK LUNAS Indonesian delivery rider game. Exactly 3 columns by 2 rows regular 1536x1024 canvas, each cell512 square. TRANSPARENT BACKGROUND with genuine alpha. Six separated centered sprites, silhouettes fit inside360x400 box eachcell, generous clear margins. READING ORDER: top left green-jacket green-helmet Indonesian motorcycle delivery rider seen from above and slightly behind, motorcycle points UP, visible rear wheel, hands handlebars; top middle red compact car top-down points UP; top right blue Indonesian angkot minibus top-down points UP; bottom left chunky orange white striped road barricade facing viewer topdown; bottom middle golden yellow takeaway delivery bag with black handle; bottom right bright green delivery parcel with small gold star badge. Bold very thick near-black ink outlines, chunky angular cel shading, saturated emerald/coral/yellow colors, polished playful indie-game assets, consistent overhead camera and readable at64pixels. No lettering, logos, watermark, gridlines, ground planes or background. All vehicles point upward. No extra sprites.

### Ojol spacing/transparency revision

Use case: precise-object-edit. Edit supplied sprite atlas. CRITICAL remove the painted checkerboard completely and output REAL TRANSPARENT ALPHA pixels, no checkerboard in RGB artwork. Also fix spacing to EXACT 3 columns x2 rows with 512x512 cells on1536x1024: shrink ALL six sprites so each fits fully within a 340x380 rectangle centered within its own512x512cell, leave at least65px transparent space eachside. Firstrow objects must end above y=465. Secondrow starts belowy=570. Current rider andcars are too tall andcross row boundary. Preserve drawings, colors, readingorder rider/car/van thenbarrier/bag/parcel. No gridlines, background color, shadows outside objects or extra objects. Real alpha transparency essential for game rendering.

### Ojol final white-background revision

Use case: precise-object-edit. Input is edit target. Keep six drawings exactly as shown, keep current sizes positions. Replace EVERY checkerboard background pixel with uniform PURE WHITE #ffffff. No checkerboard, no texture, no transparency simulation, no shadows outside objects. All gaps around vehicles andbetween their mirrors are purewhite. Keep boldblackoutlines vehiclecolors and all objectsunchanged. Output1536x1024.



## Phone orientation correction

Final asset: `public/assets/prologue-v2.webp`. Edited using the built-in image_gen tool, then inspected for correct inward-facing display and outward-facing phone back. The original atlas is retained for provenance.

Final prompt:

Use case: precise-object-edit
Edit target: the supplied four-panel comic atlas. Correct ONLY the smartphone in the bottom-right panel. The man must be looking at the screen on the side facing HIM. From our camera viewpoint we must see the opaque dark charcoal BACK of the phone, with a small rear camera lens near its upper corner, not a display. Remove the crown, coins, stars and luminous screen graphics from the outward-facing phone surface. Keep subtle purple/gold screen light falling onto his face from the hidden inward-facing display. Preserve the phone silhouette, hand position, man's expression, composition, art style, dimensions, 2x2 panel boundaries, and all other artwork. Keep the other three panels unchanged. No text, no logos, no new objects.

## v0.3 story atlas

`docs/provenance/prologue.png` — 1536×1024 four-panel comic atlas, generated with the built-in image_gen tool. Existing room and symbol artwork supplied as style references. CSS frames each panel without modifying the source image.

Final generation prompt:

Use case: illustration-story
Asset type: four-panel cinematic story atlas for BESOK LUNAS, an Indonesian dark comedy about the sandwich generation.
Create a 1536x1024 image divided into a perfectly regular 2 columns by 2 rows, FOUR rectangular panels, each 768x512. Thin dark gutters at cell boundaries. No text, captions, speech bubbles, lettering, numbers, or watermark; all story text is added in the game.
Use the supplied existing kos-room artwork and slot icons ONLY as style references: heavy almost-black outlines, chunky angular 2D cartoon, hard cel shading, restrained teal shadows and amber light, expressive original characters.
Keep protagonist consistent in all panels: Bima, Indonesian man about 30, short messy black hair, tan skin, green delivery jacket over charcoal shirt, tired kind face. His family is portrayed warmly, never as villains.
Top left: Bima at a tiny dining table sharing a simple meal with his wife and little daughter, both hopeful, cramped home, warm amber lamp, medium-wide.
Top right: Bima supporting his elderly father seated in a chair with his mother nearby, medicine packets and an unpaid envelope on a small table, concern and affection, muted blue-green.
Bottom left: late at night in the kos room, Bima alone at desk staring at a pile of bills and family photos, empty wallet open, green motorcycle helmet nearby, bent shoulders.
Bottom right: close-up of Bima's exhausted face lit by his smartphone's alluring purple and gold light, crown/coin motifs glowing on a simple generic phone screen, tiny reflection of hopeful smile, darkness behind.
Polished indie-game comic illustration. Strong readable silhouette in each panel; keep focal subjects centered with a little margin so panels can be displayed separately. No graphic suffering, no real brands.

Created with the built-in image_gen tool. The four user-supplied images were style references only. Original generated files were copied into this project; artwork is consumed directly by Phaser and CSS without destructive image edits.

## Files

- `public/assets/symbols-v2.webp` — final 1536×1024, 3×2 sprite atlas. Phaser samples a centered 416×416 area in each 512×512 cell. Reading order: kopi, sandals, ojol helmet, rooster, rupiah stack, crown.
- `docs/provenance/symbols.png` — first draft, retained for provenance; not used in the game.
- `public/assets/kos-room.webp` — 1536×1024 environmental backdrop.

## Initial atlas prompt

Use case: stylized-concept
Asset type: production sprite atlas for an Indonesian dark-comedy slot incremental game, BESOK LUNAS.
Primary request: ONE atlas containing exactly six original illustrated slot symbols, arranged in a perfectly regular 3 columns by 2 rows grid on a flat solid warm ivory background (#fff0ce). Landscape canvas 1536x1024, six equal square cells 512x512. NO grid lines. Every symbol centered in its own cell with generous empty margin (at least 60px), no overlap between cells.
Input images: the four attached images are STYLE REFERENCES ONLY, not edit targets. Match their very heavy near-black outlines, compact chunky silhouettes, angular cel shading, playful mobile-game illustration, bold simple shapes, limited purposeful colors. Make new Indonesian objects, no copied characters.
Symbols, exact reading order:
top-left: a small clear squat glass of dark kopi coffee with cream foam and one chunky curl of steam;
top-middle: a pair of bright coral red rubber flip-flops, chunky and diagonal;
top-right: a vivid emerald green ojol motorcycle helmet with dark teal visor;
bottom-left: a proud funny red-and-cream rooster head, big red comb, expressive determined eye;
bottom-middle: a thick stack of green Indonesian-inspired banknotes with a gold paper band, no readable denomination;
bottom-right: a magnificent chunky gold crown with one scarlet jewel, strongest jackpot silhouette.
Style: confident thick ink, hard geometric shadows, slight irregularity, crisp flat 2D raster illustration. Each object fills about 70 percent of its cell. Consistent scale and outlines. No lettering, no words, no labels, no watermark, no borders, no UI. Flat ivory background is required for seamless reels.

## Final atlas spacing revision prompt

Use case: precise-object-edit
Asset type: production 3x2 sprite atlas.
Edit target: the attached generated six-symbol atlas. Keep the SAME six original drawings, same colors, same style, and same exact reading order (coffee, sandals, green helmet / rooster, money stack, gold crown).
Change only spacing and size: shrink each drawing so its entire silhouette fits inside a 340x340 pixel box centered within its own 512x512 cell. Exactly 3 columns and 2 rows on a 1536x1024 image. Each cell must have at least 80px EMPTY IVORY SPACE on ALL FOUR SIDES. In particular the rooster must not bleed above its cell into the coffee tile, and no drawings may touch any tile boundary. Keep all six drawings equal apparent size. Flat uniform solid #fff0ce background everywhere; remove background texture/gradient. No grid lines, no extra objects, no text, no shadows outside each object. This is for runtime sprite cropping, generous spacing is mandatory.

## Final room prompt

Use case: stylized-concept
Asset type: illustrated game environment background for BESOK LUNAS, an Indonesian dark-comedy slot incremental.
Primary request: landscape 1536x1024 illustration of a small worn Indonesian kos room at night. Match the attached style references only: extremely thick dark outlines, chunky angular forms, flat cel-shaded 2D cartoon, strong silhouettes, no copied characters.
Scene: a small room with muted deep teal walls, a barred window showing a warm orange street lamp and dark blue rooftops, a cheap standing fan, laundry hanging on one side, an old calendar and electrical outlet, a chipped wood desk along bottom edge with a glass of kopi and tangled cable. No people. Room modest and lived-in, not grotesque. Main center wall and center desk area stay relatively empty and dark, because the interactive slot machine UI is overlaid there.
Composition: straight-on view with slight graphic perspective, environment details at outer edges, strong ink outlines, warm amber pools of light against midnight teal shadows. Attractive crafted indie game illustration, subtle paper texture. No text, no letters, no logos, no slot machine, no UI, no watermark.
