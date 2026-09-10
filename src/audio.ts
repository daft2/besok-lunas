export class GameAudio {
  private ctx?: AudioContext;
  muted = false;
  unlock() { if (!this.ctx) this.ctx = new AudioContext(); if (this.ctx.state === 'suspended') void this.ctx.resume(); }
  play(kind: 'spin' | 'stop' | 'win' | 'buy' | 'error') {
    if (this.muted || !this.ctx) return;
    const notes = kind === 'win' ? [523, 659, 784, 1047] : kind === 'buy' ? [440, 660] : kind === 'spin' ? [180, 240] : kind === 'stop' ? [340] : [120, 90];
    notes.forEach((hz, i) => {
      const osc = this.ctx!.createOscillator(), gain = this.ctx!.createGain();
      const t = this.ctx!.currentTime + i * .075;
      osc.type = kind === 'stop' ? 'triangle' : 'sine'; osc.frequency.setValueAtTime(hz, t);
      gain.gain.setValueAtTime(0, t); gain.gain.linearRampToValueAtTime(.045, t + .006); gain.gain.exponentialRampToValueAtTime(.001, t + .12);
      osc.connect(gain).connect(this.ctx!.destination); osc.start(t); osc.stop(t + .13);
    });
  }
}
