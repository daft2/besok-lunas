export type SymbolId = 0 | 1 | 2 | 3 | 4 | 5;
export type Grid = SymbolId[][];
export const SYMBOLS = [
  { name: 'Kopi', weight: 30, pair: .5, triple: 3 },
  { name: 'Sandal', weight: 24, pair: .75, triple: 5 },
  { name: 'Helm', weight: 18, pair: 1, triple: 8 },
  { name: 'Ayam', weight: 14, pair: 1.5, triple: 12 },
  { name: 'Rupiah', weight: 9, pair: 2.5, triple: 24 },
  { name: 'Sultan', weight: 5, pair: 5, triple: 60 },
] as const;
export type Upgrade = 'payout' | 'hold' | 'turbo' | 'auto' | 'stamina' | 'efficient' | 'luck' | 'fare' | 'orders' | 'safety';
export const UPGRADES: Record<Upgrade, { name: string; desc: string; base: number; max: number; icon: string }> = {
  luck: { name: 'Hoki Kecil', desc: 'Sedikit peluang bantuan pasangan kopi (+2% per rank). Tidak mengubah peluang akhir cerita.', base: 18000, max: 3, icon: '♣' },
  fare: { name: 'Pelanggan Tetap', desc: '+15% tarif dasar Ojol per rank.', base: 6500, max: 3, icon: 'Rp' },
  orders: { name: 'Jam Ramai', desc: '+8% peluang order bonus muncul per rank.', base: 10000, max: 3, icon: '+' },
  safety: { name: 'Motor Terawat', desc: 'Potongan benturan berkurang Rp150 per rank.', base: 14000, max: 2, icon: '⚒' },
  stamina: { name: 'Ritme Sehat', desc: '+1 jam waktu aktif setiap hari. Maksimal +2 jam.', base: 10000, max: 2, icon: '☀' },
  efficient: { name: 'Rute & Fokus', desc: 'Order −30 menit; spin −5 menit per level.', base: 14000, max: 2, icon: '◷' },
  payout: { name: 'Pengali Cuan', desc: '+15% hadiah slot per rank. Bukan peluang menang.', base: 8000, max: 5, icon: '×' },
  hold: { name: 'Tahan Dulu', desc: 'Tahan 1 reel, respin berbayar sekali. Bukan di Rantai.', base: 12000, max: 1, icon: 'Ⅱ' },
  turbo: { name: 'Mesin Ngebut', desc: 'Animasi reel 25% lebih cepat per level.', base: 6000, max: 2, icon: 'ϟ' },
  auto: { name: 'Jempol Otomatis', desc: 'Auto-spin berhenti saat tagihan atau saldo tipis.', base: 16000, max: 1, icon: '↻' },
};
export interface Entry { text: string; kind: 'win' | 'loss' | 'info'; }
export interface Loan { principal: number; interest: number; balance: number; due: number; nextLate: number; lateCount: number; fees: number; }
export interface RoadRow { obstacles: number[]; order: number | null; }
export interface Job { step: number; net: number; fare: number; fuel: number; lane: number; hits: number; orders: number; damage: number; rows: RoadRow[]; }
export interface StoryState { intro: number; guide: number; view: 'room' | 'game' | 'phone'; read: string[]; finale: { roll: number; revealed: number } | null; }
export interface State {
  version: 5; day: number; minutes: number; pityLosses: number; familyDebt: number; story: StoryState; cash: number; debt: number; spins: number; totalWon: number; bestWin: number;
  insight: number; runs: number; bet: number; machine: 0 | 1 | 2; sultanUnlocked: boolean; cascadeUnlocked: boolean;
  upgrades: Record<Upgrade, number>; grid: Grid; charge: number; chargePool: number;
  canHold: boolean; ended: boolean; bill: number; logs: Entry[]; muted: boolean;
  turns: number; deliveries: number; workEarned: number; job: Job | null; loan: Loan | null; ending: string;
}
export const fresh = (insight = 0, runs = 1): State => ({
  version: 5, day: 1, minutes: 0, pityLosses: 0, familyDebt: 75000000, story: { intro: 0, guide: 0, view: 'room', read: [], finale: null }, cash: insight * 5000, debt: 75000, spins: 0, totalWon: 0, bestWin: 0,
  insight, runs, bet: 1000, machine: 0, sultanUnlocked: false, cascadeUnlocked: false,
  upgrades: { payout: 0, hold: 0, turbo: 0, auto: 0, stamina: 0, efficient: 0, luck: 0, fare: 0, orders: 0, safety: 0 }, grid: [[1, 0, 3], [2, 5, 0], [4, 1, 2]],
  charge: 0, chargePool: 0, canHold: false, ended: false, bill: 0, muted: false,
  turns: 0, deliveries: 0, workEarned: 0, job: null, loan: null, ending: '',
  logs: [{ text: 'Saldo kosong. Narik ojol dulu buat modal. Utang kos Rp75.000.', kind: 'info' }],
});
export const tier = (s: State) => Math.min(10, Math.floor(s.turns / 40));
export const feeRate = (s: State) => tier(s) * .15;
export const baseCost = (s: State) => s.bet * (s.machine ? 3 : 1);
export const cost = (s: State) => Math.ceil(baseCost(s) * (100 + tier(s) * 15) / 100);
export const minimumCost = (s: State) => 1000 + tier(s) * 150;
export const multiplier = (s: State) => 1 + s.upgrades.payout * .15 + Math.min(s.insight, 25) * .02;
export const totalDebt = (s: State) => s.familyDebt + s.debt + (s.loan?.balance ?? 0);
export const dayCapacity = (s: State) => 600 + s.upgrades.stamina * 60;
export const remainingTime = (s: State) => Math.max(0, dayCapacity(s) - s.minutes);
export const spinMinutes = (s: State) => 20 - s.upgrades.efficient * 5;
export const jobMinutes = (s: State) => 120 - s.upgrades.efficient * 30;
export const clockTime = (s: State) => `${String(8 + Math.floor(s.minutes / 60)).padStart(2,'0')}:${String(s.minutes % 60).padStart(2,'0')}`;
export const loanDue = (s: State) => !!s.loan && s.day >= s.loan.due;
export const dailyObligations = (s: State) => s.bill + (loanDue(s) ? s.loan!.balance : 0);
export const canWork = (s: State) => !s.ended && !s.story.finale && !s.job && remainingTime(s) >= jobMinutes(s);
export function endDay(s: State): boolean {
  if (s.ended || s.job || s.story.finale) return false;
  const due = dailyObligations(s);
  if (s.cash < due) {
    endRun(s, loanDue(s) ? `Hari ${s.day} berakhir. Pinjol jatuh tempo tidak terbayar. Motor ditarik; tidak ada order berikutnya.` : `Hari ${s.day} berakhir. Cicilan kos tidak terbayar. Bima kehilangan tempat untuk pulang.`);
    return true;
  }
  if (loanDue(s)) { s.cash -= s.loan!.balance; log(s, 'Pinjol dilunasi saat tutup hari.'); s.loan = null; }
  if (s.bill) payBill(s);
  s.day++; s.minutes = 0; s.canHold = false;
  if (s.day % 3 === 0 && s.debt > 0) s.bill = Math.min(s.debt, 4000 + (Math.floor(s.day / 3) - 1) * 3000);
  log(s, `Hari ${s.day}. Waktu kembali tersedia. ${s.bill ? 'Cicilan kos harus dibayar sebelum tidur.' : 'Pilih bagaimana memakai harimu.'}`);
  return true;
}
export const blocked = (s: State) => s.ended || !!s.bill || loanDue(s) || !!s.job || !!s.story.finale;
export const nextBill = (s: State) => Math.min(s.debt, 4000 + Math.floor(s.day / 3) * 3000);
export const upgradeCost = (s: State, id: Upgrade) => Math.round(UPGRADES[id].base * 1.8 ** s.upgrades[id]);
export const UPGRADE_PARENTS: Partial<Record<Upgrade, Upgrade[]>> = { efficient: ['stamina'], luck: ['efficient'], hold: ['payout'], turbo: ['payout'], auto: ['hold', 'turbo'], orders: ['fare'], safety: ['orders'] };
export const upgradePrerequisites = (s: State, id: Upgrade) => (UPGRADE_PARENTS[id] ?? []).every(parent => s.upgrades[parent] > 0);
export const upgradeRequirement = (id: Upgrade) => (UPGRADE_PARENTS[id] ?? []).map(parent => UPGRADES[parent].name + ' I').join(' + ');
export const machinePrice = (id: 1 | 2) => id === 1 ? 18000 : 24000;
export function machineRequirement(s: State, id: 1 | 2): string {
  const requirements: string[] = [];
  if (s.spins < (id === 1 ? 30 : 60)) requirements.push(`${id === 1 ? 30 : 60} spin`);
  if (id === 1 && !s.upgrades.hold) requirements.push('Tahan Dulu I');
  if (id === 2 && !s.sultanUnlocked) requirements.push('Sultan Malam');
  if (id === 2 && s.upgrades.payout < 2) requirements.push('Pengali Cuan II');
  return requirements.join(' + ');
}
export const insightEarned = (s: State) => Math.floor(s.spins / 40) + (s.sultanUnlocked ? 1 : 0) + (s.cascadeUnlocked ? 1 : 0);
export function log(s: State, text: string, kind: Entry['kind'] = 'info') { s.logs.unshift({ text, kind }); s.logs = s.logs.slice(0, 16); }
export function randomSymbol(rng = Math.random): SymbolId {
  let n = rng() * 100;
  for (let i = 0; i < SYMBOLS.length; i++) { n -= SYMBOLS[i].weight; if (n < 0) return i as SymbolId; } return 5;
}
export interface LineWin { row: number; symbol: SymbolId; count: number; amount: number; columns: number[]; }
export function evaluate(grid: Grid, bet: number, rows: number[], mult = 1, triplesOnly = false): LineWin[] {
  const wins: LineWin[] = [];
  for (const row of rows) for (let i = 0; i < SYMBOLS.length; i++) {
    const columns = grid.flatMap((col, x) => col[row] === i ? [x] : []);
    if (columns.length < (triplesOnly ? 3 : 2)) continue;
    wins.push({ row, symbol: i as SymbolId, count: columns.length, columns,
      amount: Math.round(bet * (columns.length === 3 ? SYMBOLS[i].triple : SYMBOLS[i].pair) * mult) });
  } return wins;
}
export interface Cascade { grid: Grid; wins: LineWin[]; factor: number; }
export function cascade(grid: Grid, bet: number, mult: number, rng = Math.random): Cascade[] {
  const steps: Cascade[] = []; let current = grid.map(c => [...c]);
  for (const factor of [1, 2, 4]) {
    const wins = evaluate(current, bet, [0, 1, 2], mult * 1.5 * factor, true);
    steps.push({ grid: current.map(c => [...c]), wins, factor });
    if (!wins.length || factor === 4) break;
    const cleared = new Set(wins.map(w => w.row));
    current = current.map(col => [...Array.from({ length: cleared.size }, () => randomSymbol(rng)), ...col.filter((_, y) => !cleared.has(y))]);
  } return steps;
}
export function advanceTime(s: State, n: number) {
  if (!s.ended) s.turns += n;
}
export interface SpinResult { grid: Grid; wins: LineWin[]; payout: number; bonus: number; paid: number; billDue: number; held: number | null; cascades: Cascade[]; }
export function spin(s: State, held: number | null = null, rng = Math.random): SpinResult | null {
  if (blocked(s) || remainingTime(s) < spinMinutes(s) || s.cash < cost(s)) return null;
  if (held !== null && (s.machine === 2 || !Number.isInteger(held) || held < 0 || held > 2 || !s.canHold || !s.upgrades.hold)) return null;
  const paid = cost(s); s.cash -= paid; s.minutes += spinMinutes(s);
  const initial = Array.from({ length: 3 }, (_, x) => x === held ? [...s.grid[x]] : Array.from({ length: 3 }, () => randomSymbol(rng))) as Grid;
  // Soft pity only assists an otherwise empty initial grid. It never creates rare symbols.
  const eligibleRows = s.machine ? [0,1,2] : [1];
  if (!evaluate(initial, s.bet, eligibleRows, 1, s.machine === 2).length && (s.pityLosses >= 3 || s.upgrades.luck > 0) && rng() < Math.min(.30, Math.min(.24, Math.max(0, s.pityLosses - 2) * .04) + s.upgrades.luck * .02)) {
    initial[0][1] = 0; initial[1][1] = 0;
    initial[2][1] = s.machine === 2 ? 0 : 1;
  }
  const cascades = s.machine === 2 ? cascade(initial, s.bet, multiplier(s), rng) : [];
  const wins = s.machine === 2 ? cascades.flatMap(c => c.wins) : evaluate(initial, s.bet, s.machine === 1 ? [0, 1, 2] : [1], multiplier(s));
  const payout = wins.reduce((sum, w) => sum + w.amount, 0);
  const bonus = 0; s.pityLosses = payout ? 0 : Math.min(50, s.pityLosses + 1);
  const grid = cascades.length ? cascades[cascades.length - 1].grid : initial;
  s.cash += payout + bonus; s.totalWon += payout + bonus; s.bestWin = Math.max(s.bestWin, payout + bonus);
  s.grid = grid; s.spins++; s.canHold = held === null && s.machine !== 2; advanceTime(s, 1);
  if (payout || bonus) log(s, `${cascades.length > 1 ? `Rantai ${cascades.length} tahap!` : wins.some(w => w.count === 3) ? 'Tiga serangkai!' : 'Dua cocok'} +Rp${(payout + bonus).toLocaleString('id-ID')}`, 'win');
  return { grid, wins, payout, bonus, paid, billDue: s.bill, held, cascades };
}
export function buyUpgrade(s: State, id: Upgrade): boolean {
  if (!UPGRADES[id] || !upgradePrerequisites(s, id) || blocked(s) || s.upgrades[id] >= UPGRADES[id].max || s.cash < upgradeCost(s, id)) return false;
  s.cash -= upgradeCost(s, id); s.upgrades[id]++; log(s, `${UPGRADES[id].name} dipasang.`); return true;
}
export function unlockSultan(s: State): boolean { return unlockMachine(s, 1); }
export function unlockMachine(s: State, id: 1 | 2): boolean {
  const key = id === 1 ? 'sultanUnlocked' : 'cascadeUnlocked', price = machinePrice(id);
  if (blocked(s) || s[key] || machineRequirement(s, id) || s.cash < price) return false;
  s.cash -= price; s[key] = true; log(s, id === 1 ? 'Sultan Malam terbuka. Tiga jalur.' : 'Rantai Rejeki terbuka. Tripel runtuh, pengali tumbuh.'); return true;
}
export function payBill(s: State): boolean {
  if (!s.bill || s.cash < s.bill || s.ended || s.story.finale || s.job) return false;
  s.cash -= s.bill; s.debt -= s.bill; log(s, `Cicilan kos Rp${s.bill.toLocaleString('id-ID')} dibayar.`, 'loss'); s.bill = 0; return true;
}
export const LOAN_AMOUNTS = [10000, 30000, 75000] as const;
export function quoteLoan(s: State, principal: number) {
  const percent = [20, 30, 45][LOAN_AMOUNTS.indexOf(principal as typeof LOAN_AMOUNTS[number])] + tier(s) * 5;
  const rate = percent / 100, interest = Math.ceil(principal * percent / 100); return { principal, rate, interest, total: principal + interest, due: s.day + 3 };
}
export function borrow(s: State, principal: number): boolean {
  if (s.ended || s.story.finale || s.job || s.loan || !LOAN_AMOUNTS.includes(principal as typeof LOAN_AMOUNTS[number])) return false;
  const q = quoteLoan(s, principal);
  s.loan = { principal, interest: q.interest, balance: q.total, due: q.due, nextLate: q.due, lateCount: 0, fees: 0 };
  s.cash += principal; log(s, `Pinjol cair Rp${principal.toLocaleString('id-ID')}. Wajib bayar Rp${q.total.toLocaleString('id-ID')}.`, 'loss'); return true;
}
export function repayLoan(s: State, amount: number): boolean {
  if (!s.loan || s.job || s.ended || s.story.finale || !Number.isSafeInteger(amount) || amount <= 0 || amount > s.cash || amount > s.loan.balance) return false;
  s.cash -= amount; s.loan.balance -= amount; log(s, `Bayar Pinjol Rp${amount.toLocaleString('id-ID')}.`);
  if (!s.loan.balance) { s.loan = null; log(s, 'Pinjol lunas. Jangan klik tawarannya lagi.'); } return true;
}
export function jobQuote(s: State) {
  const fare = 5000 + s.upgrades.fare * 750, fuel = Math.min(3000, 1500 + tier(s) * 150); return { fare, fuel, net: fare - fuel };
}
export const ROAD_LENGTH = 12;
export function makeRoad(rng = Math.random, orderBonus = 0): RoadRow[] {
  return Array.from({length: ROAD_LENGTH}, (_,i) => {
    if (i === 0) return {obstacles: [], order: 1};
    if (i === 1) return {obstacles: [1], order: 0};
    const safe = Math.min(2, Math.floor(rng()*3));
    const other = [0,1,2].filter(l => l !== safe);
    const roll = rng();
    const obstacles = roll < .18 ? [] : roll < .78 ? [other[Math.min(1,Math.floor(rng()*2))]] : other;
    const free = [0,1,2].filter(l => !obstacles.includes(l));
    return {obstacles, order: rng() < Math.min(.66, .42 + orderBonus) ? free[Math.min(free.length-1,Math.floor(rng()*free.length))] : null};
  });
}
export function startJob(s: State, rng = Math.random): boolean {
  if (!canWork(s)) return false;
  s.minutes += jobMinutes(s); s.canHold = false;
  s.job = { step: 0, ...jobQuote(s), lane: 1, hits: 0, orders: 0, damage: 600 - s.upgrades.safety * 150, rows: makeRoad(rng, s.upgrades.orders * .08) }; return true;
}
export function moveLane(s: State, lane: number): boolean {
  if (!s.job || s.ended || !Number.isInteger(lane) || lane < 0 || lane > 2) return false;
  s.job.lane = lane; return true;
}
export const jobReward = (j: Job) => Math.max(1000, j.net + j.orders * 750 - j.hits * j.damage);
export function jobStep(s: State): boolean {
  if (s.ended || !s.job) return false;
  const j = s.job, row = j.rows[j.step];
  if (row.obstacles.includes(j.lane)) j.hits++;
  if (row.order === j.lane) j.orders++;
  j.step++;
  if (j.step === ROAD_LENGTH) {
    const net = jobReward(j); s.cash += net; s.workEarned += net; s.deliveries++; s.job = null;
    log(s, `Order selesai. ${j.orders} bonus, ${j.hits} benturan. Bersih +Rp${net.toLocaleString('id-ID')}.`, 'win'); advanceTime(s, 4);
  } return true;
}
export function endRun(s: State, reason = 'Kamu menyerah pada tagihan yang menumpuk.'): void { s.ended = true; s.ending = reason; s.canHold = false; s.job = null; log(s, reason, 'loss'); }
export function prestige(s: State): State {
  const n = fresh(s.insight + insightEarned(s), s.runs + 1); n.muted = s.muted; n.story.intro = 4; n.story.guide = 3;
  n.logs = [{ text: `Nasib ke-${n.runs}. Ingatan lama, utang yang sama.`, kind: 'info' }]; return n;
}
export const SAVE_KEY = 'besok-lunas-v1'; // Stable key so v1 saves can migrate in place.
export function parseSave(raw: string | null): State | null {
  if (!raw) return null;
  try {
    const input = JSON.parse(raw);
    if (![1, 2, 3, 4, 5].includes(input.version)) return null;
    if (input.version === 1) Object.assign(input, { version: 2, turns: input.spins, deliveries: 0, workEarned: 0, job: null, loan: null, ending: '', cascadeUnlocked: false, chargePool: input.charge * input.bet });
    if (input.version === 2) Object.assign(input, { version: 3, day: 1, minutes: 0, pityLosses: 0, familyDebt: 75000000, story: { intro: 0, guide: input.deliveries > 0 ? 1 : 0, view: 'room', read: [], finale: null } });
    if (input.version === 3) {
      input.version = 4; input.day = 1; input.minutes = 0; input.pityLosses = 0;
      input.upgrades = {...input.upgrades, stamina: 0, efficient: 0};
      if (input.loan) { input.loan.due = Math.max(1, 1 + Math.ceil((input.loan.due - input.turns) / 10)); input.loan.nextLate = input.loan.due; }
      if (input.job) { input.job = {...input.job, step: 0, lane: 1, hits: 0, orders: 0, rows: makeRoad(() => .5)}; input.minutes = 120; }
    }
    if (input.version === 4) {
      input.version = 5;
      input.upgrades = { ...input.upgrades, luck: 0, fare: 0, orders: 0, safety: 0 };
      if (input.job) input.job.damage = 600;
    }
    const s = input as State;
    for (const key of ['day', 'minutes', 'pityLosses', 'familyDebt', 'cash', 'debt', 'spins', 'totalWon', 'bestWin', 'insight', 'runs', 'charge', 'chargePool', 'bill', 'turns', 'deliveries', 'workEarned'] as const)
      if (!Number.isSafeInteger(s[key]) || s[key] < 0) return null;
    if (s.runs < 1 || s.day < 1 || s.minutes > dayCapacity(s) || s.pityLosses > 50 || s.charge > 5 || s.bill > s.debt || ![1000, 2000, 5000].includes(s.bet) || ![0, 1, 2].includes(s.machine)) return null;
    if (!s.grid || s.grid.length !== 3 || s.grid.some(c => !Array.isArray(c) || c.length !== 3 || c.some(v => !Number.isInteger(v) || v < 0 || v > 5))) return null;
    if (!s.upgrades || Object.entries(UPGRADES).some(([k, v]) => !Number.isInteger(s.upgrades[k as Upgrade]) || s.upgrades[k as Upgrade] < 0 || s.upgrades[k as Upgrade] > v.max)) return null;
    for (const key of ['ended', 'canHold', 'sultanUnlocked', 'cascadeUnlocked', 'muted'] as const) if (typeof s[key] !== 'boolean') return null;
    if (typeof s.ending !== 'string' || (s.machine === 1 && !s.sultanUnlocked) || (s.machine === 2 && !s.cascadeUnlocked)) return null;
    if (s.job !== null) {
      const j = s.job;
      if (!j || !Number.isInteger(j.step) || j.step < 0 || j.step >= ROAD_LENGTH || ![0,1,2].includes(j.lane) || ![j.fare,j.fuel,j.net,j.hits,j.orders,j.damage].every(n => Number.isSafeInteger(n) && n >= 0) || j.damage < 300 || j.damage > 600 || j.damage % 150 !== 0 || j.net !== j.fare-j.fuel || j.hits>j.step || j.orders>j.step || !Array.isArray(j.rows) || j.rows.length!==ROAD_LENGTH || j.rows.some(r => !r || !Array.isArray(r.obstacles) || r.obstacles.length>2 || new Set(r.obstacles).size!==r.obstacles.length || r.obstacles.some(l=>![0,1,2].includes(l)) || (r.order!==null && (![0,1,2].includes(r.order) || r.obstacles.includes(r.order))))) return null;
    }
    if (s.loan !== null) {
      const l = s.loan;
      if (!l || !['principal','interest','balance','due','nextLate','lateCount','fees'].every(k => Number.isSafeInteger(l[k as keyof Loan]) && l[k as keyof Loan] >= 0) || l.balance <= 0 || l.lateCount > 3 || l.nextLate < l.due) return null;
    }
    const story = s.story;
    if (!story || !Number.isInteger(story.intro) || story.intro < 0 || story.intro > 4 || !Number.isInteger(story.guide) || story.guide < 0 || story.guide > 3 || !['room','game','phone'].includes(story.view) || !Array.isArray(story.read) || story.read.some(id => typeof id !== 'string' || id.length > 40)) return null;
    if (story.finale !== null && (!story.finale || !Number.isInteger(story.finale.roll) || story.finale.roll < 0 || story.finale.roll > 99 || !Number.isInteger(story.finale.revealed) || story.finale.revealed < 0 || story.finale.revealed > 3 || (story.finale.revealed === 3) !== s.ended)) return null;
    if (!Array.isArray(s.logs) || s.logs.some(l => !l || typeof l.text !== 'string' || !['info', 'win', 'loss'].includes(l.kind))) return null;
    s.logs = s.logs.slice(0, 16).map(l => ({ ...l, text: l.text.slice(0, 200) })); return s;
  } catch { return null; }
}

export const FINALE_COST = 10000;
export function finaleReady(s: State): boolean {
  return !blocked(s) && s.spins >= 100 && s.totalWon >= 150000 && s.cascadeUnlocked && s.cash >= FINALE_COST;
}
export function beginFinale(s: State, rng = Math.random): boolean {
  if (!finaleReady(s)) return false;
  const roll = Math.max(0, Math.min(99, Math.floor(rng() * 100)));
  s.cash -= FINALE_COST; s.canHold = false; s.story.finale = { roll, revealed: 0 };
  log(s, 'Kesempatan Terakhir dibuka. Tidak ada putaran setelah ini.'); return true;
}
export function revealFinale(s: State): boolean {
  const f = s.story.finale;
  if (!f || f.revealed >= 3 || s.ended) return false;
  f.revealed++;
  if (f.revealed === 3) {
    if (f.roll === 0) {
      s.cash += Math.max(0, 100000000 - totalDebt(s)); s.debt = 0; s.bill = 0; s.familyDebt = 0; s.loan = null;
      endRun(s, 'Transfernya benar-benar masuk. Utang keluarga selesai. Untuk pertama kalinya, Bima mematikan ponsel tanpa takut besok.');
    } else {
      s.cash = 0;
      endRun(s, f.roll <= 33 ? 'Penarikan diblokir. Saldo kemenangan tetap angka di layar. Besok, tagihannya tetap nyata.' : f.roll <= 66 ? 'Dana disita dalam penutupan platform. Bima sudah menghitung rumah yang belum pernah ia miliki.' : 'Aplikasi menghilang. Riwayat kemenangan ikut hilang. Pesan dari rumah masih masuk.');
    }
  } return true;
}
