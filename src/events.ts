import type { EventRow, State } from './engine';

export const EVENTS: EventRow[] = [
  {
    id: 'kos-bill',
    interrupt: 'block',
    flags: [],
    once: true,
    title: 'Kos belum lunas.',
    body: 'Cicilan kos sudah ditagih. Judol menunggu sampai kamu bereskan ini dulu.',
    when: s => s.bill > 0,
  },
  {
    id: 'pinjol-due',
    interrupt: 'block',
    flags: [],
    once: true,
    title: 'Pinjol jatuh tempo.',
    body: 'Hari ini batasnya. Mesin dan shift menunggu sampai pinjaman ini diselesaikan.',
    when: s => !!s.loan && s.day >= s.loan.due,
  },
  {
    id: 'ibu-missed',
    interrupt: 'notify',
    flags: ['ibu-unanswered'],
    once: true,
    thread: 'ibu',
    title: 'Ibu masih menunggu.',
    body: 'Tiga shift selesai. Pesan Ibu belum dibuka.',
    when: s => s.deliveries >= 3 && !s.story.read.includes('ibu'),
  },
  {
    id: 'doni-win',
    interrupt: 'notify',
    flags: ['doni-streak'],
    once: true,
    thread: 'doni',
    title: 'Doni melihat streak-mu.',
    body: 'Receh beruntun. Dia sudah kirim komentar.',
    when: s => s.winStreak >= 3,
  },
  {
    id: 'maya-session',
    interrupt: 'notify',
    flags: ['maya-session'],
    once: true,
    thread: 'maya',
    title: 'Maya perhatikan jam.',
    body: 'Sesi Judol ini sudah panjang. Ada pesan dari rumah.',
    when: s => s.spins >= 8 && s.minutes >= 160,
  },
  {
    id: 'naya-night',
    interrupt: 'notify',
    flags: ['naya-night'],
    once: true,
    thread: 'naya',
    title: 'Malam sudah masuk.',
    body: 'Naya nanya ayah pulang malam ini.',
    when: s => s.minutes >= 480,
  },
];

export function eventById(id: string): EventRow | undefined {
  return EVENTS.find(row => row.id === id);
}

export function dueEvents(state: State): EventRow[] {
  return EVENTS.filter(row => {
    if (row.once !== false && (state.story.fired.includes(row.id) || state.story.pending.includes(row.id))) return false;
    return !!row.when && row.when(state);
  });
}

export function pendingByInterrupt(state: State, interrupt: 'notify' | 'block'): EventRow | undefined {
  for (const id of state.story.pending) {
    const row = eventById(id);
    if (row?.interrupt === interrupt) return row;
  }
}

export const pendingBlock = (state: State) => pendingByInterrupt(state, 'block');
export const pendingNotify = (state: State) => pendingByInterrupt(state, 'notify');
export const hasBlockingEvent = (state: State) => pendingBlock(state) !== undefined;
