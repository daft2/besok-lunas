import {type State, jobStep, moveLane, jobReward, ROAD_LENGTH} from './engine';
import './rider-v05.css';

type Particle = {x:number;y:number;vx:number;vy:number;life:number;color:string};
/** The saved route owns outcomes. Animation never draws another random route. */
export class RiderGame {
  private frame=0; private elapsed=0; private last=0; private paused=true; private dead=false;
  private touchX=0; private touchY=0; private reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches; private waveMs=1800; private visualLane=1; private travel=0; private flash=0;
  private particles:Particle[]=[]; private feedback='Ambil order. Cari celah. Pulang bawa hasil.';
  private canvas:HTMLCanvasElement; private ctx:CanvasRenderingContext2D;
  private atlas=new Image(); private road=new Image();
  constructor(private host:HTMLElement,private state:()=>State,private save:()=>void,private finished:(cash:number,orders:number,hits:number)=>void){
    this.host.classList.add('rider-v05');
    this.host.innerHTML=`<div class="rider-hud"><span><small>PERJALANAN</small><b id="ride-distance"></b></span><span><small>ORDER TAMBAHAN</small><b id="ride-orders"></b></span><span><small>BENTURAN</small><b id="ride-hits"></b></span></div><div class="ride-progress"><i id="ride-progress-fill"></i></div><div class="road-wrap"><canvas id="road" width="420" height="600" role="img" aria-label="Jalan tiga lajur. Hindari kendaraan dan ambil tas order kuning menggunakan tombol lajur di bawah."></canvas><div class="road-overlay" id="ride-overlay"><div class="ride-badge">OJOL · KAMPUNG REJEKI</div><b id="ride-ready">SIAP NARIK?</b><span>Ambil tas order kuning.<br>Hindari kendaraan & pembatas.</span><div class="ride-how"><strong>← &nbsp; PINDAH LAJUR &nbsp; →</strong><span>Geser jalan, tap lajur, atau pakai A / D.</span></div><button class="primary-button green" id="ride-go">GAS, CARI ORDER →</button></div><div class="ride-feedback" id="ride-feedback" role="status"></div><div class="ride-road-label">KAMPUNG REJEKI <span>● LIVE</span></div></div><div class="lane-controls" aria-label="Pilih lajur">${['KIRI','TENGAH','KANAN'].map((l,i)=>`<button data-lane="${i}" aria-label="Lajur ${l.toLowerCase()}">${['←','↑','→'][i]} <span>${l}</span></button>`).join('')}</div><div class="ride-footer"><div><small>PENDAPATAN BERSIH</small><b id="ride-earnings"></b></div><button id="ride-pause" aria-label="Jeda perjalanan">Ⅱ Jeda</button></div><small class="ride-save">Bensin sudah dipotong. Pendapatan masuk saat sampai.</small>`;
    this.canvas=host.querySelector('canvas')!;this.ctx=this.canvas.getContext('2d')!;
    this.visualLane=this.state().job?.lane??1;
    this.atlas.src='/assets/ojol-atlas.png';this.road.src='/assets/road-v05.png';
    this.host.addEventListener('click',this.click);this.canvas.addEventListener('pointerdown',this.pointerStart);this.canvas.addEventListener('pointerup',this.pointerEnd);
    document.addEventListener('keydown',this.key);document.addEventListener('visibilitychange',this.visibility);
    this.setPause(true);this.update();this.frame=requestAnimationFrame(this.tick);
  }
  private click=(e:Event)=>{const b=(e.target as HTMLElement).closest<HTMLButtonElement>('button');if(!b)return;if(b.dataset.lane!==undefined)this.lane(Number(b.dataset.lane));if(b.id==='ride-go')this.setPause(false);if(b.id==='ride-pause')this.setPause(!this.paused);};
  private key=(e:KeyboardEvent)=>{if(e.repeat||this.dead)return;const k=e.key.toLowerCase(),j=this.state().job;if(!j)return;if(['arrowleft','a','arrowright','d'].includes(k)){e.preventDefault();this.lane(Math.max(0,Math.min(2,j.lane+(['a','arrowleft'].includes(k)?-1:1))));}if(k==='p'){e.preventDefault();this.setPause(!this.paused);}};
  private pointerStart=(e:PointerEvent)=>{this.touchX=e.clientX;this.touchY=e.clientY;this.canvas.setPointerCapture(e.pointerId);};
  private pointerEnd=(e:PointerEvent)=>{const dx=e.clientX-this.touchX,dy=e.clientY-this.touchY,j=this.state().job;if(!j)return;
    if(Math.abs(dx)>20&&Math.abs(dx)>Math.abs(dy))this.lane(Math.max(0,Math.min(2,j.lane+(dx>0?1:-1))));
    else if(Math.abs(dx)<=20&&Math.abs(dy)<=20){const rect=this.canvas.getBoundingClientRect(),x=(e.clientX-rect.left)/rect.width*420;this.lane(Math.max(0,Math.min(2,Math.floor((x-54)/104))));}
  };
  private visibility=()=>{if(document.hidden)this.setPause(true);};
  private lane(n:number){if(moveLane(this.state(),n)){this.save();this.update();}}
  private setPause(value:boolean){this.paused=value;this.last=0;this.host.querySelector<HTMLElement>('#ride-overlay')!.hidden=!value;this.host.querySelector('#ride-ready')!.textContent=this.elapsed||this.state().job?.step?'TARIK NAPAS DULU.':'SIAP NARIK?';this.host.querySelector('#ride-go')!.textContent=this.elapsed||this.state().job?.step?'LANJUT NARIK →':'GAS, CARI ORDER →';this.host.querySelector('#ride-pause')!.textContent=value?'▶ Lanjut':'Ⅱ Jeda';this.host.querySelector('#ride-pause')!.setAttribute('aria-label',value?'Lanjut perjalanan':'Jeda perjalanan');}
  private update(){const j=this.state().job;if(!j)return;
    this.host.querySelector('#ride-distance')!.textContent=`${j.step}/${ROAD_LENGTH}`;this.host.querySelector('#ride-orders')!.textContent=String(j.orders);this.host.querySelector('#ride-hits')!.textContent=String(j.hits);
    this.host.querySelector('#ride-earnings')!.textContent=`Rp${jobReward(j).toLocaleString('id-ID')}`;
    this.host.querySelector<HTMLElement>('#ride-progress-fill')!.style.width=`${j.step/ROAD_LENGTH*100}%`;
    this.host.querySelector('#ride-feedback')!.textContent=j.step===0?'01 · Tas di tengah. Tetap di lajur tengah.':j.step===1?'02 · Pembatas di tengah! Pindah ke kiri atau kanan.':this.feedback;
    this.host.querySelectorAll<HTMLButtonElement>('[data-lane]').forEach(b=>{b.classList.toggle('selected',Number(b.dataset.lane)===j.lane);b.setAttribute('aria-pressed',String(Number(b.dataset.lane)===j.lane));});
  }
  private burst(hit:boolean,lane:number){this.flash=hit&&!this.reducedMotion?1:0;for(let i=0;i<18;i++){const a=i*Math.PI*2/18;this.particles.push({x:106+lane*104,y:493,vx:Math.cos(a)*75,vy:Math.sin(a)*75-45,life:1,color:hit?(i%2?'#ff9362':'#ffe4a3'):(i%2?'#fbd569':'#baff8e')});}this.host.querySelector('#ride-feedback')!.classList.toggle('is-hit',hit);}
  private tick=(time:number)=>{if(this.dead)return;const dt=this.last?Math.min(100,time-this.last):0;this.last=time;
    if(!this.paused){this.elapsed+=dt;this.travel+=dt*.12;const j=this.state().job;this.waveMs=j&&j.step<2?3000:1800;
      if(j&&this.elapsed>=this.waveMs){this.elapsed=0;const hits=j.hits,orders=j.orders,before=jobReward(j);jobStep(this.state());this.save();const delta=jobReward(j)-before;
        this.feedback=j.hits>hits?`Aduh! Perbaikan −Rp${Math.abs(delta).toLocaleString('id-ID')}.`:j.orders>orders?`Order masuk! +Rp${delta.toLocaleString('id-ID')}.`:'Lajur aman. Tetap fokus.';
        if(j.hits>hits||j.orders>orders)this.burst(j.hits>hits,j.lane);
        if(!this.state().job){const reward=jobReward(j);this.destroy();this.finished(reward,j.orders,j.hits);return;}this.update();
      }
      const targetLane=this.state().job?.lane??this.visualLane;this.visualLane+=(targetLane-this.visualLane)*Math.min(1,dt/85);
      this.flash=Math.max(0,this.flash-dt/450);this.particles.forEach(p=>{p.life-=dt/650;p.x+=p.vx*dt/1000;p.y+=p.vy*dt/1000;});this.particles=this.particles.filter(p=>p.life>0);
    }else this.visualLane=this.state().job?.lane??this.visualLane;
    this.draw();this.frame=requestAnimationFrame(this.tick);
  };
  private sprite(cell:number,x:number,y:number,size:number){const c=this.ctx,a=this.atlas;if(!a.complete||!a.naturalWidth)return false;const rects=[[150,100,240,440],[615,75,305,455],[1120,65,290,480],[50,670,435,250],[615,635,310,295],[1120,650,315,285]];const [sx,sy,sw,sh]=rects[cell],scale=size/Math.max(sw,sh);c.save();c.globalCompositeOperation='multiply';c.drawImage(a,sx,sy,sw,sh,x-sw*scale/2,y-sh*scale/2,sw*scale,sh*scale);c.restore();return true;}
  private draw(){const c=this.ctx,j=this.state().job;if(!j)return;c.clearRect(0,0,420,600);c.save();if(this.flash)c.translate(Math.sin(this.flash*40)*this.flash*5,0);
    c.fillStyle='#779070';c.fillRect(0,0,420,600);
    if(this.road.complete&&this.road.naturalWidth){const sh=420*this.road.naturalHeight/this.road.naturalWidth,off=this.travel%sh;for(let y=off-sh;y<600;y+=sh)c.drawImage(this.road,0,y,420,sh);}
    else{for(let i=-1;i<7;i++){const y=i*120+this.travel%120;c.fillStyle=i%2?'#dca45d':'#ad7551';c.fillRect(0,y,45,93);c.fillRect(379,y+22,41,91);c.fillStyle='#36544e';c.fillRect(8,y+16,22,38);c.fillRect(388,y+44,22,33);c.fillStyle='#426748';c.beginPath();c.arc(17,y+102,24,0,7);c.arc(409,y+10,28,0,7);c.fill();}}
    // A stable playable surface keeps collision lanes legible over the illustrated scenery.
    c.fillStyle='#acb3a7';c.fillRect(48,0,324,600);c.fillStyle='#203a37';c.fillRect(44,0,6,600);c.fillRect(370,0,6,600);c.fillStyle='#dcc58e';c.fillRect(51,0,3,600);c.fillRect(366,0,3,600);
    c.strokeStyle='#faf0d7cc';c.lineWidth=3;c.setLineDash([28,31]);c.lineDashOffset=-this.travel;for(const x of [158,262]){c.beginPath();c.moveTo(x,0);c.lineTo(x,600);c.stroke();}c.setLineDash([]);
    for(let i=0;i<6;i++){const y=(i*137+this.travel*.85)%650;c.strokeStyle='#2b414044';c.lineWidth=2;c.beginPath();c.moveTo(63+(i%3)*104,y);c.lineTo(87+(i%3)*104,y+13);c.stroke();}
    const row=j.rows[j.step],y=-80+this.elapsed/this.waveMs*578;
    for(const lane of row.obstacles){const x=106+lane*104;const cell=j.step===1?3:1+(j.step+lane)%2;this.shadow(x,y+(cell===3?13:20),cell===3?43:29,cell===3?13:38);if(!this.sprite(cell,x,y,110)){c.fillStyle='#ea8653';c.strokeStyle='#162e2d';c.lineWidth=5;c.beginPath();c.roundRect(x-28,y-43,56,86,13);c.fill();c.stroke();c.fillStyle='#243e49';c.fillRect(x-21,y-25,42,28);}}
    if(row.order!==null){const x=106+row.order*104;c.fillStyle='#fbd56922';c.beginPath();c.arc(x,y,39+Math.sin(this.travel*.04)*3,0,7);c.fill();if(!this.sprite(j.step%4===3?5:4,x,y,88)){c.fillStyle='#ffd56c';c.strokeStyle='#283c2d';c.lineWidth=5;c.beginPath();c.roundRect(x-23,y-25,46,49,7);c.fill();c.stroke();c.fillStyle='#344d37';c.font='bold 30px sans-serif';c.textAlign='center';c.fillText('+',x,y+10);}}
    const x=106+this.visualLane*104;this.shadow(x,523,27,18);c.save();c.translate(x,493);c.rotate((j.lane-this.visualLane)*.11);
    if(!this.sprite(0,0,0,112)){c.fillStyle='#172e2d';c.fillRect(-10,-20,20,68);c.fillStyle='#48b773';c.strokeStyle='#122d2b';c.lineWidth=5;c.beginPath();c.roundRect(-22,-18,44,47,13);c.fill();c.stroke();c.beginPath();c.arc(0,-25,21,0,7);c.fill();c.stroke();}c.restore();
    this.particles.forEach(p=>{c.globalAlpha=p.life;c.fillStyle=p.color;c.save();c.translate(p.x,p.y);c.rotate(p.life*5);c.fillRect(-3,-3,6,6);c.restore();});c.globalAlpha=1;
    const shade=c.createLinearGradient(0,0,0,130);shade.addColorStop(0,'#102923aa');shade.addColorStop(1,'#10292300');c.fillStyle=shade;c.fillRect(0,0,420,130);
    if(this.flash){c.fillStyle=`rgba(239,100,69,${this.flash*.16})`;c.fillRect(0,0,420,600);}c.restore();
  }
  private shadow(x:number,y:number,rx:number,ry:number){this.ctx.fillStyle='#13292466';this.ctx.beginPath();this.ctx.ellipse(x+3,y+5,rx,ry,0,0,Math.PI*2);this.ctx.fill();}
  destroy(){this.dead=true;cancelAnimationFrame(this.frame);this.host.removeEventListener('click',this.click);document.removeEventListener('keydown',this.key);document.removeEventListener('visibilitychange',this.visibility);this.canvas.removeEventListener('pointerdown',this.pointerStart);this.canvas.removeEventListener('pointerup',this.pointerEnd);}
}
