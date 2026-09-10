import '@fontsource/barlow/400.css';
import '@fontsource/barlow/600.css';
import '@fontsource/barlow/700.css';
import '@fontsource/barlow/800.css';
import '@fontsource/barlow/900.css';
import '@fontsource/barlow-condensed/800.css';
import '@fontsource/barlow-condensed/900.css';
import './style.css';
import { fresh, spin, cost, multiplier, upgradeCost, buyUpgrade, payBill, endRun, prestige, insightEarned, parseBank, wrapState, SAVE_KEY, SYMBOLS, UPGRADES, machineRequirement, type State, type SaveBank, type Upgrade, tier, feeRate, baseCost, minimumCost, totalDebt, loanDue, blocked as engineBlocked, nextBill, unlockMachine, LOAN_AMOUNTS, quoteLoan, borrow, repayLoan, jobQuote, startJob, jobStep, remainingTime, spinMinutes, jobMinutes, canWork, endDay, dailyObligations, clockTime, finaleReady, beginFinale, revealFinale, FINALE_COST } from './engine';
import { GameShell, emptyBank, menuState, applyReducedMotion } from './menu';
import { createReels, type ReelScene } from './reels';
import { GameAudio } from './audio';
import { StoryDirector } from './story';
import './story.css';
import './day.css';
import {renderTree} from './tree';
let workshopBranch='all';
import {dayBar, dayPlan} from './day';
import {RiderGame} from './rider';

const money = (n: number) => 'Rp' + n.toLocaleString('id-ID');
const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const escape = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
let bank: SaveBank;
try {
  bank = parseBank(localStorage.getItem(SAVE_KEY)) ?? emptyBank();
} catch { bank = emptyBank(); }
let state: State = menuState(bank);
let busy = false, auto = false, held: number | null = null, scene: ReelScene | undefined;
let autoTimer: ReturnType<typeof setTimeout> | undefined;
const audio = new GameAudio(); audio.muted = bank.settings.muted;
let shell: GameShell;
let storageFailed = false;
let story: StoryDirector | undefined;
let rider: RiderGame | undefined;

$('app').innerHTML = `
  <div class="room" aria-hidden="true"></div><div class="vignette" aria-hidden="true"></div>
  <div class="game-shell">
    <header class="topbar">
      <a class="wordmark" href="#" aria-label="Besok Lunas"><span>BESOK</span><strong>LUNAS<span class="wordmark-dot">!</span></strong></a>
      <div class="tagline">SEKALI LAGI,<br><b>PASTI BALIK.</b></div>
      <div class="top-actions"><button id="system-open" data-shell="system" class="room-back">Menu</button><button id="back-room" class="room-back">← Kamar</button><button id="open-phone" class="room-back">Ponsel ▣</button><button id="sound" class="icon-button" aria-label="Nyalakan suara">♪</button><button id="help" class="icon-button" aria-label="Cara bermain">?</button></div>
    </header>
    <section class="wallet-bar" aria-label="Keuangan">
      <div class="wallet-item balance"><span class="wallet-icon">Rp</span><div><small>SALDO DI TANGAN</small><strong id="cash"></strong></div></div>
      <div class="wallet-item debt"><span class="wallet-icon">↗</span><div><small>UTANG BELUM LUNAS</small><strong id="debt"></strong></div></div>
      <div class="wallet-item fate"><span class="wallet-icon">✦</span><div><small id="run-label"></small><strong id="insight"></strong></div></div>
      <div class="save-status" id="save-status"><i></i> Tersimpan lokal</div>
    </section>
    <div id="day-dashboard"></div><main class="game-layout">
      <aside class="left-panel tab-panel" data-panel="notes">
        <section class="paper receipt">
          <div class="eyebrow">BUKU UTANG</div><h2>Besok dibayar.</h2><p class="receipt-sub">Katanya sih begitu.</p>
          <div class="receipt-rule"></div>
          <div class="receipt-row"><span>Putaran</span><b id="spin-count"></b></div>
          <div class="receipt-row"><span>Cicilan kos berikutnya</span><b id="next-bill"></b></div>
          <div class="receipt-row"><span>Jatuh tempo</span><b id="deadline"></b></div>
          <div class="bill-track"><div id="bill-progress"></div></div>
          <p class="receipt-note">Waktu habis? Tutup hari untuk istirahat.<br>Cicilan kos jatuh tempo tiap hari ke-3.</p>
          <span class="stamp">BELUM LUNAS</span>
        </section>
        <section class="dark-panel paytable"><div class="section-title"><h2>Harga sebuah mimpi</h2><button id="odds" class="text-button">Detail ↗</button></div><p>3 simbol sama · pengali taruhan</p>
          <div class="symbol-table">${SYMBOLS.map((s, i) => `<div><span class="symbol-art s${i}" role="img" aria-label="${s.name}"></span><b>${s.triple}×</b></div>`).join('')}</div>
          <div class="pair-note">2 simbol sama juga bayar.</div>
        </section>
        <div class="flavor"><span>“</span>Yang kaya mesinnya.<br>Yang berharap kamunya.</div>
      </aside>
      <section class="center-panel tab-panel active" data-panel="machine">
        <div id="first-spin-tip" class="first-spin-tip" hidden><b>03 · PUTARAN PERTAMA</b><span>Tekan PUTAR yang disorot. Dua simbol sama di garis tengah membayar. Setiap spin memakai uang dan waktu; lihat jam di atas.</span></div><div class="life-actions"><button id="ojol"><span class="symbol-art s2"></span><span><b>NARIK OJOL</b><small id="ojol-label">Cari modal dulu</small></span><i>↗</i></button><button id="pinjol"><span class="finance-icon">Rp</span><span><b>PINJOL</b><small id="loan-label">Cair cepat. Bayar berat.</small></span><i>↗</i></button></div>
        <div class="pressure-strip"><strong id="pressure"></strong><span id="pressure-next"></span></div>
        <div class="machine-switch"><button id="receh-tab" class="machine-tab selected">01 <b>RECEH REJEKI</b></button><button id="sultan-tab" class="machine-tab">02 <b>SULTAN MALAM</b><span id="sultan-lock">⌑</span></button><button id="cascade-tab" class="machine-tab">03 <b>RANTAI REJEKI</b><span id="cascade-lock">⌑</span></button></div>
        <div class="cabinet" id="cabinet">
          <div class="machine-top"><span class="screw">+</span><span class="machine-edition" id="machine-edition">MESIN RAKYAT · VOL. 01</span><span class="screw">+</span></div>
          <div class="marquee"><span class="marquee-star">✦</span><div><h1 id="machine-name">RECEH REJEKI</h1><p id="machine-subtitle">MODAL RECEH, MIMPI GEDE.</p></div><span class="marquee-star">✦</span></div>
          <div class="bulbs" aria-hidden="true">${'<i></i>'.repeat(15)}</div>
          <div class="reel-bezel"><div class="payline-arrow left">▶</div><div id="reels" role="img" aria-label="Tiga reel slot. Hasil akan diumumkan di bawah."></div><div class="payline-arrow right">◀</div><div id="loading">Memasang reel…</div></div>
          <div class="hold-row">${[0, 1, 2].map(i => `<button class="hold-button" id="hold-${i}" data-hold="${i}" aria-pressed="false"><span>Ⅱ</span> TAHAN</button>`).join('')}</div>
          <div class="result-display" id="result" role="status" aria-live="polite"><strong>SATU PUTARAN LAGI?</strong><span>Cocokkan 2 atau 3 simbol di garis tengah.</span></div>
          <div class="machine-controls"><div class="stake"><small>TARUHAN / GARIS</small><div><button id="bet-down" aria-label="Turunkan taruhan">−</button><strong id="bet"></strong><button id="bet-up" aria-label="Naikkan taruhan">+</button></div></div><button id="spin" class="spin-button" disabled><span id="spin-label">PUTAR</span><small id="spin-cost"></small><b>↻</b></button></div>
          <div class="machine-bottom"><button id="auto" class="auto-button"><span class="toggle"><i></i></span> AUTO SPIN <small id="auto-label">TERKUNCI</small></button><span class="keyboard-hint">[ SPASI ] PUTAR</span><button id="turbo-indicator" class="speed-badge" aria-label="Lihat upgrade kecepatan">ϟ <span id="speed">1×</span></button></div>
        </div>
        <div class="under-machine"><span id="machine-lines">1 GARIS AKTIF</span><span>UANG FIKTIF · NASIB BELUM TENTU</span><span id="payout-mult">1.00× HADIAH</span></div>
      </section>
      <aside class="right-panel tab-panel" data-panel="workshop">
        <section class="workshop dark-panel"><div class="workshop-heading"><span class="tool-symbol">⚒</span><div><div class="eyebrow">BENGKEL MESIN</div><h2>Modal nekat.</h2></div></div><p class="panel-intro">Sedikit diutak-atik. Banyak diharap.</p><div id="upgrades"></div><div class="workshop-tip">Upgrade dibeli dengan saldo.<br>Sisakan cukup untuk putaran berikutnya.</div></section>
        <section class="prestige-panel"><span class="prestige-symbol">✦</span><div><h2>Ulang Nasib</h2><p id="prestige-copy"></p></div><button id="prestige" aria-label="Buka Ulang Nasib">↗</button></section>
        <section class="dark-panel log-panel"><div class="section-title"><h2>Kabar terakhir</h2><span class="live-dot"></span></div><div id="logs"></div></section>
      </aside>
    </main>
    <footer class="desktop-footer"><span>BESOK LUNAS <b> / </b> CORE GAMEPLAY PROTOTYPE</span><span>Semua uang & peluang adalah fiksi game.</span><button id="reset" class="text-button">Reset save</button></footer>
  </div>
  <nav class="mobile-nav" aria-label="Panel game"><button data-tab="machine" class="selected">▣ <span>Mesin</span></button><button data-tab="workshop">⚒ <span>Bengkel</span></button><button data-tab="notes">▤ <span>Catatan</span></button></nav>
  <dialog id="modal"><div class="modal-content"><button id="close-modal" class="modal-close" aria-label="Tutup">×</button><div id="modal-body"></div></div></dialog>
  <div class="toast" id="toast" role="status"></div>
`;

function persistBank() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(bank));
    storageFailed = false;
  }
  catch { storageFailed = true; }
  const status = document.getElementById('save-status');
  if (status) status.innerHTML = storageFailed ? 'Save tidak tersedia' : '<i></i> Tersimpan lokal';
}
function save() {
  if (shell?.inRun && state.story.view !== 'menu') {
    bank.settings.muted = state.muted;
    bank.slots[bank.activeSlot] = state;
  }
  persistBank();
}
function setButton(id: string, disabled: boolean) { $<HTMLButtonElement>(id).disabled = disabled; }
function render() {
  $('first-spin-tip').hidden = state.story.guide !== 2;
  $('spin').classList.toggle('guide-target',state.story.guide===2);
  $('day-dashboard').innerHTML=dayBar(state);
  $('cash').textContent = money(state.cash); $('debt').textContent = money(totalDebt(state));
  $('run-label').textContent = `NASIB KE-${String(state.runs).padStart(2, '0')}`;
  $('insight').textContent = `${state.insight} ingatan`;
  $('spin-count').textContent = String(state.spins).padStart(3, '0');
  $('next-bill').textContent = money(state.bill || nextBill(state));
  $('deadline').textContent = state.debt === 0 ? 'Lunas' : state.bill ? 'Sekarang' : `Akhir hari ${state.day + (3 - state.day % 3)}`;
  $('bill-progress').style.width = `${state.bill ? 100 : state.day % 3 / 3 * 100}%`;
  document.querySelector('.stamp')!.textContent = state.debt === 0 ? 'LUNAS…?' : 'BELUM LUNAS';
  $('bet').textContent = money(state.bet); $('spin-cost').textContent = `${money(cost(state))} / ${held === null ? 'SPIN' : 'RESPIN'}`;
  $('spin-label').textContent = busy ? 'BERPUTAR…' : held === null ? 'PUTAR' : 'PUTAR ULANG';
  const blocked = busy || engineBlocked(state);
  setButton('spin', blocked || remainingTime(state)<spinMinutes(state) || !scene || state.cash < cost(state));
  setButton('bet-down', blocked || state.bet === 1000); setButton('bet-up', blocked || state.bet === 5000);
  $('auto').classList.toggle('on', auto); $('auto-label').textContent = !state.upgrades.auto ? 'TERKUNCI' : auto ? 'AKTIF' : 'MATI';
  setButton('auto', engineBlocked(state) || remainingTime(state)<spinMinutes(state));
  $('speed').textContent = `${(1 / (1 - state.upgrades.turbo * .25)).toFixed(1)}×`;
  for (let i = 0; i < 3; i++) {
    setButton(`hold-${i}`, blocked || state.machine === 2 || !state.upgrades.hold || !state.canHold || auto);
    $(`hold-${i}`).classList.toggle('held', held === i); $(`hold-${i}`).setAttribute('aria-pressed', String(held === i));
    $(`hold-${i}`).title = !state.upgrades.hold ? 'Beli Tahan Dulu di Bengkel' : !state.canHold ? 'Tersedia setelah spin biasa. Satu respin per putaran.' : 'Tahan seluruh kolom ini untuk satu respin berbayar';
  }
  $('payout-mult').textContent = `${multiplier(state).toFixed(2)}× HADIAH`;
  $('machine-name').textContent = ['RECEH REJEKI', 'SULTAN MALAM', 'RANTAI REJEKI'][state.machine];
  $('machine-edition').textContent = ['MESIN RAKYAT · VOL. 01', 'MESIN SULTAN · VOL. 02', 'MESIN CASCADE · VOL. 03'][state.machine];
  $('machine-subtitle').textContent = ['MODAL RECEH, MIMPI GEDE.', 'TIGA GARIS. TIGA KALI NEKAT.', 'TRIPEL RUNTUH. PENGALI TUMBUH.'][state.machine];
  $('machine-lines').textContent = ['1 GARIS AKTIF', '3 GARIS AKTIF', 'TRIPEL → 1× / 2× / 4×'][state.machine];
  document.querySelector('.paytable p')!.textContent = state.machine === 2 ? 'Tripel · sebelum pengali tahap & upgrade' : '3 simbol sama · pengali taruhan';
  document.querySelectorAll('.symbol-table b').forEach((el, i) => el.textContent = `${SYMBOLS[i].triple * (state.machine === 2 ? 1.5 : 1)}×`);
  document.querySelector('.pair-note')!.textContent = state.machine === 2 ? 'Hanya tripel. Tahap 1× → 2× → 4×.' : '2 simbol sama juga bayar.';
  $('cabinet').classList.toggle('sultan', state.machine === 1); $('cabinet').classList.toggle('cascade', state.machine === 2);
  $('receh-tab').classList.toggle('selected', state.machine === 0); $('sultan-tab').classList.toggle('selected', state.machine === 1);
  $('sultan-lock').textContent = state.sultanUnlocked ? '' : '⌑';
  setButton('receh-tab', blocked); setButton('sultan-tab', blocked); setButton('cascade-tab', blocked);
  $('cascade-tab').classList.toggle('selected', state.machine === 2); $('cascade-lock').textContent = state.cascadeUnlocked ? '' : '⌑';
  $('pressure').textContent = `TEKANAN ${tier(state) + 1} · BIAYA MESIN +${Math.round(feeRate(state) * 100)}%`;
  $('pressure-next').textContent = tier(state) < 10 ? `${40 - state.turns % 40} poin tekanan → naik` : 'Tekanan maksimum';
  $('ojol-label').textContent = state.job ? 'Lanjutkan order aktif' : `Bersih ${money(jobQuote(state).net)} / order`;
  $('loan-label').textContent = state.loan ? `${money(state.loan.balance)} · akhir hari ${state.loan.due}` : 'Cair cepat. Bayar berat.';
  setButton('ojol', busy || state.ended || (!state.job && !canWork(state))); setButton('pinjol', busy || state.ended || !!state.job);
  $('upgrades').innerHTML=renderTree(state,workshopBranch);
  $('prestige-copy').textContent = insightEarned(state) ? `Mulai lagi dengan +${insightEarned(state)} ingatan.` : `${Math.max(0, 40 - state.spins)} spin menuju ingatan pertama.`;
  setButton('prestige', busy);
  $('logs').innerHTML = state.logs.slice(0, 4).map(l => `<div class="log-entry ${l.kind}"><span>${l.kind === 'win' ? '↗' : l.kind === 'loss' ? '↘' : '·'}</span><p>${escape(l.text)}</p></div>`).join('');
  $('sound').textContent = state.muted ? '♪̸' : '♪'; $('sound').setAttribute('aria-label', state.muted ? 'Nyalakan suara' : 'Matikan suara');
  setButton('back-room', busy); setButton('open-phone', busy); story?.render();
}
let toastTimer: ReturnType<typeof setTimeout>;
function toast(text: string) { $('toast').textContent = text; $('toast').classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').classList.remove('show'), 3200); }
function stopAuto() { auto = false; clearTimeout(autoTimer); }
function showModal(html: string, locked = false) {
  rider?.destroy(); rider=undefined;
  stopAuto(); $('modal-body').innerHTML = html; $('close-modal').hidden = locked;
  $<HTMLDialogElement>('modal').dataset.locked = String(locked);
  if (!$<HTMLDialogElement>('modal').open) $<HTMLDialogElement>('modal').showModal();
  render();
}
function closeModal() { rider?.destroy(); rider=undefined; $<HTMLDialogElement>('modal').close(); }
function showBill() {
  showModal(`<div class="eyebrow">TAGIHAN · HARI ${state.day}</div><h2>Hari ini harus beres.</h2><p>Judol berhenti selama tagihan hari ini belum lunas. Kerja hanya tersedia selama waktumu cukup. Saat menutup hari, kekurangan pembayaran mengakhiri run.</p>${dayPlan(state)}<div class="ending-receipt"><span>Cicilan kos<b>${money(state.bill)}</b></span><span>Pinjol hari ini<b>${money(loanDue(state)?state.loan!.balance:0)}</b></span><span>Saldo<b>${money(state.cash)}</b></span></div>${state.bill&&state.cash>=state.bill?'<button class="primary-button" data-action="pay">BAYAR CICILAN KOS</button>':''}${loanDue(state)?'<button class="primary-button" data-action="finance">URUS PINJOL</button>':''}${canWork(state)?'<button class="primary-button green" data-action="work">NARIK OJOL</button>':'<p>Waktu untuk satu shift sudah tidak cukup.</p>'}<button class="secondary-button" data-action="day">TUTUP HARI / LIHAT RINCIAN</button>${!state.loan?'<button class="secondary-button" data-action="finance">Lihat Pinjol</button>':''}<button class="secondary-button" data-action="close">Kembali ke kamar</button>`);
}
function showDay() {
  if(busy||state.job||state.story.finale||state.ended)return;
  const due=dailyObligations(state),short=state.cash<due;
  showModal(`<div class="eyebrow">TUTUP HARI ${state.day} · ${clockTime(state)}</div><h2>${remainingTime(state)<spinMinutes(state)?'Waktunya sudah habis.':'Sebelum lampu dimatikan.'}</h2>${dayPlan(state)}<div class="ending-receipt"><span>Saldo<b>${money(state.cash)}</b></span><span>Tagihan hari ini<b>${money(due)}</b></span><span>${short?'Kekurangan':'Sisa sesudah bayar'}<b>${money(Math.abs(state.cash-due))}</b></span></div><p>${short?'Uang belum cukup. Jika kamu menutup hari sekarang, run berakhir. Tidak ada kerja tanpa batas setelah deadline.':'Tagihan hari ini dibayar otomatis saat tidur. Sisa waktu tidak dibawa ke besok.'}</p><button class="primary-button ${short?'danger':''}" data-action="end-day">${short?'TUTUP HARI · AKHIRI RUN':'BAYAR & TIDUR → HARI '+(state.day+1)}</button>${canWork(state)?'<button class="secondary-button" data-action="work">Masih sempat narik</button>':''}<button class="secondary-button" data-action="close">Kembali dulu</button>`);
}
function showEnding() {
  if (state.story.finale) { showFinale(); return; }
  showModal(`<div class="eyebrow">AKHIR NASIB KE-${state.runs}</div><h2>Besok belum lunas.</h2><p>${escape(state.ending || "Mesin berhenti. Utangnya tinggal.")}</p><div class="ending-receipt"><span>Total hadiah masuk<b>${money(state.totalWon)}</b></span><span>Saldo tersisa<b>${money(state.cash)}</b></span><span>Utang tersisa<b>${money(totalDebt(state))}</b></span><span>Putaran dimainkan<b>${state.spins}</b></span></div><blockquote>“Tinggal satu kali menang lagi.”</blockquote><p>Ulang dengan <b>+${insightEarned(state)} ingatan</b>. Setiap ingatan memberi +Rp5.000 modal awal dan +2% pengali hadiah (maks. +50%).</p><button class="primary-button" data-action="rebirth">ULANG NASIB ↻</button>`, true);
}
function checkAfterSpin() {
  if (shell.phase !== 'playing') return;
  if (state.story.intro < 4) return;
  if (state.story.finale) { showFinale(); return; }
  if (state.ended) { showEnding(); return; }
  if (state.job) { showWork(); return; }
  if (remainingTime(state)<spinMinutes(state)) { showDay(); return; }
  if (state.bill || loanDue(state)) { showBill(); return; }
  if (state.cash < minimumCost(state)) { stopAuto(); if (state.story.view === 'game') showRecovery(); return; }
  if (state.cash < cost(state)) { stopAuto(); toast('Saldo di bawah biaya spin. Turunkan taruhan, pindah mesin, atau narik ojol.'); render(); }
}
async function doSpin() {
  if (shell.phase !== 'playing' || busy || !scene || state.story.intro < 4 || state.story.view !== 'game' || $<HTMLDialogElement>('modal').open) return;
  audio.unlock();

  const result = spin(state, held);
  if (!result) { stopAuto(); audio.play('error'); checkAfterSpin(); return; }
  busy = true; held = null; state.story.guide = 3; save(); render(); audio.play('spin');
  $('result').classList.remove('winning'); $('result').innerHTML = '<strong>REJEKI LAGI DIPUTAR…</strong><span>Yang pasti cuma biaya spinnya.</span>';
  try { await scene.animate(result, state.upgrades.turbo, () => audio.play('stop'), factor => { $('result').innerHTML = `<strong>RANTAI ${factor}×</strong><span>Tripel pecah. Simbol baru turun.</span>`; }); }
  finally { busy = false; }
  const amount = result.payout + result.bonus;
  const centerNames = result.grid.map(c => SYMBOLS[c[1]].name).join(' · ');
  $('reels').setAttribute('aria-label', `Garis tengah: ${centerNames}. Total hadiah ${money(amount)}.`);
  if (amount) {
    audio.play('win'); $('result').classList.add('winning');
    $('result').innerHTML = `<strong>+${money(amount)}</strong><span>${amount > result.paid ? `Bersih +${money(amount - result.paid)}.` : amount === result.paid ? 'Balik modal. Belum balik nasib.' : `Setelah biaya spin: −${money(result.paid - amount)}.`} ${result.cascades.length > 1 ? 'RANTAI ' + result.cascades.length + ' TAHAP!' : result.wins.some(w => w.count === 3) ? 'TIGA SERANGKAI!' : ''}</span>`;
  } else $('result').innerHTML = `<strong>BELUM REJEKI.</strong><span>${centerNames}. Belum ada yang cocok.</span>`;
  render(); checkAfterSpin();
  if (auto && !engineBlocked(state) && !document.hidden) autoTimer = setTimeout(() => void doSpin(), 650);
}
function setMachine(mode: 0 | 1 | 2) {
  if (busy || engineBlocked(state)) return;
  if (mode && !(mode === 1 ? state.sultanUnlocked : state.cascadeUnlocked)) {
    const requirement=machineRequirement(state,mode);
    const needed = mode === 1 ? 30 : 60, price = mode === 1 ? 18000 : 24000;
    showModal(`<div class="eyebrow">MESIN 0${mode + 1}</div><h2>${mode === 1 ? 'Sultan Malam' : 'Rantai Rejeki'}</h2><p>${mode === 1 ? 'Tiga garis horizontal membayar sekaligus. Pasangan dan tripel membayar.' : 'Hanya tiga simbol sama dalam satu baris yang membayar, sebesar 1,5× hadiah tripel biasa. Baris menang runtuh dan diisi simbol baru. Maksimal tiga tahap: pengali 1× → 2× → 4×. Tanpa hold.'}</p><p>Biaya: 3× taruhan per spin, ditambah biaya tekanan yang terlihat di atas mesin.</p><p class="tree-requirement">${requirement?'Perlu: '+requirement:'Prasyarat terpenuhi.'}</p><div class="unlock-conditions"><span>${state.spins >= needed ? '✓' : '○'} Mainkan ${needed} spin (${Math.min(state.spins, needed)}/${needed})</span><span>${state.cash >= price ? '✓' : '○'} Biaya buka ${money(price)}</span></div><button class="primary-button" data-action="unlock" data-machine="${mode}" ${requirement || state.cash < price ? 'disabled' : ''}>BUKA MESIN</button>`); return;
  }
  stopAuto(); held = null; state.canHold = false; state.machine = mode; scene?.setMode(mode); save(); render();
  describeMachine();
}
function describeMachine() {
  $('result').classList.remove('winning');
  $('result').innerHTML = state.machine === 2 ? '<strong>TRIPEL → CASCADE</strong><span>Hanya tripel. Isi ulang, pengali 1× → 2× → 4×.</span>' : `<strong>SATU PUTARAN LAGI?</strong><span>${state.machine === 1 ? '3 garis horizontal. Pasangan dan tripel membayar.' : 'Cocokkan 2 atau 3 simbol di garis tengah.'}</span>`;
}
function showHelp() {
  showModal(`<div class="eyebrow">CARA BERMAIN</div><h2>Satu hari.<br>Banyak kebutuhan.</h2><ol class="instructions"><li><b>Atur waktu.</b> Mulai pukul 08:00 dengan 10 jam aktif. Spin memakai ${spinMinutes(state)} menit, shift Ojol ${jobMinutes(state)} menit. Menu dan pesan tidak memakai waktu.</li><li><b>Narik Ojol.</b> Hindari rintangan di 3 lajur dengan ← →, A/D, geser, atau tombol lajur. Tas kuning menambah Rp750. Benturan memotong Rp600. Hasil bersih minimal Rp1.000.</li><li><b>Cicilan.</b> Kos ditagih setiap hari ke-3. Pinjol harus lunas pada akhir hari yang tertulis di kontrak. Tutup hari membayar otomatis; kalau kurang, run berakhir.</li><li><b>Upgrade.</b> Ritme Sehat memperpanjang waktu aktif. Rute & Fokus mengurangi waktu order dan spin. Mesin Ngebut hanya mempercepat animasi.</li><li><b>Mesin.</b> Receh membayar garis tengah; Sultan tiga baris; Rantai hanya tripel dengan cascade 1×/2×/4×. Hold berbayar tersedia sekali sesudah spin normal.</li><li><b>Istirahat.</b> Tekan TUTUP HARI di kamar atau mesin untuk melihat rencana dan masuk hari berikutnya.</li></ol><button class="primary-button" data-action="close">MENGERTI</button>`);
}
function showOdds() {
  showModal(`<div class="eyebrow">PEMBAYARAN MESIN</div><h2>Baca yang kecil.</h2><p>Pengali hadiah saat ini: <b>${multiplier(state).toFixed(2)}×</b>. Nilai berikut adalah pengali taruhan per garis.</p><table class="odds-table"><thead><tr><th>Simbol</th><th>2 sama</th><th>3 sama</th></tr></thead><tbody>${SYMBOLS.map(s=>`<tr><td>${s.name}</td><td>${s.pair}×</td><td>${s.triple}×</td></tr>`).join('')}</tbody></table><p>Sultan membayar tiga garis. Rantai hanya tripel: nilai tabel ×1,5 lalu tahap 1×/2×/4×. Maksimal tiga tahap, tanpa hold. Hadiah kecil dapat lebih rendah dari biaya spin.</p><p>Biaya tekanan: +${Math.round(feeRate(state)*100)}%. Spin memakai ${spinMinutes(state)} menit. Semua uang dan hasil adalah fiksi game.</p>`);
}
function selectTab(tab: string) {
  document.body.dataset.panel=tab;
  document.querySelectorAll<HTMLElement>('[data-panel]').forEach(p => p.classList.toggle('active', p.dataset.panel === tab));
  document.querySelectorAll<HTMLElement>('[data-tab]').forEach(p => p.classList.toggle('selected', p.dataset.tab === tab));
}
function openPrestige() {
  if (busy) return;
  if (state.ended) return showEnding();
  showModal(`<div class="eyebrow">ULANG NASIB</div><h2>Mulai dari nol.<br>Bawa ingatannya.</h2><p>Saldo, utang, mesin, upgrade, dan jumlah spin direset. Kamu menyimpan ingatan lama dan mendapat <b>+${insightEarned(state)}</b> dari run ini.</p><div class="modal-money">${state.insight + insightEarned(state)} INGATAN</div><p>Modal berikutnya ${money((state.insight + insightEarned(state)) * 5000)}. Pengali permanen +${Math.min(state.insight + insightEarned(state), 25) * 2}%.</p><button class="primary-button" data-action="rebirth">YA, ULANG NASIB</button><button class="secondary-button" data-action="close">Lanjutkan run ini</button>`);
}
document.addEventListener('click', e => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('button'); if (!b || b.disabled) return;
  audio.unlock();
  if(b.dataset.story==='tree-filter'&&b.closest('#upgrades')){workshopBranch=b.dataset.branch!;render();document.querySelector<HTMLButtonElement>(`#upgrades [data-branch="${workshopBranch}"]`)?.focus({preventScroll:true});return;}
  if(b.dataset.treeMachine){const mode=Number(b.dataset.treeMachine) as 1|2;if(!busy&&unlockMachine(state,mode)){save();render();toast('Mesin baru terbuka. Buka dari aplikasi Judol.');}return;}
  if (b.dataset.tab) { selectTab(b.dataset.tab); return; }
  if (b.dataset.hold !== undefined && !busy) { const i = Number(b.dataset.hold); held = held === i ? null : i; render(); return; }
  if (b.dataset.upgrade && !busy) {
    if (buyUpgrade(state, b.dataset.upgrade as Upgrade)) { audio.play('buy'); save(); render(); toast(`${UPGRADES[b.dataset.upgrade as Upgrade].name} terpasang!`); checkAfterSpin(); }
    return;
  }
  switch (b.id) {
    case 'back-room': if (!busy) { stopAuto(); story?.toRoom(); } break;
    case 'open-phone': if (!busy) { stopAuto(); story?.toPhone(); } break;
    case 'spin': void doSpin(); break;
    case 'sound': state.muted = !state.muted; bank.settings.muted = state.muted; audio.muted = state.muted; save(); render(); break;
    case 'help': showHelp(); break;
    case 'odds': showOdds(); break;
    case 'close-modal': closeModal(); break;
    case 'receh-tab': setMachine(0); break;
    case 'sultan-tab': setMachine(1); break;
    case 'cascade-tab': setMachine(2); break;
    case 'ojol': showWork(); break;
    case 'pinjol': showFinance(); break;
    case 'bet-up': case 'bet-down': {
      if (busy) break; stopAuto(); held = null; state.canHold = false;
      const bets = [1000, 2000, 5000]; state.bet = bets[Math.max(0, Math.min(2, bets.indexOf(state.bet) + (b.id === 'bet-up' ? 1 : -1)))]; save(); render(); break;
    }
    case 'auto':
      if (!state.upgrades.auto) { selectTab('workshop'); toast('Beli Jempol Otomatis di Bengkel untuk membuka auto-spin.'); break; }
      auto = !auto; held = null; clearTimeout(autoTimer); render(); if (auto && !busy) void doSpin(); break;
    case 'turbo-indicator': selectTab('workshop'); toast('Mesin Ngebut mempercepat animasi reel.'); break;
    case 'prestige': openPrestige(); break;
    case 'reset': if (!busy) showModal('<div class="eyebrow">RESET SAVE</div><h2>Hapus semuanya?</h2><p>Ini menghapus run dan seluruh ingatan permanen pada perangkat ini.</p><button class="primary-button danger" data-action="reset">HAPUS SAVE</button><button class="secondary-button" data-action="close">Batal</button>'); break;
  }
  switch (b.dataset.action) {
    case 'close': closeModal(); break;
    case 'work': showWork(); break;
    case 'finance': showFinance(); break;
    case 'start-job': if (startJob(state)) { held = null; save(); render(); showWork(); } break;
    case 'ride-done': rider?.destroy();rider=undefined;story?.toPhone();render();if(state.ended)showEnding();break;
    case 'day': showDay(); break;
    case 'end-day': if(!busy && endDay(state)){closeModal();held=null;save();render();if(state.ended)showEnding();else{story?.toRoom();checkAfterSpin();}} break;
    case 'offer': showLoanOffer(Number(b.dataset.amount)); break;
    case 'borrow': if (borrow(state, Number(b.dataset.amount))) { save(); render(); closeModal(); toast('Pinjol cair. Deadline sudah berjalan.'); checkAfterSpin(); } break;
    case 'repay': if (repayLoan(state, Number(b.dataset.amount))) { save(); render(); showFinance(); } break;
    case 'pay': if (payBill(state)) { closeModal(); save(); render(); checkAfterSpin(); } break;
    case 'begin-finale': if (beginFinale(state)) { save(); render(); showFinale(); } break;
    case 'reveal-finale': if (revealFinale(state)) { save(); render(); showFinale(); } break;
    case 'end': endRun(state); save(); render(); showEnding(); break;
    case 'unlock': { const m = Number(b.dataset.machine) as 1 | 2; if (unlockMachine(state, m)) { closeModal(); setMachine(m); audio.play('buy'); save(); render(); checkAfterSpin(); } break; }
    case 'rebirth': case 'reset':
      if (busy) break; stopAuto();
      if (b.dataset.action === 'reset') { state = fresh(); state.muted = bank.settings.muted; bank = wrapState(state, bank.settings); }
      else state = prestige(state);
      audio.muted = state.muted; held = null;
      scene?.display(state.grid); scene?.setMode(0); closeModal(); save(); render(); selectTab('machine');
      $('result').classList.remove('winning'); $('result').innerHTML = '<strong>NASIB BARU. MIMPI LAMA.</strong><span>Satu putaran lagi?</span>'; story?.render(); break;
  }
});
$<HTMLDialogElement>('modal').addEventListener('cancel', e => { if ($<HTMLDialogElement>('modal').dataset.locked === 'true') e.preventDefault(); else {rider?.destroy();rider=undefined;} });
document.addEventListener('keydown', e => {
  if (shell.phase !== 'playing' || e.repeat || state.story.intro < 4 || state.story.view !== 'game' || $<HTMLDialogElement>('modal').open || ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) return;
  if ((e.target as HTMLElement).tagName === 'BUTTON' && [' ', 'Enter'].includes(e.key)) return;
  if (e.code === 'Space') { e.preventDefault(); void doSpin(); }
  if (['1', '2', '3'].includes(e.key)) $<HTMLButtonElement>(`hold-${Number(e.key) - 1}`).click();
  if (e.key.toLowerCase() === 'a') $<HTMLButtonElement>('auto').click();
});
document.addEventListener('visibilitychange', () => { if (document.hidden) { stopAuto(); save(); render(); } });
window.addEventListener('pagehide', save);
function enterPlay() {
  applyReducedMotion(bank.settings);
  audio.muted = state.muted;
  if (state.story.view === 'menu') state.story.view = 'room';
  scene?.display(state.grid);
  scene?.setMode(state.machine);
  story?.render();
  render();
  describeMachine();
  if (scene) checkAfterSpin();
}
function leavePlay() {
  stopAuto();
  closeModal();
  rider?.destroy(); rider = undefined;
  story?.render();
  render();
}
shell = new GameShell({
  bank: () => bank,
  state: () => state,
  setBank: next => { bank = next; },
  setState: next => { state = next; audio.muted = next.muted; },
  persist: persistBank,
  persistRun: save,
  applyAudio: () => { audio.muted = state.muted; },
  enterPlay,
  leavePlay,
  lockedModal: () => $<HTMLDialogElement>('modal').open && $<HTMLDialogElement>('modal').dataset.locked === 'true',
  openModal: () => $<HTMLDialogElement>('modal').open,
  pauseRide: () => { rider?.pause(); },
  notice: toast,
});
story = new StoryDirector({ state: () => state, save, work: showWork, finance: showFinance,
  game: () => { stopAuto(); selectTab('machine'); render(); if(state.story.guide===2)requestAnimationFrame(()=>$('spin').scrollIntoView({block:'center',behavior:'smooth'})); },
  shop: () => { stopAuto(); selectTab('workshop'); render(); },
  finale: showFinale, restart: openPrestige,
  leaveApp: () => {rider?.destroy();rider=undefined;},
  blocked: () => busy || $<HTMLDialogElement>('modal').open,
  onEscape: () => shell.handleEscape(),
  system: () => shell.openSystem(),
});
shell.boot();
story.render();
createReels(state.grid, ready => {
  scene = ready; $('loading').hidden = true;
  if (shell.phase === 'playing') {
    scene.display(state.grid); scene.setMode(state.machine); render(); describeMachine(); checkAfterSpin();
  }
});
render();

function showRecovery() {
  showModal(`<div class="eyebrow">${state.spins ? 'SALDO MENIPIS' : 'AWAL NASIB'}</div><h2>${state.spins ? 'Habis saldo.<br>Belum habis jalan.' : 'Modalnya?<br>Narik dulu.'}</h2><p>${state.spins ? 'Mesinnya masih di sini. Cari uang lewat ojol, atau ambil pinjaman dengan bunga dan deadline.' : 'Kamu mulai tanpa uang tunai dan utang kos Rp75.000. Selesaikan order pertama untuk mendapat modal.'}</p><div class="recovery-card"><span class="symbol-art s2"></span><div><b>Kerja satu order</b><small>Dasar ${money(jobQuote(state).net)} · ${jobMinutes(state)} menit</small></div></div><button class="primary-button green" data-action="work" ${canWork(state)?'':'disabled'}>NARIK OJOL · ${jobMinutes(state)} MENIT</button><button class="secondary-button" data-action="day">Lihat waktu & tutup hari</button><button class="secondary-button" data-action="finance">${state.loan ? 'Lihat Pinjol aktif' : 'Lihat tawaran Pinjol'}</button><button class="secondary-button" data-action="close">Kembali ke mesin</button>`);
}
function showWork() {
  if(busy||state.ended||state.story.finale)return;
  closeModal();
  const offer=(html:string)=>{story?.openApp(html);render();};
  if(state.job){
    offer('<div id="ride-host"></div>');
    rider=new RiderGame($('ride-host'),()=>state,save,(reward,orders,hits)=>{
      save();render();audio.play('buy');offer(`<div class="shift-receipt"><div class="shift-stamp">✓</div><div class="eyebrow">SHIFT SELESAI</div><h2>Sampai tujuan.</h2><div class="shift-amount">${money(reward)}</div><p>Sudah masuk ke saldo.</p><div class="ending-receipt"><span>Order bonus<b>${orders}</b></span><span>Benturan<b>${hits}</b></span><span>Waktu hari ini<b>${remainingTime(state)} menit</b></span></div><button class="primary-button green" data-action="ride-done">${state.story.guide===1?'LANJUT → PESAN DARI RUMAH':'KEMBALI KE APLIKASI'}</button></div>`);
    });return;
  }
  const q=jobQuote(state);
  offer(`<div class="ojol-cover"><div class="ojol-helmet"></div><span>STATUS DRIVER · ONLINE</span><h2>Rejeki di jalan.</h2><p>Ambil order. Jaga lajur.<br>Pulang bawa hasilnya.</p></div><div class="shift-info"><span>BERSIH DASAR<b>${money(q.net)}</b></span><span>WAKTU SHIFT<b>${jobMinutes(state)} menit</b></span></div><div class="ojol-route-card"><i></i><div><b>Warung Bu Sari</b><small>Ambil pesanan</small><b>Kampung Rejeki</b><small>Antar ke pelanggan · 12 bagian rute</small></div></div><p class="ojol-small">Kumpulkan tas order bonus, hindari kendaraan. Tombol lajur, ← →, atau geser untuk bergerak. Waktu tersisa ${remainingTime(state)} menit.</p><button class="primary-button green ${state.story.guide===0?'guide-target':''}" data-action="start-job" ${canWork(state)?'':'disabled'}>TERIMA SHIFT <span>→</span></button>${!canWork(state)?'<p>Waktu tidak cukup untuk shift baru.</p><button class="secondary-button" data-action="day">TUTUP HARI</button>':''}`);
}
function showFinance() {
  if (busy || state.ended || state.job || state.story.finale) return;
  const l=state.loan;
  showModal(`<div class="eyebrow">PINJOL FIKTIF · CAIR KILAT</div><h2>${l?'Cairnya kemarin.':'Tinggal klik. Besok pikir.'}</h2>${l?`<div class="ending-receipt"><span>Pokok<b>${money(l.principal)}</b></span><span>Bunga tetap<b>${money(l.interest)}</b></span><span>Sisa wajib dibayar<b>${money(l.balance)}</b></span><span>Batas terakhir<b>AKHIR HARI ${l.due}</b></span><span>Hari sekarang<b>${state.day} · ${clockTime(state)}</b></span></div><p>Bayar sebagian tidak mengundur deadline. Saat tutup hari ${l.due}, sisa pinjaman ditagih otomatis. Jika saldo kurang, motor ditarik dan run berakhir.</p>${dayPlan(state)}<button class="primary-button" data-action="repay" data-amount="${Math.min(state.cash,l.balance)}" ${state.cash?'':'disabled'}>${state.cash>=l.balance?'LUNASI':'BAYAR'} ${money(Math.min(state.cash,l.balance))}</button>${state.cash>5000&&l.balance>5000?'<button class="secondary-button" data-action="repay" data-amount="5000">Cicil Rp5.000</button>':''}${canWork(state)?'<button class="secondary-button" data-action="work">Cari uang lewat Ojol</button>':''}<button class="secondary-button" data-action="day">Waktu & tutup hari</button>`:`<p>Bunga tetap, satu pinjaman aktif. Batas pembayaran akhir hari keempat termasuk hari pengajuan.</p><div class="loan-offers">${LOAN_AMOUNTS.map(amount=>{const q=quoteLoan(state,amount);return `<button data-action="offer" data-amount="${amount}"><b>Cair ${money(amount)}</b><span>Bunga ${Math.round(q.rate*100)}% · ${money(q.interest)}</span><strong>Bayar ${money(q.total)}</strong><small>Akhir hari ${q.due} · Baca rincian →</small></button>`;}).join('')}</div>`}`);
}
function showLoanOffer(principal:number){
  if(!LOAN_AMOUNTS.includes(principal as typeof LOAN_AMOUNTS[number])||state.loan||state.ended||state.job||state.story.finale)return;
  const q=quoteLoan(state,principal);
  showModal(`<div class="eyebrow">RINCIAN PINJAMAN</div><h2>Baca sebelum cair.</h2><div class="ending-receipt"><span>Masuk saldo<b>${money(principal)}</b></span><span>Bunga tetap ${Math.round(q.rate*100)}%<b>${money(q.interest)}</b></span><span>Total wajib bayar<b>${money(q.total)}</b></span><span>Batas terakhir<b>AKHIR HARI ${q.due}</b></span></div><p>Hari ini hari ${state.day}. Kerja dan spin memakai waktu harian yang terbatas. Bunga tetap dibayar walau lunas lebih awal. Jika uang kurang saat hari jatuh tempo ditutup, motor ditarik dan run berakhir. Tidak ada perpanjangan otomatis.</p><button class="primary-button danger" data-action="borrow" data-amount="${principal}">AMBIL PINJAMAN ${money(principal)}</button><button class="secondary-button" data-action="finance">Kembali</button>`);
}

function showFinale() {
  if (busy) return;
  const f = state.story.finale;
  if (!f) {
    showModal(`<div class="eyebrow">PINTU TERAKHIR · SEKALI PER RUN</div><h2>Kesempatan Terakhir</h2><p>Bima membayangkan Rp100 juta: utang keluarga lunas, rumah yang lebih tenang, dan waktu untuk pulang.</p><div class="ending-receipt"><span>Putaran dimainkan<b>${Math.min(state.spins,100)}/100</b></span><span>Total hadiah masuk<b>${money(state.totalWon)} / Rp150.000</b></span><span>Rantai Rejeki<b>${state.cascadeUnlocked ? 'Terbuka' : 'Belum terbuka'}</b></span><span>Biaya membuka<b>${money(FINALE_COST)}</b></span></div><p>${state.bill || loanDue(state) || state.job ? 'Selesaikan order dan tagihan jatuh tempo lebih dulu.' : 'Membuka kartu ini mengakhiri run. Tiga segel hanya mengungkap satu hasil yang sudah ditentukan.'}</p>${finaleReady(state) ? '<p class="warning">Baru di sini tulisan kecilnya terbaca: hanya 1 dari 100 hasil berakhir baik. Upgrade dan prestige tidak mengubah peluang itu.</p><button class="primary-button danger" data-action="begin-finale">BUKA KESEMPATAN TERAKHIR</button>' : '<button class="primary-button" disabled>BELUM TERBUKA</button>'}<button class="secondary-button" data-action="close">Belum. Kembali dulu.</button>`); return;
  }
  const good = f.roll === 0;
  if (f.revealed === 3) {
    showModal(`<div class="eyebrow">${good ? '1 DARI 100 · ENDING BAIK' : '99 DARI 100 · AKHIR NASIB'}</div><h2>${good ? 'Akhirnya, pulang.' : 'Besok tetap datang.'}</h2><div class="ending-art ${good ? 'panel-0' : 'panel-2'}" role="img" aria-label="${good ? 'Keluarga makan bersama' : 'Bima dan tagihan di meja'}"></div><p>${escape(state.ending)}</p>${good ? '<blockquote>“Ayah, besok sarapan di rumah?”<br>“Iya. Besok juga.”</blockquote>' : '<blockquote>“Kalau belum ada, bilang saja.<br>Kita pikirkan bareng.” — Maya</blockquote>'}<div class="ending-receipt"><span>Saldo yang tersisa<b>${money(state.cash)}</b></span><span>Utang yang masih ada<b>${money(totalDebt(state))}</b></span><span>Ingatan dari run ini<b>+${insightEarned(state)}</b></span></div><p class="muted">Peluang 1% ini adalah aturan fiksi game, bukan statistik kehidupan nyata.</p><button class="primary-button" data-action="rebirth">ULANG NASIB ↻</button>`, true); return;
  }
  showModal(`<div class="eyebrow">HASIL SUDAH DIKUNCI</div><h2>Tinggal tiga segel.</h2><p>“Sekali ini saja. Setelah itu aku berhenti.”</p><div class="final-seals">${[0,1,2].map(i=>`<button data-action="reveal-finale" ${i !== f.revealed ? 'disabled' : ''} class="${i < f.revealed ? 'revealed' : ''}"><b>${i < f.revealed ? good ? '♛' : '×' : '✧'}</b><small>${i < f.revealed ? 'TERBUKA' : 'SEGEL ' + (i+1)}</small></button>`).join('')}</div><p class="muted">Buka segel yang menyala. Menutup atau memuat ulang game tidak mengubah hasil. Tidak ada taruhan lanjutan setelah kartu ini.</p>`, true);
}
