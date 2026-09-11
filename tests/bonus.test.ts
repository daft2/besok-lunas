import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fresh as newRun, spin, cost, baseCost, evaluateFruit, evaluatePetir, countScatter, tumblePetir, rollOrb, unlockMachine, machinePrice, machineRequirement, parseSave, parseBank, wrapState, MACHINES, type Grid, type State } from '../src/engine';

const fresh = (insight = 0, runs = 1): State => { const s = newRun(insight, runs); s.cash = 45000 + insight * 5000; return s; };
const seq = (...v: number[]) => { let i = 0; return () => v[i++ % v.length]; };
const buah = (s: State) => { s.machine = 3; s.buahUnlocked = true; return s; };
const petir = (s: State) => { s.machine = 4; s.petirUnlocked = true; return s; };

test('fruit wild substitutes and pays the best match per row', () => {
  // row1: Pisang + Wild + Rambutan -> pairs as both, best (Rambutan 1.25x) wins once
  const grid: Grid = [[2, 0, 4], [3, 6, 3], [4, 1, 2]];
  const wins = evaluateFruit(grid, 1000, 1);
  assert.equal(wins.length, 1);
  assert.equal(wins[0].symbol, 1);
  assert.equal(wins[0].amount, 1250);
});
test('fruit wild-only row pays the best pair available', () => {
  const grid: Grid = [[2, 6, 4], [3, 6, 3], [4, 0, 2]];
  const wins = evaluateFruit(grid, 1000, 1);
  assert.equal(wins.length, 1);
  assert.equal(wins[0].count, 2);
  assert.equal(wins[0].symbol, 5);
  assert.equal(wins[0].amount, 5000);
});
test('fruit scatters never form line wins', () => {
  const grid: Grid = [[2, 7, 4], [3, 7, 3], [4, 0, 2]];
  assert.equal(evaluateFruit(grid, 1000, 1).length, 0);
  assert.equal(countScatter(grid, 7), 2);
});
test('fruit spin costs double stake and pays triples on all lines', () => {
  const s = buah(fresh());
  const r = spin(s, null, () => 0)!;
  assert.equal(cost(s), 2000);
  assert.equal(r.paid, 2000);
  assert.equal(r.wins.length, 3);
  assert.equal(r.payout, 9000);
  assert.equal(s.cash, 52000);
});
test('fruit soft pity plants a pisang triple on a dry streak', () => {
  const s = buah(fresh()); s.pityLosses = 10;
  const r = spin(s, null, seq(0, .3, .5, .3, .5, 0, .5, 0, .3, .1))!;
  assert.equal(r.payout, 3000);
  assert.equal(s.pityLosses, 0);
});
test('three bells trigger 8 free spins at double mult plus instant pay', () => {
  const s = buah(fresh());
  const r = spin(s, null, () => .95)!;
  assert.ok(r.scatters >= 3);
  assert.equal(r.freeTriggered, true);
  assert.equal(s.free!.left, 8);
  assert.equal(s.free!.mult, 2);
  assert.equal(r.payout, 2000);
  assert.equal(s.cash, 45000);
});
test('free spins cost nothing and pay the free multiplier', () => {
  const s = buah(fresh());
  spin(s, null, () => .95)!;
  const cash = s.cash, minutes = s.minutes;
  const r = spin(s, null, () => 0)!;
  assert.equal(r.freeUsed, true);
  assert.equal(r.paid, 0);
  assert.equal(r.payout, 18000);
  assert.equal(s.cash, cash + 18000);
  assert.equal(s.minutes, minutes);
  assert.equal(s.free!.left, 7);
});
test('last free spin settles the run total and clears the state', () => {
  const s = buah(fresh());
  spin(s, null, () => .95)!;
  s.free!.left = 1;
  const r = spin(s, null, () => 0)!;
  assert.equal(r.freeEnded, true);
  assert.equal(r.freeWon, 18000);
  assert.equal(s.free, null);
});
test('petir pays anywhere: four of a kind is the smallest win', () => {
  const grid: Grid = [[0, 1, 2], [0, 3, 7], [0, 5, 0]];
  const wins = evaluatePetir(grid, 1000, 1);
  assert.equal(wins.length, 1);
  assert.equal(wins[0].symbol, 0);
  assert.equal(wins[0].count, 4);
  assert.equal(wins[0].amount, 400);
});
test('petir count tiers scale 4 / 5 / 6+', () => {
  const five: Grid = [[0, 0, 2], [0, 3, 4], [0, 5, 0]];
  assert.equal(evaluatePetir(five, 1000, 1)[0].amount, 800);
  const six: Grid = [[0, 0, 2], [0, 3, 0], [0, 5, 0]];
  assert.equal(evaluatePetir(six, 1000, 1)[0].amount, 2000);
});
test('petir tumble charges orbs into the step factor', () => {
  const grid: Grid = [[0, 1, 2], [0, 3, 7], [0, 5, 0]];
  const { steps, orbTotal } = tumblePetir(grid, 1000, 1, () => 0);
  assert.ok(steps.length >= 1);
  assert.equal(steps[0].orbSum, 2);
  assert.equal(steps[0].wins[0].amount, 1200);
  assert.ok(orbTotal >= 2);
});
test('petir all-same grid tumbles the maximum six steps', () => {
  const s = petir(fresh());
  const r = spin(s, null, () => 0)!;
  assert.equal(r.cascades.length, 6);
  assert.equal(r.payout, 42000);
  assert.equal(cost(s), 3000);
});
test('petir soft pity plants four biru for a small recovery win', () => {
  const s = petir(fresh()); s.pityLosses = 10;
  const r = spin(s, null, seq(0, .3, .5, .65, .8, .9, .3, .5, .65, .1))!;
  assert.equal(r.payout, 400);
});
test('three gates trigger 10 thunder free spins', () => {
  const s = petir(fresh());
  const r = spin(s, null, () => .9)!;
  assert.ok(r.scatters >= 3);
  assert.equal(r.freeTriggered, true);
  assert.equal(s.free!.left, 10);
  assert.equal(s.free!.mult, 1);
  assert.equal(s.cash, 42000);
});
test('orbs rolled during thunder free spins grow the eternal multiplier', () => {
  assert.equal(rollOrb(() => 0), 2);
  assert.equal(rollOrb(() => .999), 8);
  const s = petir(fresh());
  spin(s, null, () => .9)!;
  const r = spin(s, null, seq(0, 0, 0, 0, 0, 0, 0, 0, .98, 0))!;
  assert.equal(r.cascades[0].orbSum, 2);
  assert.ok(s.free!.mult >= 3);
});
test('machine catalogue prices, costs and requirements', () => {
  assert.equal(machinePrice(3), 32000);
  assert.equal(machinePrice(4), 60000);
  const s = fresh();
  assert.equal(baseCost(buah(fresh())), 2000);
  assert.equal(baseCost(petir(fresh())), 3000);
  assert.ok(machineRequirement(s, 3).includes('45 spin'));
  assert.ok(machineRequirement(s, 4).includes('80 spin'));
  s.spins = 45; s.upgrades.payout = 1; s.cash = 32000;
  assert.equal(unlockMachine(s, 3), true);
  assert.equal(s.buahUnlocked, true);
  s.spins = 80; s.sultanUnlocked = true; s.upgrades.payout = 2; s.cash = 60000;
  assert.equal(unlockMachine(s, 4), true);
  assert.equal(s.petirUnlocked, true);
});
test('v5 saves migrate with locked parody machines and no free spins', () => {
  const s = fresh() as unknown as Record<string, unknown>;
  s.version = 5; delete s.buahUnlocked; delete s.petirUnlocked; delete s.free;
  const restored = parseSave(JSON.stringify(s))!;
  assert.equal(restored.version, 6);
  assert.equal(restored.buahUnlocked, false);
  assert.equal(restored.petirUnlocked, false);
  assert.equal(restored.free, null);
});
test('save validation rejects bad machines, symbols and free states', () => {
  const badMachine = { ...fresh(), machine: 5 };
  assert.equal(parseSave(JSON.stringify(badMachine)), null);
  const badSymbol = fresh(); badSymbol.grid = [[8, 0, 0], [0, 0, 0], [0, 0, 0]] as unknown as Grid;
  assert.equal(parseSave(JSON.stringify(badSymbol)), null);
  const badFree = { ...fresh(), free: { left: -1, mult: 2, won: 0 } };
  assert.equal(parseSave(JSON.stringify(badFree)), null);
  const goodFree = { ...fresh(), machine: 3, buahUnlocked: true, free: { left: 5, mult: 2, won: 1000 } };
  assert.ok(parseSave(JSON.stringify(goodFree)));
});
test('bare v6 states still load as banks (no version collision)', () => {
  const s = fresh();
  const bank = parseBank(JSON.stringify(s))!;
  assert.equal(bank.activeSlot, 0);
  assert.equal(bank.slots[0]!.cash, s.cash);
  const wrapped = parseBank(JSON.stringify(wrapState(s)))!;
  assert.equal(wrapped.slots[0]!.cash, s.cash);
});
test('parody catalogue carries wilds, scatters and pay tables', () => {
  assert.equal(MACHINES[3].wild, 6);
  assert.equal(MACHINES[3].scatter, 7);
  assert.equal(MACHINES[4].scatter, 6);
  assert.equal(MACHINES[4].symbols[7].orb, true);
  assert.deepEqual(MACHINES[4].symbols[5].pays, [3, 8, 25]);
});
