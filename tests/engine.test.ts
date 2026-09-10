import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fresh as newRun, spin, evaluate, cost, buyUpgrade, upgradeCost, unlockSultan, payBill, endRun, prestige, parseSave, insightEarned, type Grid, advanceTime, quoteLoan, borrow, repayLoan, loanDue, startJob, jobStep, cascade, tier, minimumCost, baseCost, unlockMachine, beginFinale, revealFinale, finaleReady, totalDebt, endDay, remainingTime, jobMinutes, spinMinutes, dayCapacity, canWork, moveLane, makeRoad, jobReward, ROAD_LENGTH, jobQuote } from '../src/engine';

const fresh = (insight = 0, runs = 1) => { const s = newRun(insight, runs); s.cash = 45000 + insight * 5000; return s; };

test('pairs pay once; triples replace rather than stack with pair payouts', () => {
  const grid: Grid = [[1, 0, 2], [1, 0, 3], [4, 0, 2]];
  assert.equal(evaluate(grid, 1000, [1])[0].amount, 3000);
  assert.deepEqual(evaluate(grid, 1000, [0, 1, 2]).map(w => w.amount), [750, 3000, 1000]);
});
test('pair can occur on the two outside reels', () => {
  const grid: Grid = [[1, 4, 2], [1, 0, 3], [4, 4, 2]];
  assert.deepEqual(evaluate(grid, 1000, [1])[0].columns, [0, 2]);
});
test('spin deducts stake once and settles an exact known outcome', () => {
  const s = fresh(); const r = spin(s, null, () => 0)!;
  assert.equal(r.paid, 1000); assert.equal(r.payout, 3000);
  assert.equal(s.cash, 47000); assert.equal(s.spins, 1); assert.equal(s.totalWon, 3000);
});
test('hold requires unlock and a normal spin; preserves only chosen column for one paid respin', () => {
  const s = fresh(); assert.equal(spin(s, 1), null);
  s.upgrades.hold = 1; spin(s, null, () => 0);
  const before = s.cash, held = [...s.grid[1]];
  const r = spin(s, 1, () => .99)!;
  assert.deepEqual(r.grid[1], held); assert.equal(r.grid[0][1], 5);
  assert.equal(s.cash, before - r.paid + r.payout + r.bonus);
  assert.equal(spin(s, 1), null); assert.equal(spin(s, -1), null); assert.equal(spin(s, .5), null);
});
test('soft pity has no fixed sixth payout, grows moderately and resets after a win', () => {
 const s=fresh();s.cash=100000;
 const losing=(assist:number)=>{let n=0;return ()=>n<9?[0,.4,.7][Math.floor(n++/3)]:assist;};
 for(let i=0;i<8;i++)assert.equal(spin(s,null,losing(.99))!.payout,0);
 assert.equal(s.pityLosses,8);assert.equal(s.cash,92000);
 const r=spin(s,null,losing(.1))!;assert.equal(r.payout,500);assert.equal(r.bonus,0);assert.equal(s.pityLosses,0);
 s.pityLosses=50;assert.equal(spin(s,null,losing(.25))!.payout,0);assert.equal(s.pityLosses,50);
 spin(s,null,()=>0);assert.equal(s.pityLosses,0);
});

test('Sultan charges three stakes and pays three independent horizontal lines', () => {
  const s = fresh(); s.machine = 1; s.sultanUnlocked = true;
  const r = spin(s, null, () => 0)!;
  assert.equal(cost(s), 3000); assert.equal(r.wins.length, 3); assert.equal(r.payout, 9000); assert.equal(s.cash, 51000);
});
test('insufficient funds, bills and ended runs cannot produce new spins', () => {
  const s = fresh(); s.cash = 999; assert.equal(spin(s), null); assert.equal(s.cash, 999);
  s.cash = 9000; s.bill = 4000; assert.equal(spin(s), null);
  s.bill = 0; endRun(s); assert.equal(spin(s), null);
});
test('kos bill arrives on day 3, can be paid once and reduces principal',()=>{
 const s=fresh();endDay(s);endDay(s);assert.equal(s.day,3);assert.equal(s.bill,4000);assert.equal(spin(s),null);
 const cash=s.cash;assert.equal(payBill(s),true);assert.equal(s.cash,cash-4000);assert.equal(s.debt,71000);assert.equal(payBill(s),false);
 endDay(s);endDay(s);endDay(s);assert.equal(s.bill,7000);
});

test('daily kos bill cannot exceed principal; insufficient end-of-day funds end run',()=>{
 const s=fresh();s.debt=1000;endDay(s);endDay(s);assert.equal(s.bill,1000);s.cash=900;assert.equal(payBill(s),false);
 endDay(s);assert.equal(s.ended,true);assert.equal(s.day,3);assert.equal(startJob(s),false);
});

test('upgrades enforce cost, max level, and financial lock', () => {
  const s = fresh(); s.upgrades.payout = 1; const price = upgradeCost(s, 'hold');
  assert.equal(buyUpgrade(s, 'hold'), true); assert.equal(s.cash, 45000 - price);
  assert.equal(buyUpgrade(s, 'hold'), false);
  s.bill = 4000; assert.equal(buyUpgrade(s, 'payout'), false);
  s.bill = 0; s.cash = 0; assert.equal(buyUpgrade(s, 'turbo'), false);
});
test('Sultan unlock requires both milestone and money and can only be purchased once', () => {
  const s = fresh(); assert.equal(unlockSultan(s), false);
  s.upgrades.hold = 1; s.spins = 30; s.cash = 17999; assert.equal(unlockSultan(s), false);
  s.cash = 18000; assert.equal(unlockSultan(s), true); assert.equal(s.cash, 0); assert.equal(unlockSultan(s), false);
});
test('prestige retains earned insight, resets liabilities and unlocks, and cannot farm instant resets', () => {
  const s = fresh(2, 3); s.spins = 85; s.sultanUnlocked = true; s.upgrades.hold = 1;
  assert.equal(insightEarned(s), 3);
  const n = prestige(s); assert.equal(n.insight, 5); assert.equal(n.cash, 25000); assert.equal(n.debt, 75000);
  assert.equal(n.runs, 4); assert.equal(n.upgrades.hold, 0); assert.equal(n.sultanUnlocked, false);
  assert.equal(prestige(n).insight, 5);
});
test('save roundtrip retains outcomes; malformed or obsolete saves are rejected', () => {
  const s = fresh(); spin(s, null, () => .9);
  assert.deepEqual(parseSave(JSON.stringify(s)), s);
  assert.equal(parseSave('{broken'), null); assert.equal(parseSave(JSON.stringify({ ...s, version: 99 })), null);
  assert.equal(parseSave(JSON.stringify({ ...s, cash: -1 })), null);
  assert.equal(parseSave(JSON.stringify({ ...s, grid: [[99]] })), null);
  assert.equal(parseSave(JSON.stringify({ ...s, upgrades: {} })), null);
  assert.equal(parseSave(JSON.stringify({ ...s, logs: [{ text: 1 }] })), null);
});

test('rider reserves time upfront, persists checkpoints, and pays only once',()=>{
 const s=newRun();assert.equal(startJob(s,()=>.5),true);assert.equal(s.minutes,120);assert.equal(startJob(s),false);assert.equal(spin(s),null);
 for(let i=0;i<ROAD_LENGTH;i++){const row=s.job!.rows[i];moveLane(s,row.order??[0,1,2].find(l=>!row.obstacles.includes(l))!);if(i===3)assert.deepEqual(parseSave(JSON.stringify(s)),s);jobStep(s);}
 assert.ok(s.cash>=3500);assert.equal(s.minutes,120);assert.equal(s.deliveries,1);assert.equal(s.turns,4);
 const cash=s.cash;assert.equal(jobStep(s),false);assert.equal(s.cash,cash);
});

test('pressure raises monetary costs, independent of daily time',()=>{
 const s=fresh();advanceTime(s,40);assert.equal(tier(s),1);assert.equal(cost(s),1150);assert.equal(baseCost(s),1000);assert.equal(s.bill,0);
 assert.equal(s.minutes,0);assert.equal(minimumCost(s),1150);
});

test('loan contract fixes interest and a final calendar day; only one active loan',()=>{
 const s=newRun(),q=quoteLoan(s,10000);assert.equal(q.total,12000);assert.equal(q.due,4);
 assert.equal(borrow(s,10000),true);assert.equal(borrow(s,30000),false);assert.equal(borrow(newRun(),10001),false);
 s.cash=50000;endDay(s);endDay(s);endDay(s);assert.equal(s.day,4);assert.equal(loanDue(s),true);assert.equal(spin(s),null);assert.equal(s.loan!.interest,2000);
});

test('partial repayment preserves deadline; end day settles remaining loan exactly once',()=>{
 const s=fresh();borrow(s,10000);repayLoan(s,5000);assert.equal(s.loan!.balance,7000);assert.equal(s.loan!.due,4);
 s.day=4;const cash=s.cash;endDay(s);assert.equal(s.loan,null);assert.equal(s.cash,cash-7000);assert.equal(s.day,5);
 endDay(s);assert.equal(s.cash,cash-7000);assert.equal(repayLoan(s,1),false);
});

test('early payoff includes contracted interest; no future fee after payoff', () => {
  const s = fresh(); borrow(s, 30000); const before = s.cash;
  assert.equal(s.loan!.balance, 39000); assert.equal(repayLoan(s, 39000), true);
  assert.equal(s.cash, before - 39000); advanceTime(s, 70); assert.equal(s.loan, null); assert.equal(s.ended, false);
});
test('exhausted due day cannot farm Ojol; unpaid loan ends permanently at bedtime',()=>{
 const s=newRun();borrow(s,10000);s.cash=0;s.day=4;s.minutes=600;
 assert.equal(canWork(s),false);assert.equal(startJob(s),false);assert.equal(spin(s),null);
 assert.equal(endDay(s),true);assert.equal(s.ended,true);assert.match(s.ending,/Motor ditarik/);assert.equal(s.day,4);
 assert.equal(startJob(s),false);assert.equal(borrow(s,10000),false);assert.equal(endDay(s),false);
 assert.equal(parseSave(JSON.stringify(s))!.ended,true);
});

test('cascade only pays triples, refills cleared rows, and caps at 1x/2x/4x', () => {
  const g: Grid = [[0,1,2],[0,1,3],[0,4,2]];
  const steps = cascade(g, 1000, 1, () => .99);
  assert.equal(steps[0].wins.length, 1); assert.equal(steps[0].wins[0].amount, 4500);
  assert.deepEqual(steps.map(s => s.factor), [1,2,4]);
  assert.deepEqual(steps[1].grid.map(c => c[0]), [5,5,5]);
  assert.deepEqual(steps[1].grid.map(c => c[1]), [1,1,4]);
  assert.equal(steps[1].wins[0].amount, 180000); assert.equal(steps[2].wins[0].amount, 360000);
  assert.equal(evaluate(g,1000,[1,2],1,true).length, 0);
});
test('cascade spin settles once, preserves final grid, forbids hold and requires its unlock', () => {
  const s = fresh(); s.upgrades.payout = 2; s.sultanUnlocked = true; s.spins = 60; assert.equal(unlockMachine(s,2), true); s.machine = 2;
  s.upgrades.hold = 1; s.canHold = true; assert.equal(spin(s,0), null);
  const before = s.cash, r = spin(s,null,()=>0)!;
  assert.equal(r.cascades.length, 3); assert.equal(r.paid,3000);
  assert.equal(r.payout, 122850); assert.equal(s.cash,before-3000+122850);
  assert.deepEqual(s.grid,r.cascades[2].grid); assert.equal(s.canHold,false);
});
test('pity survives saving and does not introduce a separate cash bonus',()=>{
 const s=fresh();s.pityLosses=9;const restored=parseSave(JSON.stringify(s))!;assert.equal(restored.pityLosses,9);
 const r=spin(restored,null,()=>0)!;assert.equal(r.bonus,0);assert.equal(restored.cash,s.cash-r.paid+r.payout);
});

test('legacy saves migrate to calendar without erasing money, upgrades or loan balance',()=>{
 const s=fresh();s.spins=45;s.upgrades.hold=1;
 const migrated=parseSave(JSON.stringify({...s,version:1}))!;assert.equal(migrated.version,5);assert.equal(migrated.cash,45000);assert.equal(migrated.turns,45);assert.equal(migrated.upgrades.hold,1);
 const legacy={...s,version:3,turns:46,loan:{principal:10000,interest:2000,balance:14520,due:20,nextLate:50,lateCount:2,fees:2520}};
 const m=parseSave(JSON.stringify(legacy))!;assert.equal(m.loan!.balance,14520);assert.equal(m.loan!.due,1);assert.equal(m.day,1);
 assert.equal(parseSave(JSON.stringify({...s,minutes:9999})),null);
});

test('loan interest and spin fees use exact integer percentages at every pressure level', () => {
  const s = fresh();
  for (let t = 0; t <= 10; t++) {
    s.turns = t * 40;
    assert.equal(quoteLoan(s,10000).interest,2000+t*500);
    assert.equal(cost(s),1000+t*150);
  }
});

test('family debt is tracked separately from near-term bills and included in total obligations', () => {
  const s = newRun(); assert.equal(s.familyDebt,75000000); assert.equal(totalDebt(s),75075000);
  s.cash=20000;borrow(s,10000);assert.equal(totalDebt(s),75087000);
});
function finalCandidate() { const s=fresh();s.spins=100;s.totalWon=150000;s.cascadeUnlocked=true;return s; }
test('finale requires milestones, unlocked machine, fee and no active obligation or job', () => {
  const s=finalCandidate(); assert.equal(finaleReady(s),true);
  s.spins=99;assert.equal(beginFinale(s),false);s.spins=100;
  s.totalWon=149999;assert.equal(beginFinale(s),false);s.totalWon=150000;
  s.bill=4000;assert.equal(beginFinale(s),false);s.bill=0;
  s.cash=9999;assert.equal(beginFinale(s),false);s.cash=45000;
  startJob(s);assert.equal(beginFinale(s),false);
});
test('exactly one of 100 equally spaced finale draws produces the good ending', () => {
  let good=0;
  for(let i=0;i<100;i++){
    const s=finalCandidate();assert.equal(beginFinale(s,()=>i/100),true);
    revealFinale(s);revealFinale(s);revealFinale(s);
    if(s.familyDebt===0)good++;
    assert.equal(s.ended,true);
  }
  assert.equal(good,1);
});
test('finale commits once before reveal, survives reload and blocks competing actions', () => {
  const s=finalCandidate();const before=s.cash;assert.equal(beginFinale(s,()=>.50),true);
  assert.equal(s.cash,before-10000);assert.equal(beginFinale(s,()=>0),false);
  assert.equal(spin(s),null);assert.equal(startJob(s),false);assert.equal(borrow(s,10000),false);
  revealFinale(s);const restored=parseSave(JSON.stringify(s))!;
  assert.equal(restored.story.finale!.roll,50);assert.equal(restored.story.finale!.revealed,1);
  revealFinale(restored);revealFinale(restored);assert.equal(restored.cash,0);
  assert.equal(restored.familyDebt,75000000);assert.equal(revealFinale(restored),false);
});
test('good finale pays obligations from its prize exactly once; rebirth restores the premise', () => {
  const s=finalCandidate();borrow(s,10000);const obligations=totalDebt(s), cash=s.cash;
  beginFinale(s,()=>0);revealFinale(s);revealFinale(s);revealFinale(s);
  assert.equal(totalDebt(s),0);assert.equal(s.cash,cash-10000+100000000-obligations);
  const n=prestige(s);assert.equal(n.familyDebt,75000000);assert.equal(n.story.finale,null);
  assert.equal(n.story.intro,4);assert.equal(n.story.view,'room');
});
test('v2 migration preserves economy while introducing prologue; invalid story saves fail safely', () => {
  const s=fresh();s.deliveries=1;s.upgrades.auto=1;
  const migrated=parseSave(JSON.stringify({...s,version:2}))!;
  assert.equal(migrated.story.intro,0);assert.equal(migrated.story.guide,1);assert.equal(migrated.cash,s.cash);
  assert.equal(parseSave(JSON.stringify({...s,story:{...s.story,intro:999}})),null);
  assert.equal(parseSave(JSON.stringify({...s,story:{...s.story,finale:{roll:101,revealed:0}}})),null);
});

test('time budgets block actions; sleep restores time; upgrades have exact bounded effects',()=>{
 const s=fresh();s.minutes=590;assert.equal(spin(s),null);assert.equal(startJob(s),false);assert.equal(s.minutes,590);
 s.upgrades.stamina=1;assert.equal(buyUpgrade(s,'efficient'),true);assert.equal(spinMinutes(s),15);assert.equal(jobMinutes(s),90);
 s.upgrades.stamina=0;s.cash=100000;assert.equal(buyUpgrade(s,'stamina'),true);assert.equal(dayCapacity(s),660);
 assert.ok(spin(s,null,()=>0));assert.equal(s.minutes,605);endDay(s);assert.equal(s.minutes,0);assert.equal(remainingTime(s),660);
});
test('random roads always leave a safe lane and never put a bonus inside an obstacle',()=>{
 let seed=18;const rng=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
 const layouts=new Set<string>();for(let i=0;i<1000;i++){const rows=makeRoad(rng);layouts.add(JSON.stringify(rows));assert.equal(rows.length,12);for(const r of rows){assert.ok(r.obstacles.length<=2);assert.ok(r.order===null||!r.obstacles.includes(r.order));}}
 assert.ok(layouts.size>900);
});
test('collisions reduce income, orders increase it and payout has a floor',()=>{
 const s=newRun();startJob(s,()=>.5);const j=s.job!;moveLane(s,1);jobStep(s);assert.equal(j.orders,1);jobStep(s);assert.equal(j.hits,1);
 assert.equal(jobReward({...j,orders:0,hits:12}),1000);assert.equal(moveLane(s,-1),false);assert.equal(moveLane(s,3),false);
});
test('opening a delivery cannot skip payment day or restore time on refresh',()=>{
 const s=newRun();borrow(s,10000);s.day=4;s.minutes=480;startJob(s);assert.equal(s.minutes,600);assert.equal(endDay(s),false);
 const restored=parseSave(JSON.stringify(s))!;assert.equal(restored.minutes,600);assert.deepEqual(restored.job!.rows,s.job!.rows);assert.equal(startJob(restored),false);
});


test('branches enforce dependencies and preserve money on a locked purchase',()=>{
 const s=fresh();s.cash=1000000;const before=s.cash;
 for(const id of ['efficient','luck','hold','auto','orders','safety'] as const)assert.equal(buyUpgrade(s,id),false);
 assert.equal(s.cash,before);assert.equal(buyUpgrade(s,'stamina'),true);assert.equal(buyUpgrade(s,'efficient'),true);assert.equal(buyUpgrade(s,'luck'),true);
 assert.equal(buyUpgrade(s,'payout'),true);assert.equal(buyUpgrade(s,'hold'),true);assert.equal(buyUpgrade(s,'auto'),false);
 assert.equal(buyUpgrade(s,'turbo'),true);assert.equal(buyUpgrade(s,'auto'),true);
 assert.equal(buyUpgrade(s,'fare'),true);assert.equal(buyUpgrade(s,'orders'),true);assert.equal(buyUpgrade(s,'safety'),true);
});
test('machine nodes need branch prerequisites in addition to milestones',()=>{
 const s=fresh();s.cash=1000000;s.spins=100;
 assert.equal(unlockMachine(s,1),false);assert.equal(unlockMachine(s,2),false);
 s.upgrades.hold=1;assert.equal(unlockMachine(s,1),true);assert.equal(unlockMachine(s,2),false);
 s.upgrades.payout=2;assert.equal(unlockMachine(s,2),true);assert.equal(unlockMachine(s,2),false);
});
test('Ojol specialisation increases fare, bonus frequency and reduces collision cost',()=>{
 const s=fresh();s.upgrades.fare=3;s.upgrades.orders=3;s.upgrades.safety=2;
 assert.equal(jobQuote(s).fare,7250);startJob(s,()=>.5);assert.equal(s.job!.damage,300);
 assert.equal(jobReward({...s.job!,hits:1,orders:0}),5450);
 const regular=makeRoad(()=>.5),busier=makeRoad(()=>.5,.24);
 assert.equal(regular.slice(2).filter(r=>r.order!==null).length,0);
 assert.equal(busier.slice(2).filter(r=>r.order!==null).length,10);
 assert.deepEqual(parseSave(JSON.stringify(s)),s);
});
test('luck only modestly assists common symbols and cannot change the finale draw',()=>{
 const lose=()=>{let i=0;return ()=>i<9?[0,.4,.7][Math.floor(i++/3)]:.05;};
 const plain=fresh(),lucky=fresh();lucky.upgrades.luck=3;
 assert.equal(spin(plain,null,lose())!.payout,0);assert.equal(spin(lucky,null,lose())!.payout,500);
 const final=finalCandidate();final.upgrades.luck=3;beginFinale(final,()=>.01);assert.equal(final.story.finale!.roll,1);
});
test('v4 saves preserve owned upgrades and current road while adding new branch ranks',()=>{
 const s=fresh();s.upgrades.hold=1;s.cascadeUnlocked=true;startJob(s,()=>.5);
 const old=JSON.parse(JSON.stringify(s));old.version=4;
 for(const key of ['luck','fare','orders','safety'])delete old.upgrades[key];delete old.job.damage;
 const restored=parseSave(JSON.stringify(old))!;assert.equal(restored.version,5);assert.equal(restored.upgrades.hold,1);
 assert.equal(restored.cascadeUnlocked,true);assert.equal(restored.job!.damage,600);assert.equal(restored.upgrades.fare,0);
 assert.deepEqual(restored.job!.rows,s.job!.rows);assert.equal(restored.cash,s.cash);
});
