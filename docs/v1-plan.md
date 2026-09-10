# Besok Lunas V1 plan

Players get a title they can start from, three save slots they can load, options they can change, family dialogue that reacts to the run, and events that interrupt the day.
The ojol and judol loop stays. Sports betting, sabung ayam, and crime systems stay out.
The operator reviews and lands BL-1, BL-2, BL-3, BL-4, and BL-5 in that order.

## How to read this

One box is one unit of work. Every box names the evidence that checks it. A nested box is a sub-step of the box above it. Check a box only when its evidence exists, a file, a log line, a screenshot, a test run, or a SHA. The body is a how-to. The appendices explain and record.

The program runs `pstack/skills/poteto-mode/playbooks/orchestrate.md`. The operator merges every PR. BL-2, BL-3, BL-4, and BL-5 stop at merge-ready until the operator reviews them.

Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

## Program checklist

### Arm the program

- [ ] State the protocol and this plan to the operator, then stop. Start execution only on her explicit go.
- [ ] On her go, arm a `/goal` with this exact text. "`docs/v1-plan.md`, BL-1 then BL-2 then BL-3 then BL-4 then BL-5. Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. The operator merges. V1 is done when a cold browser can start, save, load, and set options, play a reacting story with interrupting events, and finish a polished ojol plus judol day."
- [ ] Init git and a GitHub remote before any owner spawn. This folder is not a repository today.
- [ ] Read these from trunk at program start. Re-read them at every tick.
  - [ ] `git show origin/main:pstack/skills/poteto-mode/playbooks/orchestrate.md`
  - [ ] `git show origin/main:pstack/skills/swarm/SKILL.md`
  - [ ] `git show origin/main:pstack/skills/poteto-mode/playbooks/opening-a-pr.md`
  - [ ] `git show origin/main:pstack/skills/how/SKILL.md`
  - [ ] `git show origin/main:pstack/skills/interrogate/SKILL.md`
  - [ ] `git show origin/main:pstack/skills/show-me-your-work/SKILL.md`
- [ ] Arm the 30-minute audit tick. In a local session, a real terminal `/loop`. In a cloud root, a cloud-sleeper wake chain. Never leave the cadence to memory.
- [ ] Use this tick prompt, verbatim. "Re-read the execution playbook from trunk and the armed /goal. Audit the operation against both and fix drift in this tick. Probe every active lane and judge progress by side effects only. Stand down a stuck lane and dispatch its replacement now. Then send the operator a status message, whether or not anything changed, with the queue table of PR, owner, state, and head SHA, the verdicts since the last tick, what merged, open operator gates, and blockers."
- [ ] On the operator's hold or stand-down, send every owner a zero-writes order at once.

### Spawn owners

- [ ] Spawn one owner per PR with the full lifecycle the execution playbook names.
- [ ] Follow this dependency graph. Start dependent work only after its parent merges, or base it on the parent branch when the execution playbook stacks.
  - [ ] BL-1 is first. It branches from `main`.
  - [ ] BL-2 after BL-1.
  - [ ] BL-3 after BL-1. It may stack on BL-2 if `src/story.ts` already moved in BL-2.
  - [ ] BL-4 after BL-3.
  - [ ] BL-5 after BL-2 and BL-4.
- [ ] Hold the file boundaries. BL-1 touches `src/engine.ts`, `src/main.ts` persist helpers, and `tests/engine.test.ts`. BL-2 touches `src/menu.ts`, `src/menu.css`, `src/main.ts` boot, `src/story.ts` view `'menu'`, `tests/menu.spec.ts`, `tests/game.spec.ts`, and `tests/story.spec.ts`. BL-2 may change only the reduced-motion predicate in `src/rider.ts` and `src/reels.ts`. BL-3 touches `src/story.ts`, `src/story.css`, and `tests/story.spec.ts`. BL-4 touches `src/events.ts`, `src/engine.ts` trigger hooks, `src/story.ts` interrupt UI, and `tests/events.spec.ts` plus engine tests. BL-4 must not grow `checkAfterSpin()`. BL-5 touches `src/rider.ts`, `src/reels.ts`, `src/main.ts` game chrome, and the matching CSS.
- [ ] Hold the review gate. BL-2, BL-3, BL-4, and BL-5 change an interaction. They wait for the operator's review in chat with screenshots and a video before merge.

### PR mechanics, for every PR

- [ ] Resolve the forge once. Default to `gh`. If `command -v origin` succeeds and Origin can resolve the repository, use `origin pr` for every PR operation. Record any fallback to `gh`. Never require `gt`.
- [ ] Open the PR ready, never draft, with `origin pr create --status open --base <base-branch>` or `gh pr create --base <base-branch>` according to the resolved forge. A stack child targets its parent branch.
- [ ] Run the repo's lint and typecheck once before the PR-facing push. Push with hooks on. The typecheck command is `npm run build`.
- [ ] Run `/deslop` before each commit and `/no-comments` before review.
- [ ] Triage every Bugbot and security-reviewer comment per `../references/bugbot-triage.md`.
- [ ] Rebase onto current trunk before babysit and again before the merge-ready report.

### Verdict and merge, for every PR

- [ ] At the merge-ready head SHA, run the swarm per `pstack/skills/swarm/SKILL.md`. One gates lane. The ten live lanes from the PR's **Verify, live** block. The perf lane from its **Verify, perf** block. One audit lane that reads the diff and the receipts and distrusts the PR body.
- [ ] Clean only when every lane is `PASS`. Findings go back to the owner. A new head gets a fresh swarm and a fresh verdict.
- [ ] The operator squash-merges after a clean verdict at the exact head SHA. No owner merges, arms auto-merge, or closes. The root appends the PR to the linear stack and stops at merge-ready for review-gated PRs.

### Boot recipe, for every live lane

Each live lane runs on its own cloud VM at the PR head. Drive through Playwright against `http://127.0.0.1:5174`, or through `cursor-ide-browser` when a cloud VM is not used. `control-ui` from `cursor-team-kit` is not installed in this workspace.

- [ ] `git fetch origin <head-branch> && git checkout <head SHA>`.
- [ ] Run `npm install` then `npm run dev -- --port 5174`. Wait until `http://127.0.0.1:5174` answers.
- [ ] Deliver input only through Playwright locators or browser snapshot refs. Read-only diagnostics are `localStorage`, console errors, and the screenshot.
- [ ] Save every screenshot to `/tmp/swarm-<pr-id>/worker-<n>/<slug>.png` and return the paths with the report.

## Model save slots, settings, and story events (BL-1)

**Depends on.** None.

**Files.**

- [ ] Edit `src/engine.ts`.
- [ ] Edit `src/main.ts`.
- [ ] Edit `tests/engine.test.ts`.
- [ ] Leave `tests/game.spec.ts` and `tests/story.spec.ts` on the current `SAVE_KEY` seed helpers. Title-screen clicks wait for BL-2.

**Build.**

- [ ] Add `SaveBank` with three slots, `activeSlot`, and `settings` that holds `muted` and `reducedMotion`.
- [ ] Keep `State.muted` in sync with `settings.muted` so the existing `#sound` button and prestige copy still compile. Options across New Game wait for BL-2.
- [ ] Keep `parseSave` for one run document. Add `parseBank` that wraps a legacy v5 document into slot 0.
- [ ] Add `StoryState` fields `flags`, `fired`, `threads`, and `pending` as empty collections. Keep current `intro`, `guide`, `read`, and `finale`.
- [ ] Add `queueEvents` and `markFired` with a fixture table in tests. Production event rows wait for BL-4.
- [ ] Persist through `parseBank` in `src/main.ts` without showing a menu.

**You see.**

- [ ] A v5 `localStorage` value still boots the current prologue or room.
- [ ] `npm test` prints the new bank and event-queue cases as passing.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] `tests/engine.test.ts` gains a case that a v5 raw state becomes a bank with slot 0 filled.
- [ ] `tests/engine.test.ts` gains a case that three slots store independent cash values.
- [ ] `tests/engine.test.ts` gains a case that `queueEvents` is idempotent for the same id.
- [ ] Run `npm test`.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `grok-4.6-fast-xhigh` at the PR head, per the boot recipe.

- [ ] Lane 1. Regression lane against trunk. Run a cold visit with empty storage at trunk and head. Trunk has no bank. Gate that head still shows the prologue and does not throw. Save `bl1-empty-boot.png`. Pass when `#story-layer` is visible and the console has no pageerror.
- [ ] Lane 2. Seed a v5 mid-run save and reload. Save `bl1-v5-migrate.png`. Pass when the room or phone is playable and `parseBank` in the page has three slots.
- [ ] Lane 3. Seed a v5 save with an active job and reload. Save `bl1-job.png`. Pass when the reserved shift is still present.
- [ ] Lane 4. Toggle the existing sound button in the game shell, reload. Save `bl1-mute.png`. Pass when `muted` matches after reload.
- [ ] Lane 5. Seed invalid JSON in `SAVE_KEY` and reload. Save `bl1-corrupt.png`. Pass when a fresh run starts and the page does not white-screen.
- [ ] Lane 6. Skip the prologue, open Ojol, accept a shift, reload. Save `bl1-shift-resume.png`. Pass when the route is still reserved.
- [ ] Lane 7. End a day with unpaid kos on a seeded short-cash save. Save `bl1-ending.png`. Pass when the ending modal still appears after reload.
- [ ] Lane 8. Desktop 1440x900 cold boot. Save `bl1-desktop.png`. Pass when the prologue comic is readable.
- [ ] Lane 9. Mobile 390x844 cold boot. Save `bl1-mobile.png`. Pass when the prologue comic is readable and the next button is tappable.
- [ ] Lane 10. Open Judol after the current guide and spin once. Save `bl1-spin.png`. Pass when cash changes and a reload keeps that cash.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. Time in ms to parse 1000 bank documents at trunk `parseSave` and at head `parseBank`.
- [ ] Probe. A node script that calls the parse function 1000 times on the same fixture, run at trunk then head, interleaved twice.
- [ ] Baseline. Record the trunk `parseSave` mean first.
- [ ] Rule. Head `parseBank` mean must stay under 50 ms for 1000 parses. Do not compare unlike payloads as a ratio.

**Review gate.** None. BL-1 is not review-gated.

**Merge.**

- [ ] Root's clean verdict at the exact head SHA.
- [ ] Bugbot triage done.
- [ ] Rebased onto current trunk after the verdict, patch-id unchanged.
- [ ] The operator squash-merges.

## Ship the title, load, options, and pause menus (BL-2)

**Depends on.** BL-1.

**Files.**

- [ ] Create `src/menu.ts`.
- [ ] Create `src/menu.css`.
- [ ] Edit `src/main.ts`.
- [ ] Edit `src/story.ts`.
- [ ] Edit `src/rider.ts` only for the reduced-motion predicate.
- [ ] Edit `src/reels.ts` only for the reduced-motion predicate.
- [ ] Create `tests/menu.spec.ts`.
- [ ] Edit `tests/game.spec.ts`.
- [ ] Edit `tests/story.spec.ts`.

**Build.**

- [ ] Boot to a title screen with **Mulai**, **Lanjut**, **Muat**, and **Opsi**.
- [ ] **Lanjut** loads the last active slot and is disabled when every slot is empty.
- [ ] **Muat** shows three named slots with day, cash, and an overwrite confirm on **Mulai** into a filled slot.
- [ ] **Opsi** toggles mute and reduced motion, then writes `settings`. Reduced motion today is only `prefers-reduced-motion` in CSS plus `src/rider.ts` and `src/reels.ts`. The option must override that media query.
- [ ] **Mulai** and prestige keep `settings`. `fresh()` today drops mute. That must stop.
- [ ] An in-run system menu offers save, load, options, and return to title. Escape opens it from room, phone, or game when no locked modal owns the dialog.
- [ ] Replace the auto-jump into `parseSave` as the only boot path.
- [ ] Point `tests/game.spec.ts` and `tests/story.spec.ts` through **Lanjut** after they seed a slot. They currently `goto('/')` and expect the room or game.

**You see.**

- [ ] A cold visit shows the title, not the prologue, until **Mulai** or **Lanjut** is pressed.
- [ ] Saving into slot 2, returning to title, and loading slot 2 restores that cash and day.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] `tests/menu.spec.ts` covers title, continue disabled, load slot, overwrite confirm, options persist, pause save, and quit to title.
- [ ] `tests/game.spec.ts` and `tests/story.spec.ts` still pass after the title is in the way of `goto('/')`.
- [ ] Run `npm run test:ui`.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `grok-4.6-fast-xhigh` at the PR head, per the boot recipe.

- [ ] Lane 1. Regression lane against trunk. Run a cold visit at trunk and head. Trunk opens the prologue. Gate that head shows the title with **Mulai** and that **Mulai** then reaches the prologue. Save `bl2-title-vs-trunk.png`. Pass when the title is visible before any comic panel.
- [ ] Lane 2. Press **Mulai** on an empty bank. Save `bl2-new.png`. Pass when panel 01 of the prologue is visible.
- [ ] Lane 3. **Lanjut** is disabled on empty storage. Save `bl2-continue-off.png`. Pass when **Lanjut** is disabled.
- [ ] Lane 4. Start a run, quit to title, press **Lanjut**. Save `bl2-continue-on.png`. Pass when the same day and cash return.
- [ ] Lane 5. Fill slot 1 and slot 2 with different cash, load slot 1, then load slot 2. Save `bl2-load-slots.png`. Pass when cash matches the loaded slot each time.
- [ ] Lane 6. **Mulai** into a filled slot shows a confirm. Cancel keeps the slot. Confirm replaces it. Save `bl2-overwrite.png`. Pass when cancel preserves cash and confirm starts day 1.
- [ ] Lane 7. Options mute on, reload from title, open options. Save `bl2-options-mute.png`. Pass when mute is still on and a spin makes no sound.
- [ ] Lane 8. Options reduced motion on, start an Ojol shift. Save `bl2-reduced-motion.png`. Pass when collision shake and flashes are off.
- [ ] Lane 9. From the room, open the system menu, save, quit to title, load. Save `bl2-pause.png`. Pass when the system menu lists save, load, options, and title, and the load restores the room.
- [ ] Lane 10. Mobile 390x844 title, load list, and options. Save `bl2-mobile-shell.png`. Pass when all four title actions are tappable without horizontal scroll.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. Time from navigation start to the title **Mulai** button becoming visible. Trunk has no title, so also measure head time from **Mulai** to the first prologue caption.
- [ ] Probe. `performance.now` around those marks at trunk cold boot and at head cold boot, interleaved.
- [ ] Baseline. Record trunk time to first prologue caption first.
- [ ] Rule. Head time to **Mulai** visible must stay under 2000 ms on the lane VM. Head time from **Mulai** to the caption must stay within 300 ms of the trunk prologue time.

**Review gate.** The operator reviews before merge.

- [ ] Copy lane 1, lane 5, and lane 10 screenshots into `docs/review/BL-2-review-title.png`, `docs/review/BL-2-review-slots.png`, and `docs/review/BL-2-review-mobile.png`.
- [ ] Record a 30 to 60 second video of the change on a lane VM. Save it as `docs/review/BL-2-review.mp4`.
- [ ] Post the screenshots and the video in chat. Stop at merge-ready. Wait for the operator's click.

**Merge.**

- [ ] Root's clean verdict at the exact head SHA.
- [ ] Bugbot triage done.
- [ ] Rebased onto current trunk after the verdict, patch-id unchanged.
- [ ] The operator squash-merges.

## Play family dialogue as reacting threads (BL-3)

**Depends on.** BL-1. Stack on BL-2 when `src/story.ts` already owns view `'menu'`.

**Files.**

- [ ] Edit `src/story.ts`.
- [ ] Edit `src/story.css`.
- [ ] Edit `tests/story.spec.ts`.

**Build.**

- [ ] Replace the one-bubble `MESSAGES` list with threads. Each thread has an id, a character, beats, and an unlock rule that reads `flags`, day, spins, or cash.
- [ ] Opening a thread shows the beats already unlocked. A new beat appends. Bima's reply stays narration, not a player typer.
- [ ] Keep Maya, Ibu, Doni, and Naya. Advance their beats when the matching flag or counter changes.
- [ ] Keep the 100-spin `final` beat separate from `finaleReady()`. Today those two gates are independent.
- [ ] Preserve the current three-step guide. The first Maya beat still unlocks Judol.

**You see.**

- [ ] After twenty spins, Naya's thread has a second beat that was not in the first visit.
- [ ] The message list shows an unread mark on a thread that gained a beat.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] `tests/story.spec.ts` covers first Maya beat, unread after a later beat, and guide still reaching Judol.
- [ ] Run `npm run test:ui -- tests/story.spec.ts`.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `grok-4.6-fast-xhigh` at the PR head, per the boot recipe.

- [ ] Lane 1. Regression lane against trunk. Run the current guide to Maya's first text at trunk and head. Save `bl3-maya-guide.png`. Pass when Maya's first beat still contains uang sekolah and Judol unlocks after it is read.
- [ ] Lane 2. Cold title, new game, skip prologue, open Pesan. Save `bl3-inbox.png`. Pass when Maya, Ibu, and Doni exist and Naya is absent or locked.
- [ ] Lane 3. Seed a save with 20 spins, open Naya. Save `bl3-naya.png`. Pass when Naya's thread is open and shows more than the preview line.
- [ ] Lane 4. Seed 60 spins, open Maya. Save `bl3-maya-later.png`. Pass when a later beat about being online is visible under the first beat.
- [ ] Lane 5. Leave Maya unread after a new beat, return to the list. Save `bl3-unread.png`. Pass when Maya shows an unread mark.
- [ ] Lane 6. Open Doni's thread. Save `bl3-doni.png`. Pass when the screenshot bait is visible and Bima's narration is under it.
- [ ] Lane 7. Keyboard through the phone message list. Save `bl3-keyboard.png`. Pass when Tab stays inside the phone and Escape still puts it down.
- [ ] Lane 8. Desktop 1440x900 conversation. Save `bl3-desktop-thread.png`. Pass when beats stack as a thread, not as a single replaced paragraph.
- [ ] Lane 9. Mobile 390x844 conversation. Save `bl3-mobile-thread.png`. Pass when the back control and the last beat are both reachable.
- [ ] Lane 10. Replay prologue from the room, then open Pesan. Save `bl3-replay.png`. Pass when threads still match the current flags and the guide does not soft-lock.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. Time from tapping Maya in the list to the first beat text painted.
- [ ] Probe. `performance.now` around that tap at trunk (single bubble) and head (thread), interleaved.
- [ ] Baseline. Record trunk Maya-open time first.
- [ ] Rule. Head Maya-open time must stay under 300 ms and must stay within 150 ms of trunk.

**Review gate.** The operator reviews before merge.

- [ ] Copy lane 1, lane 4, and lane 9 screenshots into `docs/review/BL-3-review-guide.png`, `docs/review/BL-3-review-thread.png`, and `docs/review/BL-3-review-mobile.png`.
- [ ] Record a 30 to 60 second video of the change on a lane VM. Save it as `docs/review/BL-3-review.mp4`.
- [ ] Post the screenshots and the video in chat. Stop at merge-ready. Wait for the operator's click.

**Merge.**

- [ ] Root's clean verdict at the exact head SHA.
- [ ] Bugbot triage done.
- [ ] Rebased onto current trunk after the verdict, patch-id unchanged.
- [ ] The operator squash-merges.

## Fire calendar and money events during a run (BL-4)

**Depends on.** BL-3.

**Files.**

- [ ] Create `src/events.ts`.
- [ ] Edit `src/engine.ts`.
- [ ] Edit `src/story.ts`.
- [ ] Edit `tests/engine.test.ts`.
- [ ] Create `tests/events.spec.ts`.

**Build.**

- [ ] Put event rows in one table. Each row has `id`, a trigger, `interrupt` of `notify` or `block`, a thread id or copy, flags to set, and `once`.
- [ ] Call `queueEvents` from `endDay`, `spin`, job completion, bill spawn, and loan due. Leave `checkAfterSpin()` as economy routing only.
- [ ] Let `StoryDirector` play `pending`. Do not mutate cash, spins, job, or loan from the event table.
- [ ] A `notify` event badges Pesan and the room phone. A `block` event opens before the next spin or shift.
- [ ] Author the V1 set. Kos due tomorrow. Pinjol due. A missed Ibu reply. Doni after a win streak. Maya after a long Judol session. Naya at night clock. The finale remains the late door.
- [ ] Do not add sports betting, sabung ayam, or crime franchise rows.

**You see.**

- [ ] Closing a day that spawns a kos bill queues a block event before Judol unlocks the next morning.
- [ ] Ignoring Ibu sets a flag that later changes her thread.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] `tests/engine.test.ts` covers queue on bill spawn, no double fire, notify versus block, and flag writes.
- [ ] `tests/events.spec.ts` covers the kos block interrupting Judol and a notify badge on the phone.
- [ ] Run `npm test` and `npm run test:ui -- tests/events.spec.ts`.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `grok-4.6-fast-xhigh` at the PR head, per the boot recipe.

- [ ] Lane 1. Regression lane against trunk. Run end of day with enough cash at trunk and head. Save `bl4-end-day.png`. Pass when head still advances the day and then shows the kos event if a bill spawned.
- [ ] Lane 2. Seed day 2 with a kos bill unpaid, try Judol. Save `bl4-block-judol.png`. Pass when a block event is on screen and the reels do not spin.
- [ ] Lane 3. Seed a loan due today. Save `bl4-loan.png`. Pass when the pinjol event copy is visible before gambling.
- [ ] Lane 4. Leave Ibu unread, take three shifts, open Pesan. Save `bl4-ibu-missed.png`. Pass when Ibu has a new beat about not being answered.
- [ ] Lane 5. Force a win streak on Receh, open Doni. Save `bl4-doni-win.png`. Pass when Doni comments on the win.
- [ ] Lane 6. Spend spin time until evening clock, open Naya. Save `bl4-naya-night.png`. Pass when Naya asks if ayah is coming home.
- [ ] Lane 7. Dismiss a notify without opening Pesan, look at the room phone. Save `bl4-badge.png`. Pass when the phone still shows an unread count.
- [ ] Lane 8. Reload in the middle of a block event. Save `bl4-reload-block.png`. Pass when the same event is still pending and does not duplicate.
- [ ] Lane 9. Mobile 390x844 block event. Save `bl4-mobile-block.png`. Pass when the acknowledge control is tappable and the copy is readable.
- [ ] Lane 10. Reach finale ready, confirm Kesempatan Terakhir still opens. Save `bl4-finale.png`. Pass when the finale app still commits a roll and no extra gambling type appeared.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. Time from confirming **Tutup Hari** to the next readable screen, event or room.
- [ ] Probe. `performance.now` around that confirm at trunk and head, interleaved.
- [ ] Baseline. Record trunk end-day to room time first.
- [ ] Rule. Head must stay under 400 ms to the event or room, and within 200 ms of trunk.

**Review gate.** The operator reviews before merge.

- [ ] Copy lane 2, lane 4, and lane 9 screenshots into `docs/review/BL-4-review-block.png`, `docs/review/BL-4-review-thread.png`, and `docs/review/BL-4-review-mobile.png`.
- [ ] Record a 30 to 60 second video of the change on a lane VM. Save it as `docs/review/BL-4-review.mp4`.
- [ ] Post the screenshots and the video in chat. Stop at merge-ready. Wait for the operator's click.

**Merge.**

- [ ] Root's clean verdict at the exact head SHA.
- [ ] Bugbot triage done.
- [ ] Rebased onto current trunk after the verdict, patch-id unchanged.
- [ ] The operator squash-merges.

## Smooth the ojol, slots, and room loop (BL-5)

**Depends on.** BL-2 and BL-4.

**Files.**

- [ ] Edit `src/rider.ts`.
- [ ] Edit `src/rider-v05.css`.
- [ ] Edit `src/reels.ts`.
- [ ] Edit `src/main.ts`.
- [ ] Edit `src/style.css`.
- [ ] Edit `src/world-v05.css`.
- [ ] Edit `tests/game.spec.ts`.

**Build.**

- [ ] Remove the CORE PLAYTEST 0.5 badge. The title and system menu are the shell.
- [ ] Keep lane tap, swipe, keys, and pause. Fix any overlap between the system menu and the ride pause.
- [ ] Make reel stop, win, and empty results read as one beat. First-spin guide still scrolls the spin button into view.
- [ ] Align room, phone, and game chrome so cash, clock, and obligations match after every action.
- [ ] Do not add new gambling verbs.

**You see.**

- [ ] A first-time player can go title to ojol to Maya to first spin without a control covering another control.
- [ ] Pausing a ride and opening the system menu does not steal lane input.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] `tests/game.spec.ts` covers the guided ride, pause versus system menu, and first spin.
- [ ] Run `npm run test:ui -- tests/game.spec.ts`.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `grok-4.6-fast-xhigh` at the PR head, per the boot recipe.

- [ ] Lane 1. Regression lane against trunk. Run the guided first shift at trunk and head. Save `bl5-guide-ride.png`. Pass when head still completes the teaching sections and credits income once.
- [ ] Lane 2. Title to ojol to Maya to first spin. Save `bl5-full-guide.png`. Pass when each highlighted control is the one that advances the guide.
- [ ] Lane 3. Pause a ride, open the system menu, close it, resume. Save `bl5-pause-stack.png`. Pass when the rider is still paused until ride pause is cleared, then lanes work.
- [ ] Lane 4. Tap the road to change lanes on mobile. Save `bl5-tap-lane.png`. Pass when the rider moves and no UI chrome eats the tap.
- [ ] Lane 5. Land a coffee pair and a dead spin. Save `bl5-reel-read.png`. Pass when the result line matches the grid and the spin button label returns to PUTAR.
- [ ] Lane 6. Compare cash in the room header, phone wallpaper, and game wallet after one shift. Save `bl5-cash-sync.png`. Pass when all three show the same value.
- [ ] Lane 7. Reduced motion on, collide once. Save `bl5-motion.png`. Pass when shake and flashes stay off.
- [ ] Lane 8. Desktop 1440x900 room and game. Save `bl5-desktop.png`. Pass when the playtest badge is gone and the system control is visible.
- [ ] Lane 9. Mobile 390x844 room and game. Save `bl5-mobile.png`. Pass when primary actions sit above the home indicator and text does not clip.
- [ ] Lane 10. Finish a day, take the kos event, sleep, start the next morning from the room. Save `bl5-day-turn.png`. Pass when the clock reads the morning start and yesterday's unspent minutes are gone.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. Time from **GAS** to the first road frame, and time from **PUTAR** to reels at rest, at trunk and head.
- [ ] Probe. `performance.now` around those two actions, interleaved trunk then head.
- [ ] Baseline. Record both trunk times first.
- [ ] Rule. Head **GAS** to first frame must stay under 500 ms. Head spin-to-rest must stay within 20 percent of trunk unless Mesin Ngebut is owned, in which case it may be faster.

**Review gate.** The operator reviews before merge.

- [ ] Copy lane 2, lane 3, and lane 9 screenshots into `docs/review/BL-5-review-guide.png`, `docs/review/BL-5-review-pause.png`, and `docs/review/BL-5-review-mobile.png`.
- [ ] Record a 30 to 60 second video of the change on a lane VM. Save it as `docs/review/BL-5-review.mp4`.
- [ ] Post the screenshots and the video in chat. Stop at merge-ready. Wait for the operator's click.

**Merge.**

- [ ] Root's clean verdict at the exact head SHA.
- [ ] Bugbot triage done.
- [ ] Rebased onto current trunk after the verdict, patch-id unchanged.
- [ ] The operator squash-merges.

## Close the program

- [ ] Every box above is checked with its evidence.
- [ ] Reply to the operator with the report the execution playbook names.

## Appendix A. Prototype evidence

No throwaway prototype was built. The operator settled the loop, the V1 bar, and the missing start, save, load, and options shell in chat on 2026-09-10.

Unproven. Event interrupt density, notify versus block, is review-gated on BL-4. Title layout density is review-gated on BL-2.

## Appendix B. Alternatives rejected

Convert the gambling verb to scratch cards. Rejected because the operator kept slots plus ojol.

Kitchen-sink V1 with sports, sabung ayam, and crime. Rejected because the operator picked the story-complete slice.

Pause-only shell with no title. Rejected because the operator asked for a start menu as well as save, load, and options.

One autosave and no load list. Rejected because Load is meaningless with a single silent slot.

## Appendix C. Risks

This folder is not a git repository. Arming BL-1 fails until `git init` and a GitHub remote exist. Lands in the Arm the program boxes.

`pstack` is not in this repo. `git show origin/main:pstack/...` fails until those skills are vendored or the tick reads the plugin cache instead.

`control-ui` from `cursor-team-kit` is not installed. Live lanes drive Playwright at `http://127.0.0.1:5174` or `cursor-ide-browser`. Watch that in every live block.

Save-format change in BL-1 can brick playtests if `parseBank` rejects a v5 job. The live job-reload lane is the watch.

A title screen will fail `tests/game.spec.ts` and `tests/story.spec.ts` unless those specs click **Lanjut**. They seed `SAVE_KEY` with session flags `seeded` and `story-seeded`, then expect the room or game. Lands in BL-2.

No test today clicks `#sound` or asserts `muted`. Prestige copies mute. `fresh()` does not. Lands in BL-2 settings.

Reduced motion is OS `prefers-reduced-motion` only. An in-game toggle that ignores `src/rider.ts` and `src/reels.ts` is a fake option. Lands in BL-2.

BL-3 and BL-2 both edit `src/story.ts`. Stack BL-3 on BL-2 when both are in flight.

Long-run economy balance stays out of V1. A player can still hit a soft lock if bills outrun ojol income. BL-5 does not retune numbers unless a live lane finds an unplayable first hour.

## Appendix D. Links and reading list

Read `README.md`, `src/engine.ts`, `src/story.ts`, `src/main.ts`, `src/audio.ts`, `src/reels.ts`, `src/rider.ts`, `tests/engine.test.ts`, `tests/story.spec.ts`, and `tests/game.spec.ts` before editing.

BL-2 and BL-5 run `pstack/skills/how/SKILL.md` before coding chrome.

BL-1 and BL-4 run `pstack/skills/interrogate/SKILL.md` on the `SaveBank` and event table before the PR-facing push.

The trail is `.audit/besok-lunas-v1.tsv` per `pstack/skills/show-me-your-work/SKILL.md`. Keep it local until the operator asks to commit it.
