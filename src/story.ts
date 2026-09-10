import {renderTree} from './tree';
import './world-v05.css';
import {dayBar} from './day';
import { type State, clockTime, totalDebt, finaleReady, FINALE_COST, loanDue, markFired, queueDueEvents } from './engine';
import { eventById, pendingBlock, pendingNotify } from './events';
const rp = (n: number) => 'Rp' + n.toLocaleString('id-ID');
const PANELS = [
  { chapter: '01 / YANG MENUNGGU DI RUMAH', title: 'Bukan cuma untuk diri sendiri.', text: 'Namamu Bima. Usia tiga puluh. Maya, istrimu, sedang menyiapkan bekal. Naya ingin sepatu sekolah baru. Kamu bilang: bulan depan, ya.', voice: '“Yang penting kita makan bareng dulu.”' },
  { chapter: '02 / YANG DULU MENJAGAMU', title: 'Sekarang, giliranmu.', text: 'Bapak tak lagi kuat bekerja. Ibu bilang obatnya masih ada, padahal tinggal untuk dua hari. Kamu tahu kenapa beliau tidak meminta.', voice: '“Ibu nggak mau merepotkan kamu, Bim.”' },
  { chapter: '03 / DI ANTARA DUA GENERASI', title: 'Rp75.000.000. Belum termasuk besok.', text: 'Biaya perawatan, kebutuhan rumah, utang lama. Semuanya menumpuk jadi Rp75 juta. Di kos ini, tunggakan Rp75 ribu juga menunggu. Saldo tunai: kosong.', voice: '“Kalau terus begini, kapan kami bisa hidup tenang?”' },
  { chapter: '04 / PESAN YANG DATANG TERLALU PAS', title: 'Katanya, satu kemenangan cukup.', text: 'Seorang teman mengirim tangkapan layar kemenangan. Angkanya jauh lebih besar dari hasil narik sebulan. Kamu menatap layar sedikit lebih lama.', voice: '“Sekali tembus, aku beresin semuanya.”' },
];
type Beat = { unlock: number; flag?: string; preview: string; text: string; reply: string };
type Thread = { id: string; from: string; avatar: string; beats: Beat[] };
const THREADS: Thread[] = [
  { id: 'maya', from: 'Maya · Rumah', avatar: 'M', beats: [
    { unlock: 0, preview: 'Jangan lupa makan, ya.', text: 'Bim, uang sekolah Naya jatuh tempo minggu ini. Kalau belum ada, bilang saja. Kita pikirkan bareng. Kamu jangan lupa makan, ya.', reply: 'Bima mengetik “Aku usahakan.” Lalu menghapus kata “pasti”.' },
    { unlock: 60, preview: 'Kamu dari tadi online…', text: 'Kamu dari tadi online, tapi pesan Ibu belum dibalas. Aku bukan marah soal uang, Bim. Aku khawatir kamu sendirian menanggung semuanya.', reply: 'Kamu menaruh ponsel. Tidak lama.' },
    { unlock: 0, flag: 'maya-session', preview: 'Jam segini masih di mesin?', text: 'Bim, jam segini kamu masih di situ. Naya sudah tanya dua kali. Aku tidak minta kamu pulang kaya. Aku minta kamu pulang.', reply: 'Layar masih menyala. Jam di pojok sudah jauh dari makan malam.' },
  ] },
  { id: 'ibu', from: 'Ibu', avatar: 'I', beats: [
    { unlock: 0, preview: 'Bapak tadi tanya kamu.', text: 'Bapak tadi tanya kamu kapan pulang. Obatnya tinggal sedikit, tapi jangan memaksakan diri. Ibu juga masih bisa bantu.', reply: 'Kamu menatap foto mereka sebelum menutup pesan.' },
    { unlock: 0, flag: 'ibu-unanswered', preview: 'Bima, Ibu tunggu kabar.', text: 'Bima, Ibu coba tanya lagi. Tidak usah bawa uang dulu. Ibu cuma mau tahu kamu masih makan. Balas sebentar saja, nak.', reply: 'Tiga order selesai. Pesan itu masih belum dibuka.' },
  ] },
  { id: 'doni', from: 'Doni · Teman lama', avatar: 'D', beats: [
    { unlock: 0, preview: 'Lihat nih, baru cair!', text: 'Bim, lihat nih. Baru cair! Coba receh dulu aja. Siapa tahu bisa buat nutup tagihan.', reply: 'Tangkapan layar itu hanya memperlihatkan kemenangan. Tidak ada riwayat uang yang sudah masuk.' },
    { unlock: 0, flag: 'doni-streak', preview: 'Wih, recehnya ngegas!', text: 'Wih Bim, recehnya lagi panas ya? Tiga kali beruntun gitu. Jangan berhenti di sini, biasanya pas mau tembus malah di-stop orang.', reply: 'Dia tidak menanyakan berapa yang sudah hilang sebelum tiga kemenangan itu.' },
  ] },
  { id: 'naya', from: 'Maya · Pesan suara Naya', avatar: 'N', beats: [
    { unlock: 20, preview: 'Ayah kapan pulang?', text: '“Ayah, tadi aku gambar kita di rumah yang ada pohonnya. Ayah pulang sebelum aku tidur, ya?”', reply: 'Di layar lain, tombol PUTAR masih menyala.' },
    { unlock: 20, flag: 'naya-night', preview: 'Ayah pulang malam ini?', text: '“Ayah, lampu depan sudah dinyalain Bu. Kalau ayah pulang malam ini, aku tunggu di kursi. Kalau nggak, aku tidur dulu ya.”', reply: 'Di luar kos, malam sudah sampai. Tombol PUTAR belum.' },
  ] },
  { id: 'final', from: 'Sistem · Kesempatan Terakhir', avatar: '!', beats: [
    { unlock: 100, preview: 'Satu pintu untuk keluar.', text: 'Kesempatan Terakhir terbuka setelah 100 spin, Rp150.000 total hadiah, dan Rantai Rejeki terbuka. Tiga segel. Satu hasil. Sesudah dibuka, run ini berakhir.', reply: 'Bima membaca kata “terakhir” sebagai janji, bukan peringatan.' },
  ] },
];
const beatOpen = (beat: Beat, s: State) => s.spins >= beat.unlock && (!beat.flag || s.story.flags.includes(beat.flag));
const listedThreads = (s: State) => THREADS.filter(thread => beatOpen(thread.beats[0], s));
const unlockedBeats = (thread: Thread, s: State) => thread.beats.filter(beat => beatOpen(beat, s));
const unreadCount = (s: State) => listedThreads(s).filter(thread => !s.story.read.includes(thread.id)).length;
function dismissNotifies(s: State) {
  for (const id of [...s.story.pending]) {
    if (eventById(id)?.interrupt === 'notify') markFired(s, id);
  }
}
function syncThreads(s: State): boolean {
  let changed = false;
  for (const thread of THREADS) {
    const cursor = unlockedBeats(thread, s).length - 1;
    if (cursor < 0) continue;
    const prev = s.story.threads[thread.id]?.cursor;
    if (prev === undefined) {
      s.story.threads[thread.id] = { cursor };
      changed = true;
      if (cursor > 0 && s.story.read.includes(thread.id)) s.story.read = s.story.read.filter(id => id !== thread.id);
    } else if (cursor > prev) {
      s.story.threads[thread.id] = { cursor };
      s.story.read = s.story.read.filter(id => id !== thread.id);
      changed = true;
    }
  }
  return changed;
}
export interface StoryHooks { state: () => State; save: () => void; work: () => void; finance: () => void; shop: () => void; game: () => void; finale: () => void; restart: () => void; blocked: () => boolean; leaveApp: () => void; onEscape?: () => boolean; system?: () => void; }
export class StoryDirector {
  private layer: HTMLElement;
  private phonePage = 'home';
  private treeBranch = 'all';
  private lastKey = '';
  private appHTML = '';
  openApp(html:string) { this.hooks.leaveApp();this.appHTML=html;this.phonePage='ojol';this.hooks.state().story.view='phone';this.layer.innerHTML='';this.lastKey='';this.hooks.save();this.render();return this.layer.querySelector<HTMLElement>('#phone-app')!; }
  constructor(private hooks: StoryHooks) {
    this.layer = document.createElement('section'); this.layer.id = 'story-layer'; document.body.append(this.layer);
    document.addEventListener('keydown', e => {
      if (e.key === 'Tab' && !this.hooks.blocked() && this.hooks.state().story.view === 'phone') {
        const items = [...this.layer.querySelectorAll<HTMLButtonElement>('.smartphone button:not(:disabled)')];
        const visibleItems = items.filter(item => item.getClientRects().length > 0);
        const first = visibleItems[0], last = visibleItems[visibleItems.length - 1];
        if (first && (!this.layer.querySelector('.smartphone')?.contains(document.activeElement) || (!e.shiftKey && document.activeElement === last))) { first.focus(); e.preventDefault(); }
        else if (last && e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
      }
      if (e.key === 'Escape') {
        if (this.hooks.onEscape?.()) { e.preventDefault(); return; }
        if (!this.hooks.blocked() && this.hooks.state().story.view === 'phone') { this.toRoom(); e.preventDefault(); }
      } });
    this.layer.addEventListener('click', e => {
      const b = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-story]');
      if (!b || b.disabled) return;
      const action = b.dataset.story ?? '';
      if (this.hooks.blocked() && !['ack-event', 'dismiss-event', 'system'].includes(action)) return;
      const s = this.hooks.state();
      if(['room','phone','home','messages','shop','judol','replay'].includes(action))this.hooks.leaveApp();
      switch (action) {
        case 'next': s.story.intro = Math.min(4, s.story.intro + 1); break;
        case 'previous': s.story.intro = Math.max(0, s.story.intro - 1); break;
        case 'skip': s.story.intro = 4; break;
        case 'room': s.story.view = 'room'; break;
        case 'phone': s.story.view = 'phone'; this.phonePage = 'home'; break;
        case 'messages': this.phonePage = 'messages'; dismissNotifies(s); break;
        case 'message': { const id = b.dataset.message!; if (!s.story.read.includes(id)) s.story.read.push(id); this.phonePage = id; break; }
        case 'home': this.phonePage = 'home'; break;
        case 'helmet': case 'work':
          queueDueEvents(s);
          if (pendingBlock(s)) break;
          this.hooks.work(); break;
        case 'judol':
          queueDueEvents(s);
          if (pendingBlock(s)) break;
          s.story.view = 'game';
          this.hooks.game(); break;
        case 'ack-event':
          markFired(s, b.dataset.event!);
          if (s.bill || loanDue(s)) s.story.view = 'room';
          break;
        case 'dismiss-event':
          markFired(s, b.dataset.event!);
          break;
        case 'shop': this.phonePage='tree'; break;
        case 'tree-filter': this.treeBranch=b.dataset.branch!; break;
        case 'finance': this.hooks.finance(); break;
        case 'finale': this.hooks.finale(); break;
        case 'replay': s.story.intro = 0; s.story.view = 'room'; break;
        case 'restart': this.hooks.restart(); break;
        case 'system': this.hooks.system?.(); return;
      }
      this.hooks.save(); this.render();
      if(action==='tree-filter')this.layer.querySelector<HTMLButtonElement>(`[data-story="tree-filter"][data-branch="${this.treeBranch}"]`)?.focus({preventScroll:true});
    });
  }
  toRoom() { this.hooks.leaveApp(); this.hooks.state().story.view = 'room'; this.hooks.save(); this.render(); }
  toPhone() { this.hooks.leaveApp(); this.hooks.state().story.view = 'phone'; this.phonePage = 'home'; this.hooks.save(); this.render(); }
  toGame() { this.hooks.state().story.view = 'game'; this.hooks.save(); this.render(); }
  render() {
    const s = this.hooks.state();
    if (s.story.view === 'menu') {
      document.body.dataset.world = 'menu';
      this.layer.hidden = true;
      this.lastKey = '';
      return;
    }
    const before = JSON.stringify([s.story.pending, s.story.flags, s.story.fired, s.story.threads, s.story.read]);
    queueDueEvents(s);
    let progressed = syncThreads(s);
    if (s.story.guide === 0 && s.deliveries > 0) { s.story.guide = 1; progressed = true; }
    if (s.story.guide === 1 && s.story.read.some(id => ['maya','ibu'].includes(id))) { s.story.guide = 2; progressed = true; }
    if (progressed || before !== JSON.stringify([s.story.pending, s.story.flags, s.story.fired, s.story.threads, s.story.read])) this.hooks.save();
    const view = s.story.intro < 4 ? 'intro' : s.story.view;
    const block = pendingBlock(s);
    const showBlock = !!block && view !== 'intro';
    const notice = !showBlock ? pendingNotify(s) : undefined;
    document.body.dataset.world = showBlock ? (view === 'game' ? 'game' : 'room') : view;
    if (showBlock && block) {
      this.layer.hidden = false;
      const overlay = `<div class="event-scrim"><section class="event-card" role="dialog" aria-modal="true" aria-labelledby="event-title"><span class="event-kicker">HARI ${String(s.day).padStart(2,'0')} · ${clockTime(s)}</span><h2 id="event-title">${block.title}</h2><p>${block.body}</p><button type="button" class="event-ack" data-story="ack-event" data-event="${block.id}">Mengerti</button></section></div>`;
      const key = JSON.stringify(['block', block.id, s.story.pending, s.day, s.minutes, view]);
      if (key !== this.lastKey) { this.lastKey = key; this.layer.innerHTML = overlay; }
      return;
    }
    this.layer.hidden = view === 'game';
    if(view==='phone'&&this.phonePage==='ojol'&&this.layer.querySelector('#phone-app'))return;
    const key = JSON.stringify([view, s.story.intro, s.story.guide, s.story.read, s.story.threads, s.story.pending, s.story.flags, s.story.fired, this.phonePage, this.treeBranch, s.cash, s.spins, s.deliveries, s.turns, s.day, s.minutes, s.upgrades.stamina, s.upgrades.efficient, s.ended, s.familyDebt, s.totalWon, s.cascadeUnlocked, s.loan?.balance, s.job?.step, s.upgrades, totalDebt(s)]);
    if (key === this.lastKey) return; this.lastKey = key;
    if (view === 'game') { requestAnimationFrame(() => window.dispatchEvent(new Event('resize'))); return; }
    if (view === 'intro') {
      const p = PANELS[s.story.intro];
      this.layer.innerHTML = `<div class="prologue"><header><b>BESOK LUNAS<span>PROLOG</span></b><button data-story="skip">Lewati prolog ↗</button></header><article class="comic-frame" key="${s.story.intro}"><div class="comic-art panel-${s.story.intro}" role="img" aria-label="${['Bima makan bersama istri dan anaknya', 'Bima mendampingi ayah dan ibunya', 'Bima menatap tagihan dan dompet kosong', 'Cahaya ponsel menerangi wajah Bima'][s.story.intro]}"></div><div class="comic-lines" aria-hidden="true"></div><div class="comic-quote">${p.voice}</div><div class="comic-caption"><span>${p.chapter}</span><h1>${p.title}</h1><p>${p.text}</p></div></article><footer><div class="comic-dots">${PANELS.map((_,i)=>`<i class="${i === s.story.intro ? 'active' : ''}"></i>`).join('')}</div><button data-story="previous" ${s.story.intro === 0 ? 'disabled' : ''}>← Kembali</button><button class="comic-next" data-story="next">${s.story.intro === 3 ? 'MASUK KE KAMAR' : 'LANJUT'} →</button></footer></div>`; return;
    }
    const previousScroll=this.layer.querySelector('.phone-content')?.scrollTop??0;
    const tip=s.story.guide===0?['01 · MULAI DARI SINI','Angkat ponselmu.','Buka aplikasi Ojol untuk mencari uang pertama.']:s.story.guide===1?['02 · ADA PESAN MASUK','Maya menunggumu.','Buka ponsel, lalu baca pesan dari rumah.']:s.story.guide===2?['03 · JANJI DI LAYAR','Satu layar. Banyak pilihan.','Aplikasi Judol sudah bisa dibuka dari ponsel.']:['KAMAR 07 · KAMPUNG REJEKI','Hari ini, kita usahakan lagi.','Kerja, rencana, dan kabar dari rumah. Semuanya di ponselmu.'];
    const noticeHtml = notice ? `<aside class="event-notice" role="status"><span>${notice.title}</span><p>${notice.body}</p><button type="button" data-story="dismiss-event" data-event="${notice.id}">Tutup</button></aside>` : '';
    this.layer.innerHTML=`<div class="world-shell world-v05" ${view==='phone'?'inert':''}><header class="world-header"><div class="world-brand">BESOK <strong>LUNAS!</strong></div><div class="home-chapter"><span>SEBUAH CERITA TENTANG BESOK</span><b>Hari ${String(s.day).padStart(2,'0')} · ${clockTime(s)}</b></div><div class="world-wallet"><small>UANG DI TANGAN</small><b>${rp(s.cash)}</b></div><button data-story="system" type="button">Menu</button><button data-story="replay" aria-label="Putar ulang prolog">Prolog ↺</button></header><div class="room-stage"><div class="room-art"></div><div class="room-title"><span>${tip[0]}</span><h1>${tip[1]}</h1><p>${tip[2]}</p></div>${noticeHtml}<button class="phone-object desk-phone ${s.story.guide<3?'guided':''}" data-story="phone" aria-label="Angkat ponsel Bima"><span class="phone-beacon"></span><b>ANGKAT PONSEL <i>↗</i></b><small>${unreadCount(s)} pesan · ${s.job?'shift belum selesai':'Ojol sudah online'}</small></button><div class="room-caption"><span>“Pelan-pelan juga sampai.”</span><small>KAMAR BIMA · ${s.runs===1?'AWAL PERJALANAN':'NASIB KE-'+s.runs}</small></div></div><div class="home-below">${dayBar(s)}<div class="home-obligation"><span>YANG MASIH DIPERJUANGKAN<b>${rp(s.familyDebt)}</b></span><p>Untuk Bapak, Ibu, Maya,<br>dan masa depan Naya.</p><button data-story="restart">Ulang Nasib ↗</button></div></div></div>${view==='phone'?this.phone(s):''}`;
    if(this.phonePage==='tree'){const content=this.layer.querySelector('.phone-content');if(content)content.scrollTop=previousScroll;}
  }
  private phone(s: State): string {
    const threads = listedThreads(s);
    const selected = threads.find(thread => thread.id === this.phonePage);
    const beats = selected ? unlockedBeats(selected, s) : [];
    let content = '';
    if(this.phonePage==='ojol')content=`<div class="ojol-app-header"><span>OJOL<span class="online-dot"></span></span><small>KAMPUNG REJEKI</small></div><div id="phone-app">${this.appHTML}</div>`;
    else if(this.phonePage==='tree')content=renderTree(s,this.treeBranch);
    else if (this.phonePage === 'messages') content = `<div class="phone-page-title"><span>YANG BELUM DIBALAS</span><h2>Pesan</h2></div><div class="message-list">${threads.map(thread=>{const open=unlockedBeats(thread,s);return `<button class="${s.story.guide===1&&thread.id==='maya'?'guide-target':''}" data-story="message" data-message="${thread.id}"><i>${thread.avatar}</i><span><b>${thread.from}</b><small>${open[open.length-1].preview}</small></span>${s.story.read.includes(thread.id) ? '' : '<em></em>'}</button>`;}).join('')}</div>`;
    else if (selected) content = `<button class="phone-back" data-story="messages">← Semua pesan</button><div class="phone-page-title"><span>PERCAKAPAN</span><h2>${selected.from}</h2></div><div class="message-thread">${beats.map(beat=>`<div class="message-beat"><p class="message-bubble">${beat.text}</p><p class="message-narration">${beat.reply}</p></div>`).join('')}</div><button class="phone-cta ${s.story.guide===2?'guide-target':''}" data-story="home">Kembali ke aplikasi →</button>`;
    else content=`<div class="phone-wallpaper"><span>HARI ${String(s.day).padStart(2,'0')} · KAMPUNG REJEKI</span><h2>${clockTime(s)}</h2><p>Masih ada yang bisa diusahakan.</p></div><div class="phone-balance"><small>SALDO BIMA</small><b>${rp(s.cash)}</b></div><div class="phone-app-grid"><button class="${s.story.guide===0?'guide-target':''}" data-story="work"><i class="app-art app-art-4"></i><b>Ojol</b><small>${s.job?'Lanjut shift':'Cari orderan'}</small></button><button class="${s.story.guide===1?'guide-target':''}" data-story="messages"><i class="app-messages">▤<em>${threads.filter(thread=>!s.story.read.includes(thread.id)).length}</em></i><b>Pesan</b><small>Dari rumah</small></button><button class="${s.story.guide===2?'guide-target':''}" data-story="judol" ${s.story.guide<2?'disabled':''}><i class="app-art app-art-3"></i><b>Judol</b><small>Janji cepat kaya</small></button><button data-story="shop"><i class="app-art app-art-5"></i><b>Rencana</b><small>Pohon upgrade</small></button><button data-story="finance"><i class="app-art app-art-2"></i><b>Pinjol</b><small>${s.loan?'Hari '+s.loan.due:'Cair Kilat'}</small></button><button data-story="finale"><i class="app-finale">✧</i><b>Terakhir</b><small>${finaleReady(s)?'Sudah terbuka':s.spins+'/100 spin'}</small></button></div><div class="phone-family-note"><span>ALASAN KAMU PULANG</span><p>“Kalau belum ada, bilang saja.<br>Kita pikirkan bareng.”</p><small>Maya · Rumah</small></div>`;
    const guide=this.phonePage==='ojol'||this.phonePage==='tree'?'':s.story.guide===0?'<b>01 · PENGHASILAN PERTAMA</b>Tekan aplikasi Ojol yang disorot.':s.story.guide===1?`<b>02 · PESAN DARI RUMAH</b>${this.phonePage==='messages'?'Tekan percakapan Maya yang disorot.':'Tekan aplikasi Pesan yang disorot.'}`:s.story.guide===2?`<b>03 · JANJI DI LAYAR</b>${selected?'Kembali ke aplikasi, lalu buka Judol.':'Tekan aplikasi Judol yang disorot.'}`:'';
    return `<div class="phone-scrim"><section class="smartphone phone-v05 ${this.phonePage==='tree'?'tree-phone':''} ${this.phonePage==='ojol'?'rider-phone':''}" role="dialog" aria-modal="true" aria-label="Ponsel Bima"><div class="phone-status"><b>${clockTime(s)}</b><i></i><span>▰ 62%</span></div><button class="phone-close" data-story="room" aria-label="Letakkan ponsel">×</button><div class="phone-content">${guide?`<div class="guide-callout">${guide}</div>`:''}${content}</div><footer><button data-story="home">⌂ <span>Aplikasi</span></button><button data-story="system">☰ <span>Menu</span></button><button data-story="room">↓ <span>Letakkan</span></button></footer></section></div>`;

  }
}
