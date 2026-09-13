import {type State, aabb, jobHit, jobCollect, jobAdvance, jobReward, moveLane, ROAD_LENGTH, type HitBox} from './engine';
import './rider-v05.css';

type Particle = {x:number;y:number;vx:number;vy:number;life:number;color:string};
interface Entity {
  kind: 'obstacle' | 'order';
  lane: 0 | 1 | 2;
  y: number;
  w: number;
  h: number;
  resolved: boolean;
}
type LiveEntity = Entity & { row: number; cell: number };
type RowGate = { row: number; y: number };

const LANE_X = [106, 210, 314] as const;
const RIDER_Y = 493;
const RIDER_SIZE = 112;
const OBSTACLE_SIZE = 110;
const ORDER_SIZE = 88;
const SPAWN_Y = -70;
const TEACH_GAP = 300;
const ROW_GAP = 220;
const TEACH_SPEED = 0.12;
const SPEED = 0.24;
const ATLAS = [
  [130, 65, 305, 515],
  [585, 55, 350, 505],
  [1090, 35, 335, 535],
  [45, 645, 455, 285],
  [580, 605, 370, 335],
  [1080, 640, 375, 300],
] as const;

function drawnSize(cell: number, size: number) {
  const [, , sw, sh] = ATLAS[cell];
  const scale = size / Math.max(sw, sh);
  return { w: sw * scale, h: sh * scale };
}
function knockWhite(data: Uint8ClampedArray, w: number, h: number) {
  const at = (x: number, y: number) => (y * w + x) * 4;
  const bg = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return false;
    const i = at(x, y);
    return data[i + 3] !== 0 && data[i] > 245 && data[i + 1] > 245 && data[i + 2] > 245;
  };
  const stack: number[] = [];
  const push = (x: number, y: number) => {
    if (!bg(x, y)) return;
    data[at(x, y) + 3] = 0;
    stack.push(x, y);
  };
  for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
  for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }
  while (stack.length) {
    const y = stack.pop()!;
    const x = stack.pop()!;
    push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
  }
}
function laneOf(n: number): 0 | 1 | 2 | null {
  if (n === 0 || n === 1 || n === 2) return n;
  return null;
}

export class RiderGame {
  private frame=0; private last=0; private paused=true; private dead=false;
  private touchX=0; private touchY=0; private visualLane=1; private travel=0; private flash=0;
  private particles:Particle[]=[]; private feedback='Ambil order. Cari celah. Pulang bawa hasil.';
  private canvas:HTMLCanvasElement; private ctx:CanvasRenderingContext2D;
  private atlas=new Image(); private road=new Image();
  private entities:LiveEntity[]=[]; private gates:RowGate[]=[];
  private sheets:(HTMLCanvasElement|null)[]=ATLAS.map(()=>null);
  private hitbox=new URLSearchParams(location.search).get('hitbox')==='1';
  constructor(private host:HTMLElement,private state:()=>State,private save:()=>void,private finished:(cash:number,orders:number,hits:number)=>void){
    this.host.classList.add('rider-v05');
    this.host.innerHTML=`<div class="rider-hud"><span><small>PERJALANAN</small><b id="ride-distance"></b></span><span><small>ORDER TAMBAHAN</small><b id="ride-orders"></b></span><span><small>BENTURAN</small><b id="ride-hits"></b></span></div><div class="ride-progress"><i id="ride-progress-fill"></i></div><div class="road-wrap"><canvas id="road" width="420" height="600" role="img" aria-label="Jalan tiga lajur. Hindari kendaraan dan ambil tas order kuning menggunakan tombol lajur di bawah."></canvas><div class="road-overlay" id="ride-overlay"><div class="ride-badge">OJOL · KAMPUNG REJEKI</div><b id="ride-ready">SIAP NARIK?</b><span>Ambil tas order kuning.<br>Hindari kendaraan & pembatas.</span><div class="ride-how"><strong>← &nbsp; PINDAH LAJUR &nbsp; →</strong><span>Geser jalan, tap lajur, atau pakai A / D.</span></div><button class="primary-button green" id="ride-go">GAS, CARI ORDER →</button></div><div class="ride-feedback" id="ride-feedback" role="status"></div><div class="ride-road-label">KAMPUNG REJEKI <span>● LIVE</span></div></div><div class="lane-controls" aria-label="Pilih lajur">${['KIRI','TENGAH','KANAN'].map((l,i)=>`<button data-lane="${i}" aria-label="Lajur ${l.toLowerCase()}">${['←','↑','→'][i]} <span>${l}</span></button>`).join('')}</div><div class="ride-footer"><div><small>PENDAPATAN BERSIH</small><b id="ride-earnings"></b></div><button id="ride-pause" aria-label="Jeda perjalanan">Ⅱ Jeda</button></div><small class="ride-save">Bensin sudah dipotong. Pendapatan masuk saat sampai.</small>`;
    this.canvas=host.querySelector('canvas')!;this.ctx=this.canvas.getContext('2d')!;
    this.visualLane=this.state().job?.lane??1;
    // v1 road art is safe to use as a background. The existing atlas keeps
    // sprites isolated; keep the generated paper-sheet reference in assets.md
    // until it is exported with transparent cells.
    this.atlas.src='/assets/ojol-atlas.webp';this.road.src='/assets/road-lineart-v1.jpg';
    this.host.addEventListener('click',this.click);this.canvas.addEventListener('pointerdown',this.pointerStart);this.canvas.addEventListener('pointerup',this.pointerEnd);
    document.addEventListener('keydown',this.key);document.addEventListener('visibilitychange',this.visibility);
    this.rebuild();this.setPause(true);this.update();this.frame=requestAnimationFrame(this.tick);
  }
  pause(){if(!this.dead)this.setPause(true);}
  private live(){return !this.dead && document.body.dataset.shell==='playing';}
  private click=(e:Event)=>{if(!this.live())return;const b=(e.target as HTMLElement).closest<HTMLButtonElement>('button');if(!b)return;if(b.dataset.lane!==undefined)this.lane(Number(b.dataset.lane));if(b.id==='ride-go')this.setPause(false);if(b.id==='ride-pause')this.setPause(!this.paused);};
  private key=(e:KeyboardEvent)=>{if(e.repeat||!this.live())return;const k=e.key.toLowerCase(),j=this.state().job;if(!j)return;if(['arrowleft','a','arrowright','d'].includes(k)){e.preventDefault();this.lane(Math.max(0,Math.min(2,j.lane+(['a','arrowleft'].includes(k)?-1:1))));}if(k==='p'){e.preventDefault();this.setPause(!this.paused);}};
  private pointerStart=(e:PointerEvent)=>{if(!this.live())return;this.touchX=e.clientX;this.touchY=e.clientY;this.canvas.setPointerCapture(e.pointerId);};
  private pointerEnd=(e:PointerEvent)=>{if(!this.live())return;const dx=e.clientX-this.touchX,dy=e.clientY-this.touchY,j=this.state().job;if(!j)return;
    if(Math.abs(dx)>20&&Math.abs(dx)>Math.abs(dy))this.lane(Math.max(0,Math.min(2,j.lane+(dx>0?1:-1))));
    else if(Math.abs(dx)<=20&&Math.abs(dy)<=20){const rect=this.canvas.getBoundingClientRect(),x=(e.clientX-rect.left)/rect.width*420;this.lane(Math.max(0,Math.min(2,Math.floor((x-54)/104))));}
  };
  private visibility=()=>{if(document.hidden)this.setPause(true);};
  private lane(n:number){const before=this.state().job?.lane;if(moveLane(this.state(),n)){this.feedback=before===n?'Tetap di lajur ini.':`Pindah ke lajur ${['kiri','tengah','kanan'][n]}.`;this.save();this.update();this.host.classList.remove('lane-change');void this.host.offsetWidth;this.host.classList.add('lane-change');}}
  private setPause(value:boolean){this.paused=value;this.last=0;this.host.classList.toggle('is-paused',value);this.host.querySelector<HTMLElement>('#ride-overlay')!.hidden=!value;this.host.querySelector('#ride-ready')!.textContent=this.travel||this.state().job?.step?'TARIK NAPAS DULU.':'SIAP NARIK?';this.host.querySelector('#ride-go')!.textContent=this.travel||this.state().job?.step?'LANJUT NARIK →':'GAS, CARI ORDER →';this.host.querySelector('#ride-pause')!.textContent=value?'▶ Lanjut':'Ⅱ Jeda';this.host.querySelector('#ride-pause')!.setAttribute('aria-label',value?'Lanjut perjalanan':'Jeda perjalanan');}
  private update(){const j=this.state().job;if(!j)return;
    this.host.querySelector('#ride-distance')!.textContent=`${j.step}/${ROAD_LENGTH}`;this.host.querySelector('#ride-orders')!.textContent=String(j.orders);this.host.querySelector('#ride-hits')!.textContent=String(j.hits);
    this.host.querySelector('#ride-earnings')!.textContent=`Rp${jobReward(j).toLocaleString('id-ID')}`;
    this.host.querySelector<HTMLElement>('#ride-progress-fill')!.style.width=`${j.step/ROAD_LENGTH*100}%`;
    this.host.querySelector('#ride-feedback')!.textContent=j.step===0?'01 · Tas di tengah. Tetap di lajur tengah.':j.step===1?'02 · Pembatas di tengah! Pindah ke kiri atau kanan.':this.feedback;
    this.host.querySelectorAll<HTMLButtonElement>('[data-lane]').forEach(b=>{b.classList.toggle('selected',Number(b.dataset.lane)===j.lane);b.setAttribute('aria-pressed',String(Number(b.dataset.lane)===j.lane));});
  }
  private burst(hit:boolean,lane:number){this.flash=hit&&document.documentElement.dataset.reducedMotion!=='true'?1:0;for(let i=0;i<18;i++){const a=i*Math.PI*2/18;this.particles.push({x:LANE_X[lane],y:RIDER_Y,vx:Math.cos(a)*75,vy:Math.sin(a)*75-45,life:1,color:hit?(i%2?'#ff9362':'#ffe4a3'):(i%2?'#fbd569':'#baff8e')});}this.host.querySelector('#ride-feedback')!.classList.toggle('is-hit',hit);}
  private rebuild(){
    const j=this.state().job;
    this.entities=[];this.gates=[];
    if(!j)return;
    let y=SPAWN_Y;
    for(let row=j.step;row<ROAD_LENGTH;row++){
      this.gates.push({row,y});
      const cellOrder=row%4===3?5:4;
      for(const raw of j.rows[row].obstacles){
        const lane=laneOf(raw);if(lane===null)continue;
        const cell=row===1?3:1+(row+lane)%2;
        const size=drawnSize(cell,OBSTACLE_SIZE);
        this.entities.push({kind:'obstacle',lane,y,w:size.w,h:size.h,resolved:false,row,cell});
      }
      const orderLane=laneOf(j.rows[row].order??-1);
      if(orderLane!==null){
        const size=drawnSize(cellOrder,ORDER_SIZE);
        this.entities.push({kind:'order',lane:orderLane,y,w:size.w,h:size.h,resolved:false,row,cell:cellOrder});
      }
      y-=row<2?TEACH_GAP:ROW_GAP;
    }
  }
  private riderBox():HitBox{
    const size=drawnSize(0,RIDER_SIZE);
    const x=LANE_X[0]+(LANE_X[2]-LANE_X[0])*(this.visualLane/2);
    return {x:x-size.w/2,y:RIDER_Y-size.h/2,w:size.w,h:size.h};
  }
  private entityBox(e:LiveEntity):HitBox{
    return {x:LANE_X[e.lane]-e.w/2,y:e.y-e.h/2,w:e.w,h:e.h};
  }
  private settle(rider:HitBox){
    const s=this.state();
    const j=s.job;
    if(!j)return;
    const hits=j.hits,orders=j.orders,step0=j.step,before=jobReward(j);
    let scored=false;
    for(const e of this.entities){
      if(e.resolved||!s.job)continue;
      const box=this.entityBox(e);
      const overlap=aabb(rider,box);
      const passed=e.y-e.h/2>rider.y+rider.h;
      if(!overlap&&!passed)continue;
      e.resolved=true;
      if(overlap&&e.row===s.job.step){
        if(e.kind==='obstacle'&&s.job.hits<=s.job.step){jobHit(s);scored=true;}
        else if(e.kind==='order'&&s.job.orders<=s.job.step){jobCollect(s);scored=true;}
      }
    }
    while(s.job){
      const row=s.job.step;
      const ents=this.entities.filter(e=>e.row===row);
      const pending=ents.some(e=>!e.resolved);
      if(scored){jobAdvance(s);scored=false;continue;}
      if(pending)break;
      if(ents.length===0){
        const gate=this.gates.find(g=>g.row===row);
        if(!gate||gate.y<=rider.y+rider.h)break;
      }
      jobAdvance(s);
    }
    if(!s.job){
      this.save();
      this.destroy();
      this.finished(jobReward(j),j.orders,j.hits);
      return;
    }
    if(j.hits>hits||j.orders>orders){
      const delta=jobReward(j)-before;
      this.feedback=j.hits>hits?`Aduh! Perbaikan −Rp${Math.abs(delta).toLocaleString('id-ID')}.`:`Order masuk! +Rp${delta.toLocaleString('id-ID')}.`;
      const lane=this.entities.find(e=>e.resolved&&((e.kind==='obstacle'&&j.hits>hits)||(e.kind==='order'&&j.orders>orders)))?.lane??j.lane;
      this.burst(j.hits>hits,lane);
    }else if(j.step>step0&&j.step>=2){
      this.feedback='Lajur aman. Tetap fokus.';
    }
    if(j.hits!==hits||j.orders!==orders||j.step!==step0){this.save();this.update();}
  }
  private tick=(time:number)=>{if(this.dead)return;const raw=this.last?time-this.last:0;const dt=raw>0?Math.min(100,raw):0;this.last=time;
    if(!this.paused){
      const j=this.state().job;
      const speed=j&&j.step<2?TEACH_SPEED:SPEED;
      this.travel+=dt*speed;
      for(const g of this.gates)g.y+=dt*speed;
      for(const e of this.entities)e.y+=dt*speed;
      const targetLane=j?.lane??this.visualLane;this.visualLane+=(targetLane-this.visualLane)*Math.min(1,dt/85);
      this.flash=Math.max(0,this.flash-dt/450);this.particles.forEach(p=>{p.life-=dt/650;p.x+=p.vx*dt/1000;p.y+=p.vy*dt/1000;});this.particles=this.particles.filter(p=>p.life>0);
      if(j)this.settle(this.riderBox());
      if(this.dead)return;
    }else this.visualLane=this.state().job?.lane??this.visualLane;
    this.draw();this.frame=requestAnimationFrame(this.tick);
  };
  private sheet(cell:number){
    const cached=this.sheets[cell];if(cached)return cached;
    const a=this.atlas;if(!a.complete||!a.naturalWidth)return null;
    const [sx,sy,sw,sh]=ATLAS[cell];
    const off=document.createElement('canvas');off.width=sw;off.height=sh;
    const c=off.getContext('2d')!;c.drawImage(a,sx,sy,sw,sh,0,0,sw,sh);
    const img=c.getImageData(0,0,sw,sh);knockWhite(img.data,sw,sh);c.putImageData(img,0,0);
    this.sheets[cell]=off;return off;
  }
  private sprite(cell:number,x:number,y:number,size:number){
    const sheet=this.sheet(cell);if(!sheet)return false;
    const [, , sw, sh]=ATLAS[cell],scale=size/Math.max(sw,sh);
    this.ctx.drawImage(sheet,x-sw*scale/2,y-sh*scale/2,sw*scale,sh*scale);return true;
  }
  private draw(){const c=this.ctx,j=this.state().job;if(!j)return;c.clearRect(0,0,420,600);c.save();if(this.flash)c.translate(Math.sin(this.flash*40)*this.flash*5,0);
    c.fillStyle='#779070';c.fillRect(0,0,420,600);
    if(this.road.complete&&this.road.naturalWidth){const sh=420*this.road.naturalHeight/this.road.naturalWidth,off=this.travel%sh;for(let y=off-sh;y<600;y+=sh)c.drawImage(this.road,0,y,420,sh);}
    else{for(let i=-1;i<7;i++){const y=i*120+this.travel%120;c.fillStyle=i%2?'#dca45d':'#ad7551';c.fillRect(0,y,45,93);c.fillRect(379,y+22,41,91);c.fillStyle='#36544e';c.fillRect(8,y+16,22,38);c.fillRect(388,y+44,22,33);c.fillStyle='#426748';c.beginPath();c.arc(17,y+102,24,0,7);c.arc(409,y+10,28,0,7);c.fill();}}
    c.strokeStyle='#faf0d7cc';c.lineWidth=3;c.setLineDash([28,31]);c.lineDashOffset=-this.travel;for(const x of [158,262]){c.beginPath();c.moveTo(x,0);c.lineTo(x,600);c.stroke();}c.setLineDash([]);
    for(let i=0;i<6;i++){const y=(i*137+this.travel*.85)%650;c.strokeStyle='#2b414044';c.lineWidth=2;c.beginPath();c.moveTo(63+(i%3)*104,y);c.lineTo(87+(i%3)*104,y+13);c.stroke();}
    for(const e of this.entities){
      if(e.y>720||e.y<-200)continue;
      const x=LANE_X[e.lane];
      if(e.kind==='obstacle'){
        this.shadow(x,e.y+(e.cell===3?13:20),e.cell===3?43:29,e.cell===3?13:38);
        if(!this.sprite(e.cell,x,e.y,OBSTACLE_SIZE)){c.fillStyle='#ea8653';c.strokeStyle='#162e2d';c.lineWidth=5;c.beginPath();c.roundRect(x-e.w/2,e.y-e.h/2,e.w,e.h,13);c.fill();c.stroke();c.fillStyle='#243e49';c.fillRect(x-e.w*0.38,e.y-e.h*0.28,e.w*0.76,e.h*0.32);}
      }else{
        c.fillStyle='#fbd56922';c.beginPath();c.arc(x,e.y,39+Math.sin(this.travel*.04)*3,0,7);c.fill();
        if(!this.sprite(e.cell,x,e.y,ORDER_SIZE)){c.fillStyle='#ffd56c';c.strokeStyle='#283c2d';c.lineWidth=5;c.beginPath();c.roundRect(x-e.w/2,e.y-e.h/2,e.w,e.h,7);c.fill();c.stroke();c.fillStyle='#344d37';c.font='bold 30px sans-serif';c.textAlign='center';c.fillText('+',x,e.y+10);}
      }
      if(this.hitbox){c.strokeStyle=e.kind==='order'?'#2f7a3a':'#c23b2a';c.lineWidth=2;c.strokeRect(x-e.w/2,e.y-e.h/2,e.w,e.h);}
    }
    const x=LANE_X[0]+(LANE_X[2]-LANE_X[0])*(this.visualLane/2);this.shadow(x,523,27,18);c.save();c.translate(x,RIDER_Y);c.rotate((j.lane-this.visualLane)*.11);
    if(!this.sprite(0,0,0,RIDER_SIZE)){c.fillStyle='#172e2d';c.fillRect(-10,-20,20,68);c.fillStyle='#48b773';c.strokeStyle='#122d2b';c.lineWidth=5;c.beginPath();c.roundRect(-22,-18,44,47,13);c.fill();c.stroke();c.beginPath();c.arc(0,-25,21,0,7);c.fill();c.stroke();}c.restore();
    if(this.hitbox){const box=this.riderBox();c.strokeStyle='#7ad0ff';c.lineWidth=2;c.strokeRect(box.x,box.y,box.w,box.h);}
    this.particles.forEach(p=>{c.globalAlpha=p.life;c.fillStyle=p.color;c.save();c.translate(p.x,p.y);c.rotate(p.life*5);c.fillRect(-3,-3,6,6);c.restore();});c.globalAlpha=1;
    const shade=c.createLinearGradient(0,0,0,130);shade.addColorStop(0,'#102923aa');shade.addColorStop(1,'#10292300');c.fillStyle=shade;c.fillRect(0,0,420,130);
    if(this.flash){c.fillStyle=`rgba(239,100,69,${this.flash*.16})`;c.fillRect(0,0,420,600);}c.restore();
  }
  private shadow(x:number,y:number,rx:number,ry:number){this.ctx.fillStyle='#13292466';this.ctx.beginPath();this.ctx.ellipse(x+3,y+5,rx,ry,0,0,Math.PI*2);this.ctx.fill();}
  destroy(){this.dead=true;cancelAnimationFrame(this.frame);this.host.removeEventListener('click',this.click);document.removeEventListener('keydown',this.key);document.removeEventListener('visibilitychange',this.visibility);this.canvas.removeEventListener('pointerdown',this.pointerStart);this.canvas.removeEventListener('pointerup',this.pointerEnd);}
}
