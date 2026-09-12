import Phaser from 'phaser';
import type { Grid, MachineId, SpinResult } from './engine';

interface ReelArt { key: string; count: number; cols: number; cell: number; frame: number; bg: number; }
// Per-machine sprite sheets. Frames are centered crops; margins stay clear of
// atlas edges so packed-artifact seams never show on the reels.
const ART: ReelArt[] = [
  { key: 'symbols', count: 6, cols: 3, cell: 512, frame: 416, bg: 0xfff0ce },
  { key: 'symbols', count: 6, cols: 3, cell: 512, frame: 416, bg: 0xfff0ce },
  { key: 'symbols', count: 6, cols: 3, cell: 512, frame: 416, bg: 0xfff0ce },
  { key: 'buah', count: 8, cols: 4, cell: 720, frame: 680, bg: 0xfff0ce },
  { key: 'petir', count: 8, cols: 4, cell: 512, frame: 380, bg: 0xf8d094 },
];

export class ReelScene extends Phaser.Scene {
  private icons: Phaser.GameObjects.Image[][] = [];
  private rolling = [false, false, false];
  private tick = 0;
  private line!: Phaser.GameObjects.Graphics;
  private shades!: Phaser.GameObjects.Graphics;
  private readyCallback: (scene: ReelScene) => void;
  private initial: Grid;
  private mode = 0;
  private machine: MachineId = 0;
  private last: Grid;
  private rowY(row: number) { return this.mode ? 55 + row * 110 : -10 + row * 175; }
  private iconSize() { return this.mode ? 104 : 175; }
  private get reduce() { return document.documentElement.dataset.reducedMotion === 'true'; }
  private art() { return ART[this.machine]; }
  constructor(grid: Grid, machine: MachineId, ready: (s: ReelScene) => void) { super('Reels'); this.initial = grid; this.machine = machine; this.last = grid; this.readyCallback = ready; }
  preload() {
    // The current Receh atlas already has clean cell backgrounds and matches
    // the line-art direction. Keep the generated paper-sheet reference in
    // assets.md until it is exported with transparent cells.
    this.load.image('symbols', '/assets/symbols-v2.webp');
    this.load.image('buah', '/assets/buah-atlas.webp');
    this.load.image('petir', '/assets/petir-atlas.webp');
  }
  create() {
    for (const art of ART) {
      const texture = this.textures.get(art.key);
      if ((texture.frames as Record<number, unknown>)[art.count - 1]) continue;
      const source = texture.getSourceImage() as HTMLImageElement;
      const margin = (art.cell - art.frame) / 2;
      for (let i = 0; i < art.count; i++) texture.add(i, 0, i % art.cols * art.cell + margin, Math.floor(i / art.cols) * art.cell + margin, art.frame, art.frame);
    }
    this.cameras.main.setBackgroundColor('#fff0ce');
    const g = this.add.graphics();
    g.fillStyle(0xb8a17d, .32); g.fillRect(196, 0, 6, 330); g.fillRect(396, 0, 6, 330);
    const art0 = this.art();
    for (let col = 0; col < 3; col++) {
      this.icons[col] = [];
      for (let row = 0; row < 3; row++) {
        const frame = Math.min(this.initial[col][row], art0.count - 1);
        this.icons[col][row] = this.add.image(100 + col * 200, this.rowY(row), art0.key, frame).setDisplaySize(this.iconSize(), this.iconSize());
      }
    }
    this.shades = this.add.graphics(); this.line = this.add.graphics(); this.setMode(this.machine === 0 ? 0 : 1);
    this.readyCallback(this);
  }
  setMachine(machine: MachineId) {
    this.machine = machine;
    this.setMode(machine === 0 ? 0 : 1);
    this.display(this.last);
  }
  setMode(mode: number) {
    this.mode = mode;
    const art = this.art();
    this.icons.forEach(col => col.forEach((img, row) => { this.tweens.killTweensOf(img); img.setTexture(art.key).setY(this.rowY(row)).setDisplaySize(this.iconSize(), this.iconSize()); }));
    this.cameras.main.setBackgroundColor(art.bg === 0xfff0ce ? '#fff0ce' : '#f8d094');
    this.shades.clear();
    if (!mode) {
      this.shades.fillStyle(0x3d263a, .62); this.shades.fillRect(0, 0, 600, 77); this.shades.fillRect(0, 253, 600, 77);
    }
    this.line.clear(); this.line.lineStyle(3, 0xffc94e, .9);
    this.line.strokeRect(3, mode ? 111 : 79, 594, mode ? 108 : 172);
    if (mode) { this.line.lineStyle(2, 0xffc94e, .5); this.line.strokeRect(3, 1, 594, 108); this.line.strokeRect(3, 221, 594, 108); }
  }
  display(grid: Grid) {
    this.last = grid;
    const art = this.art();
    this.icons.forEach((col, x) => col.forEach((img, y) => { this.tweens.killTweensOf(img); img.setTexture(art.key, grid[x][y]).setY(this.rowY(y)).setAlpha(1).setDisplaySize(this.iconSize(), this.iconSize()); }));
  }
  update(_time: number, delta: number) {
    this.tick += delta;
    const max = this.art().count - 1;
    this.icons.forEach((col, x) => {
      if (!this.rolling[x]) return;
      col.forEach(img => {
        if (this.reduce) { if (this.tick > 100) img.setFrame(Phaser.Math.Between(0, max)); return; }
        img.y += delta * 1.45;
        if (img.y > (this.mode ? 385 : 427)) { img.y -= this.mode ? 330 : 525; img.setFrame(Phaser.Math.Between(0, max)); }
      });
    });
    if (this.tick > 100) this.tick = 0;
  }
  animate(result: SpinResult, speed: number, onStop: () => void, onCascade: (factor: number) => void = () => {}): Promise<void> {
    this.icons.forEach(col => col.forEach(img => this.tweens.killTweensOf(img)));
    const first = result.cascades[0]?.grid ?? result.grid;
    const duration = this.reduce ? 160 : 650 * (1 - speed * .25);
    const stagger = this.reduce ? 40 : 160;
    const lastCol = [0, 1, 2].filter(x => x !== result.held).at(-1) ?? 0;
    return new Promise(resolve => {
      this.icons.forEach((col, x) => {
        if (x === result.held) return;
        this.rolling[x] = true; col.forEach(img => img.setAlpha(.78));
        this.time.delayedCall(duration + x * stagger, () => {
          this.rolling[x] = false;
          col.forEach((img, y) => {
            img.setFrame(first[x][y]).setAlpha(1).setY(this.rowY(y) - (this.reduce ? 0 : 13));
            this.tweens.add({ targets: img, y: this.rowY(y), duration: this.reduce ? 0 : 180, ease: 'Back.easeOut' });
          });
          if (x === lastCol) onStop();
        });
      });
      this.time.delayedCall(duration + lastCol * stagger, async () => {
        if (result.cascades.length) {
          for (let i = 0; i < result.cascades.length; i++) {
            const step = result.cascades[i]; this.display(step.grid); onCascade(step.factor);
            if (step.wins.length) this.celebrate({ ...result, wins: step.wins });
            await new Promise<void>(done => this.time.delayedCall(this.reduce ? 120 : 480, done));
            if (i < result.cascades.length - 1) {
              for (const w of step.wins) for (const [cx, cy] of w.cells ?? w.columns.map(x => [x, w.row] as [number, number])) this.icons[cx][cy].setAlpha(.12);
              await new Promise<void>(done => this.time.delayedCall(this.reduce ? 30 : 180, done));
            }
          }
          this.display(result.grid);
        } else {
          this.display(result.grid);
          if (result.payout || result.bonus) this.celebrate(result);
        }
        resolve();
      });
    });
  }
  private celebrate(result: SpinResult) {
    for (const win of result.wins) for (const [x, y] of win.cells ?? win.columns.map(cx => [cx, win.row] as [number, number])) {
      const img = this.icons[x]?.[y];
      if (!img) continue;
      if (!this.reduce) this.tweens.add({ targets: img, displayWidth: this.iconSize() * 1.08, displayHeight: this.iconSize() * 1.08, duration: 180, yoyo: true, repeat: 1, ease: 'Sine.easeInOut' });
    }
    if (this.reduce) return;
    for (let i = 0; i < 18; i++) {
      const coin = this.add.circle(300, 165, Phaser.Math.Between(3, 7), i % 2 ? 0xffca50 : 0xfff4c0).setStrokeStyle(2, 0x5c3e21);
      this.tweens.add({ targets: coin, x: Phaser.Math.Between(20, 580), y: Phaser.Math.Between(-40, 330), alpha: 0, duration: Phaser.Math.Between(500, 950), ease: 'Cubic.easeOut', onComplete: () => coin.destroy() });
    }
  }
}
export function createReels(grid: Grid, machine: MachineId, ready: (scene: ReelScene) => void) {
  return new Phaser.Game({ type: Phaser.AUTO, parent: 'reels', width: 600, height: 330,
    transparent: false, backgroundColor: '#fff0ce', antialias: true,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: new ReelScene(grid, machine, ready), audio: { noAudio: true },
    fps: { target: 60, forceSetTimeOut: false },
  });
}
