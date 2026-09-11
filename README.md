## v0.5.1 polish review

- Upgrade branches can be viewed individually, with larger readable nodes on mobile. The overview remains available.
- Tree shows current cash and today's bills; unaffordable upgrades show the missing amount. Branch selection survives purchases.
- Day planner separates time capacity from locked gambling actions and calls out payment shortfalls.
- Ojol supports tapping directly on the road as well as swiping, keyboard, and lane buttons. Pause controls announce their current action; reduced-motion mode suppresses collision shake and flashes.
- Phone keyboard focus skips hidden upgrade branches.

Reviewed opening, core machine modes, work recovery, calendar/loan deadlines, migration, and final outcomes through browser and engine checks. This remains a browser prototype; long-run economy balance and native packaging need separate work.

# BESOK LUNAS — Playtest 0.5

An Indonesian dark-comedy incremental about Bima, a delivery rider supporting his parents, wife and daughter while carrying Rp75 million in family debt. Browser-playable on desktop and mobile; fictional money and outcomes, with no transactions or backend.

## Run locally

Node.js 22.12+ (tested on Node 24):

```sh
npm install
npm run dev
npm run build
npm run preview
npm test
npm run test:ui
```

Use Vite's network URL for a phone on the same Wi-Fi. Saves belong to the browser and origin. Source uses Phaser 3, TypeScript and Vite; responsive HTML/CSS supplies the room, phone, menus and tutorial. A canvas renders the Ojol minigame.

## New in 0.5

### A home built around the phone

A new illustrated desk scene replaces the floating helmet and phone badges. Pick up the phone to open **Ojol, Messages, Judol, Rencana, Pinjol**, or the final opportunity. Ojol's offer, route, and completion receipt now stay inside the phone. Putting it down pauses the shift; reopening Ojol resumes the saved route. The room retains a daily clock, cash, and family obligation summary.

The rider uses generated motorcycle, car, angkot, barricade, order-bag and parcel sprites, an illustrated neighborhood, smooth lane changes, collection particles and impact feedback. The phone and skill tree adapt to desktop and portrait mobile screens. Prologue and slot reels retain their previous artwork.

### Rencana: connected upgrade tree

The tree replaces the flat upgrade purchase list. Each node shows its effect, ranks, cost, and prerequisite. You can invest across branches; these are not mutually exclusive classes. Purchases use cash and reset on prestige.

| Branch | Progression | Effect |
|---|---|---|
| Keseharian | Ritme Sehat → Rute & Fokus → Hoki Kecil | Longer days → cheaper action time → modest common-symbol assistance |
| Mesin | Pengali Cuan → Tahan Dulu / Mesin Ngebut → auto-spin and advanced machines | Payout multipliers, held respins, animation speed, machine unlocks |
| Di Jalan | Pelanggan Tetap → Jam Ramai → Motor Terawat | Higher fares → more bonus bags → smaller collision deductions |

Pelanggan Tetap starts at Rp6,500 and adds Rp1,250 to base fare per rank (3 ranks). Jam Ramai starts at Rp10,000 and adds eight percentage points to random bonus-order appearance per rank (3 ranks, maximum 66%). Motor Terawat starts at Rp14,000 and reduces the Rp600 collision deduction by Rp150 per rank (2 ranks). Active shift terms are fixed at departure.

Hoki Kecil starts at Rp18,000, with 3 ranks. Each adds eight percentage points to assistance on an otherwise empty initial slot result. Receh assistance is a coffee triple; Sultan is a coffee pair; Rantai is a coffee triple. It never creates a rare symbol. Receh assistance is capped at 50%; Sultan and Rantai stay capped at 30%. The hidden loss-streak pity still has no meter and no fixed guaranteed payout. Luck never modifies the finale's 1% chance.

Pengali Cuan starts at Rp8,000 and adds 25% slot prizes per rank (5 ranks). The next rank of any upgrade costs 2.4× the previous. Sultan requires Tahan Dulu I as well as 30 spins and Rp28,000. Rantai requires Sultan and Pengali Cuan II, plus 60 spins and Rp42,000. Auto-spin needs both Tahan Dulu I and Mesin Ngebut I. One rank in a parent is enough to open its child unless a higher rank is explicitly specified.

Four new generated assets are included: `home-v05.png`, `ojol-atlas.png`, `road-v05.png`, and `progression-atlas.png`. Their full prompts and rendering notes are in `ARTWORK.md`.

## Daily economy and riding rules

### One shared daily time budget

- Day 1 starts at 08:00 with **600 minutes / 10 hours** available.
- A spin or paid held respin uses **20 minutes**. An Ojol shift reserves **120 minutes on departure**.
- Reading, menus, payments and purchases take no time. The clock advances only through game actions; leaving a tab closed does not advance dates.
- Actions cannot start without enough time. An exhausted day stops auto-spin and offers the end-of-day review. There is no unlimited work beyond the daily budget.
- **Tutup Hari** reviews cash and today's obligations. Confirmation pays those obligations automatically, then restores the daily allowance. Unspent time is discarded. If cash cannot cover today's obligations, confirming ends the run.
- An active shift must be completed before ending the day; leaving its panel pauses it. Refresh keeps the reserved time and route progress.
- **Ritme Sehat** costs Rp10,000 initially and adds 60 active minutes per level, maximum two levels. **Rute & Fokus** costs Rp14,000 initially and cuts shift time by 30 minutes and spin time by 5 minutes per level, maximum two levels. Upgrade prices multiply by 2.4 per level. These upgrades reset on prestige.
- Monetary pressure still rises every 40 activity points: one per spin, four per completed shift. Each tier adds 15 percentage points to machine fees, capped at +150%. Calendar deadlines are separate from pressure points.

### Ojol: three-lane riding

Accept a shift, then press **GAS**. A ride contains 12 saved sections, lasting about 24 seconds of active play. The first two are slower teaching sections: collect a bag in the middle, then avoid the middle-lane obstacle. Later sections randomize obstacles and bonus orders. Every section leaves at least one safe lane, and bags never overlap obstacles.

Controls: **Left/Right or A/D**, three lane buttons, or a horizontal swipe on the road. **P** or the pause button pauses. Hiding the tab pauses automatically. Routes resume paused after refresh.

Base fare is Rp5,000 minus fuel/service costs of Rp1,500–3,000 as pressure rises. Each collected yellow order bag adds **Rp750**; each collision subtracts **Rp600**. Net shift income has a **Rp1,000 floor**, with no fuel cash required upfront. Income is credited exactly once at completion. The completion receipt shows bonuses, collisions, net income and remaining daily time.

The full route is committed on departure, and lane/checkpoint outcomes save as played. Reload cannot generate a new route or duplicate a completed reward. The current section restarts on resume; this prototype does not claim anti-cheat protection.

### Debt has a final date

The **Rp75 million family mission debt** is separate from the starting **Rp75,000 kos principal** and any Pinjol loan.

Kos installments arrive on days **3, 6, 9…**: Rp4,000, then Rp7,000, Rp10,000, etc., capped by unpaid principal. The installment must be covered before that day ends. Gambling pauses while today's installment is outstanding, but work remains possible within the remaining time.

Pinjol offers one active loan:

| Principal received | Initial fixed interest | Total repayment |
|---|---|---|
| Rp10,000 | 20% | Rp12,000 |
| Rp30,000 | 30% | Rp39,000 |
| Rp75,000 | 45% | Rp108,750 |

New offers add 5 interest percentage points per pressure tier. Accepted interest stays fixed and is not discounted for early payment. A loan accepted on day D is due **at the end of day D+3**. Partial repayment reduces the balance without extending the deadline. On the due day, gambling pauses until repayment. At bedtime, insufficient funds cause repossession and end the run. **The old repeating late-fee/grace-period loop is removed.**

### Internal soft pity

There is no Bonus Sabar meter or sixth-loss cash award. This section documents balancing for the developer; these details are not displayed in the game.

Receh assistance starts after two consecutive zero-payout spins: 20%, then +8 percentage points per further empty, capped at 50%. A successful Receh check writes a coffee triple on the paying center row. Sultan and Rantai still wait until three empties, then 4% + 4 percentage points per further empty, capped at 24% before luck, and write a coffee pair (Sultan) or coffee triple (Rantai). Any payout resets the streak. Assistance never directly creates a rare symbol or guarantees a win after a fixed number of losses. It persists across saves, resets on prestige, and never affects the finale's 1% chance.

Naked Receh expected return stays slightly negative, so Ojol remains the starter wage. After Pengali Cuan I, Receh expected return is positive: a full day at the starter slot can cover kos without narik. Ojol still pays more per minute, which is the recovery job if Receh empties the wallet. Sultan costs 3× and hits on three lines: bigger sessions, faster dumps. If Sultan empties the wallet, Receh is still cheap enough to grind. Rantai stays triples-only; pair table changes do not pay there.

## Story, tutorial and phone

Four illustrated comic panels introduce Bima's family, care responsibilities, bills and temptation. Progress saves between panels; the prologue can be replayed. It leads to the room rather than the slot machine.

The tutorial highlights one next target: phone → Ojol app → accept shift → GAS and lane guidance → Messages → Maya → back to apps → Judol → first spin. Phone callouts change as the player navigates. The first spin button is outlined and brought into view. Daily time and upcoming obligations are visible in both room and game views.

The phone contains Messages, Judol, the upgrade shop, Pinjol and the late finale. More family messages unlock with spin progress. Escape closes the phone and Tab remains within it; room shortcuts cannot spin hidden reels.

## Machines and progression

| Machine | Gameplay | Base cost | Unlock |
|---|---|---|---|
| Receh Rejeki | Pairs or triples on the center row; optional paid hold after upgrading | 1× stake | Starting machine |
| Sultan Malam | Pairs or triples on three horizontal lines | 3× stake | Tahan Dulu I + 30 spins + Rp28,000 |
| Rantai Rejeki | Triples clear and refill; triple payout ×1.5, then cascade factors 1×, 2×, 4×; maximum three evaluated stages; no hold | 3× stake | Sultan + Pengali Cuan II + 60 spins + Rp42,000 |

Base symbol weights are coffee 30, sandals 24, helmet 18, rooster 14, money 9, crown 5. Soft pity can modify an otherwise empty initial result. Pair payouts are 1× / 1.25× / 1.5× / 1.5× / 2.5× / 5×; triples 3× / 5× / 8× / 12× / 24× / 60×. A coffee pair returns the stake; pressure fees can still make that spin a loss.

Existing upgrades add payout multipliers, one paid held respin, shorter visual animations, and auto-spin. The animation-speed upgrade does not reduce in-game time; Rute & Fokus does. Each 40 spins grants one prestige memory, plus one for each advanced machine opened. Each memory supplies Rp5,000 starting cash and +2% payout, with the permanent multiplier capped at +50%.

## Kesempatan Terakhir

The finale requires 100 spins, Rp150,000 cumulative gross prizes, Rantai Rejeki unlocked, Rp10,000 entry money and no active job or current unpaid bill. Opening commits one integer from 0–99 and saves before the three seals are revealed.

Only 0 produces the good ending: **1% per eligible finale**. A Rp100 million prize settles tracked debts and leads to the family epilogue. Other outcomes empty the wallet and leave the debt behind: blocked withdrawal, platform seizure, or a vanished app. Both outcomes end the run and permit prestige. The 1% is a fictional design rule, not a real-world statistic. The family mission principal is currently settled through this finale, rather than normal installments.

## Saves and validation

The stable storage key remains `besok-lunas-v1`; save data is now version 5. Version 4 saves retain their calendar and active delivery, and gain the new upgrade fields at zero. Previously owned upgrades and machine unlocks remain usable even if they do not have the newly introduced parents. The following calendar conversion applies only to version 3 and earlier saves. Older saves preserve cash, upgrades, machine unlocks, story and loan balance. Calendar conversion starts on day 1 with a fresh time budget. Old overdue loans become due at the end of day 1, giving one bounded day to settle. Other old deadlines convert remaining turns into days. An active old three-stop delivery becomes a new reserved two-hour route. Completed endings remain completed.

39 deterministic engine tests cover payouts, pity, time budgets, upgrades, calendar payments, hard endings, road safety, collisions, single payment, migration and finales. 46 desktop/mobile browser tests passed across the full run and targeted reruns, covering the guided route, keyboard/touch lane controls, pause/resume, exhausted-day behavior, automatic repayment, prestige, slot controls and both narrative endings. The production build also passes TypeScript checking.

Local saves are user-editable; use one active tab per save. No account sync or tamper resistance is claimed.

## Files and scope

- `src/engine.ts`: state, pure game rules, migration, daily economy, generated routes, pity and endings.
- `src/rider.ts`, `src/rider-v05.css`: animated road, sprite compositing, rider controls and feedback.
- `src/tree.ts`, `src/tree.css`: connected upgrade tree and node states.
- `src/world-v05.css`: illustrated home, phone apps and responsive presentation.
- `src/day.ts`, `src/day.css`: daily planning UI, rider styling and tutorial highlights.
- `src/story.ts`, `src/story.css`: comic, room, phone and guide progression.
- `src/main.ts`, `src/reels.ts`: menus, slot controls and reel animation.
- `public/assets/`: generated art; `prologue-v2.png` has the corrected inward-facing phone screen.
- `ARTWORK.md`: generation prompts and provenance.
- `screenshots/`: rendered desktop/mobile previews, with `v05` for the new flow.

This remains a browser prototype. Signed native PC/iOS/Android packaging, the full crime/franchise/corruption event system, sports betting and sabung ayam are outside this slice. Broader device testing and long-run balancing remain future work.
