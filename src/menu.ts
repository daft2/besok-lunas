import './menu.css';
import { fresh, wrapState, motionReduced, type SaveBank, type SaveSettings, type SlotIndex, type State } from './engine';

export type ShellPhase = 'title' | 'load' | 'options' | 'playing' | 'system';

export function emptyBank(settings?: SaveSettings): SaveBank {
  return { version: 6, activeSlot: 0, slots: [null, null, null], settings: settings ?? { muted: false, reducedMotion: false } };
}

export function hasSave(bank: SaveBank): boolean {
  return bank.slots.some(slot => slot !== null);
}

export function firstEmptySlot(bank: SaveBank): SlotIndex | null {
  const index = bank.slots.findIndex(slot => slot === null);
  if (index === 0 || index === 1 || index === 2) return index;
  return null;
}

export function applyReducedMotion(settings: SaveSettings): void {
  if (typeof document === 'undefined') return;
  if (motionReduced(settings)) document.documentElement.dataset.reducedMotion = 'true';
  else delete document.documentElement.dataset.reducedMotion;
}

export function menuState(bank: SaveBank): State {
  const state = fresh();
  state.story.view = 'menu';
  state.muted = bank.settings.muted;
  return state;
}

const money = (n: number) => 'Rp' + Math.round(n).toLocaleString('id-ID');

export interface ShellHooks {
  bank: () => SaveBank;
  state: () => State;
  setBank: (bank: SaveBank) => void;
  setState: (state: State) => void;
  persist: () => void;
  persistRun: () => void;
  applyAudio: () => void;
  enterPlay: () => void;
  leavePlay: () => void;
  lockedModal: () => boolean;
  rideOverlayOpen: () => boolean;
  pauseRide: () => void;
  notice: (text: string) => void;
}

export class GameShell {
  phase: ShellPhase = 'title';
  private host: HTMLElement;
  private confirmSlot: SlotIndex | null = null;
  private optionsFrom: ShellPhase = 'title';
  private loadFrom: ShellPhase = 'title';

  constructor(private hooks: ShellHooks) {
    this.host = document.createElement('section');
    this.host.id = 'shell-menu';
    this.host.setAttribute('role', 'dialog');
    this.host.setAttribute('aria-modal', 'true');
    this.host.setAttribute('aria-label', 'Menu');
    document.body.append(this.host);
    document.addEventListener('click', this.click);
    document.addEventListener('keydown', this.key, true);
    applyReducedMotion(this.hooks.bank().settings);
    if (typeof matchMedia === 'function') {
      matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', () => applyReducedMotion(this.hooks.bank().settings));
    }
  }

  get inRun(): boolean {
    if (this.phase === 'playing' || this.phase === 'system') return true;
    if (this.phase === 'load') return this.loadFrom === 'system';
    if (this.phase === 'options') return this.optionsFrom === 'system';
    return false;
  }

  boot() {
    this.phase = 'title';
    this.confirmSlot = null;
    this.hooks.state().story.view = 'menu';
    this.paint();
  }

  handleEscape(): boolean {
    if (this.confirmSlot !== null) {
      this.confirmSlot = null;
      this.paint();
      return true;
    }
    if (this.phase === 'load') {
      this.phase = this.loadFrom === 'playing' ? 'system' : this.loadFrom;
      this.syncMenuView();
      this.paint();
      return true;
    }
    if (this.phase === 'options') {
      this.phase = this.optionsFrom === 'playing' ? 'system' : this.optionsFrom;
      this.syncMenuView();
      this.paint();
      return true;
    }
    if (this.phase === 'system') {
      this.closeSystem();
      return true;
    }
    if (this.phase === 'playing') {
      if (this.hooks.lockedModal()) return false;
      if (this.hooks.rideOverlayOpen()) return true;
      this.openSystem();
      return true;
    }
    return this.phase === 'title';
  }

  openSystem() {
    if (this.phase !== 'playing') return;
    if (this.hooks.lockedModal()) return;
    if (this.hooks.rideOverlayOpen()) return;
    this.hooks.pauseRide();
    this.phase = 'system';
    this.paint();
  }

  private syncMenuView() {
    if (this.phase === 'title' || (this.phase === 'load' && this.loadFrom === 'title') || (this.phase === 'options' && this.optionsFrom === 'title')) {
      this.hooks.state().story.view = 'menu';
    }
  }

  private closeSystem() {
    this.phase = 'playing';
    this.confirmSlot = null;
    this.paint();
  }

  private click = (e: Event) => {
    const button = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-shell]');
    if (!button || button.disabled) return;
    switch (button.dataset.shell) {
      case 'start': this.start(); break;
      case 'continue': this.continueRun(); break;
      case 'load': this.showLoad(); break;
      case 'options': this.showOptions(); break;
      case 'back': this.handleEscape(); break;
      case 'slot': {
        const slot = Number(button.dataset.slot);
        if (slot === 0 || slot === 1 || slot === 2) this.loadSlot(slot);
        break;
      }
      case 'overwrite-yes': this.confirmNew(); break;
      case 'overwrite-no': this.confirmSlot = null; this.paint(); break;
      case 'mute': this.toggleMute(); break;
      case 'motion': this.toggleMotion(); break;
      case 'save': this.hooks.persistRun(); this.hooks.notice('Tersimpan di slot ini.'); break;
      case 'title': this.returnToTitle(); break;
      case 'close': this.closeSystem(); break;
      case 'system': this.openSystem(); break;
    }
  };

  private key = (e: KeyboardEvent) => {
    if (e.key !== 'Escape' || e.repeat) return;
    if (!this.handleEscape()) return;
    e.preventDefault();
    e.stopImmediatePropagation();
  };

  private start() {
    const bank = this.hooks.bank();
    const empty = firstEmptySlot(bank);
    if (empty !== null) { this.beginNew(empty); return; }
    this.confirmSlot = bank.activeSlot;
    this.paint();
  }

  private confirmNew() {
    if (this.confirmSlot === null) return;
    this.beginNew(this.confirmSlot);
  }

  private beginNew(slot: SlotIndex) {
    const bank = this.hooks.bank();
    const next = fresh();
    next.muted = bank.settings.muted;
    if (!hasSave(bank)) this.hooks.setBank(wrapState(next, bank.settings));
    else { bank.slots[slot] = next; bank.activeSlot = slot; }
    this.confirmSlot = null;
    this.hooks.setState(next);
    this.phase = 'playing';
    this.hooks.persistRun();
    this.hooks.enterPlay();
    this.paint();
  }

  private continueRun() {
    const bank = this.hooks.bank();
    const filled = bank.slots[bank.activeSlot] ?? bank.slots.find(slot => slot !== null);
    if (!filled) return;
    this.enterSlot(bank.slots.indexOf(filled) as SlotIndex);
  }

  private loadSlot(index: SlotIndex) {
    if (!this.hooks.bank().slots[index]) return;
    this.enterSlot(index);
  }

  private enterSlot(index: SlotIndex) {
    const bank = this.hooks.bank();
    const slot = bank.slots[index];
    if (!slot) return;
    bank.activeSlot = index;
    if (slot.story.view === 'menu') slot.story.view = 'room';
    slot.muted = bank.settings.muted;
    this.hooks.setState(slot);
    this.phase = 'playing';
    this.confirmSlot = null;
    this.hooks.persistRun();
    this.hooks.enterPlay();
    this.paint();
  }

  private showLoad() {
    this.loadFrom = this.phase === 'system' ? 'system' : 'title';
    this.phase = 'load';
    this.syncMenuView();
    this.paint();
  }

  private showOptions() {
    this.optionsFrom = this.phase === 'system' ? 'system' : 'title';
    this.phase = 'options';
    this.syncMenuView();
    this.paint();
  }

  private toggleMute() {
    const bank = this.hooks.bank();
    bank.settings.muted = !bank.settings.muted;
    this.hooks.state().muted = bank.settings.muted;
    this.hooks.applyAudio();
    this.hooks.persist();
    this.paint();
  }

  private toggleMotion() {
    const bank = this.hooks.bank();
    bank.settings.reducedMotion = !bank.settings.reducedMotion;
    applyReducedMotion(bank.settings);
    this.hooks.persist();
    this.paint();
  }

  private returnToTitle() {
    this.hooks.persistRun();
    this.hooks.setState(menuState(this.hooks.bank()));
    this.phase = 'title';
    this.confirmSlot = null;
    this.loadFrom = 'title';
    this.optionsFrom = 'title';
    this.hooks.leavePlay();
    this.paint();
  }

  paint() {
    document.body.dataset.shell = this.phase;
    this.host.hidden = this.phase === 'playing';
    if (this.host.hidden) return;
    const bank = this.hooks.bank();
    if (this.confirmSlot !== null) {
      const slot = bank.slots[this.confirmSlot];
      this.host.innerHTML = `<div class="shell-screen" id="menu-overwrite"><p class="shell-kicker">SLOT ${this.confirmSlot + 1}</p><h2>Timpa save ini?</h2><p>Hari ${slot?.day ?? 1} · ${money(slot?.cash ?? 0)} akan diganti run baru dari hari 1.</p><button data-shell="overwrite-yes" id="menu-overwrite-yes" class="shell-primary">Ya, mulai baru</button><button data-shell="overwrite-no" id="menu-overwrite-no" class="shell-ghost">Batal</button></div>`;
      return;
    }
    if (this.phase === 'load') {
      this.host.innerHTML = `<div class="shell-screen"><p class="shell-kicker">SIMPANAN</p><h2>Tiga slot.</h2><div class="shell-slots">${bank.slots.map((slot, i) => `<button data-shell="slot" data-slot="${i}" id="menu-slot-${i}" ${slot ? '' : 'disabled'}><b>Slot ${i + 1}</b><span>${slot ? `Hari ${slot.day} · ${money(slot.cash)}` : 'Kosong'}</span></button>`).join('')}</div><button data-shell="back" id="menu-back" class="shell-ghost">Kembali</button></div>`;
      return;
    }
    if (this.phase === 'options') {
      const muted = bank.settings.muted;
      const motion = bank.settings.reducedMotion;
      this.host.innerHTML = `<div class="shell-screen"><p class="shell-kicker">OPSI</p><h2>Suara dan gerak.</h2><button data-shell="mute" id="menu-mute" class="shell-toggle" aria-pressed="${muted}"><b>Senyap</b><span>${muted ? 'Nyala' : 'Mati'}</span></button><button data-shell="motion" id="menu-motion" class="shell-toggle" aria-pressed="${motion}"><b>Gerak berkurang</b><span>${motion ? 'Nyala' : 'Mati'}</span></button><button data-shell="back" id="menu-back" class="shell-ghost">Kembali</button></div>`;
      return;
    }
    if (this.phase === 'system') {
      this.host.innerHTML = `<div class="shell-screen shell-system"><p class="shell-kicker">MENU SISTEM</p><h2>Jeda sejenak.</h2><button data-shell="save" id="menu-save" class="shell-secondary">Simpan</button><button data-shell="load" id="menu-load-system" class="shell-secondary">Muat</button><button data-shell="options" id="menu-options-system" class="shell-secondary">Opsi</button><button data-shell="title" id="menu-title" class="shell-secondary">Ke judul</button><button data-shell="close" id="menu-resume" class="shell-primary">Tutup</button></div>`;
      return;
    }
    const saved = hasSave(bank);
    this.host.innerHTML = `<div class="shell-screen"><p class="shell-kicker">KAMAR 07 · KAMPUNG REJEKI</p><h1 class="shell-wordmark"><span>BESOK</span><strong>LUNAS<span>!</span></strong></h1><p class="shell-tag">SEKALI LAGI, PASTI BALIK.</p><div class="shell-actions"><button data-shell="start" id="menu-start" class="shell-primary">Mulai</button><button data-shell="continue" id="menu-continue" class="shell-secondary" ${saved ? '' : 'disabled'}>Lanjut</button><button data-shell="load" id="menu-load" class="shell-secondary">Muat</button><button data-shell="options" id="menu-options" class="shell-secondary">Opsi</button></div></div>`;
  }
}
