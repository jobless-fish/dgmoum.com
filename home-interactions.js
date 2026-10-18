import { OrbitMotion } from './orbit-motion.js';
(() => {
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 // Temporary labeled artwork; replace only these spans with supplied SVGs.
 const tools=[
 ['stamp-clean','배경 지우기','도장·서명','BG','#e3e9dc','#63805c'],
 ['pdf-merge','PDF 합치기','DOCUMENT','PDF','#f3e3dc','#ba7965'],
 ['image-compress','용량 줄이기','IMAGE','↓ MB','#e5def8','#8571bc'],
 ['form-resume','이력서 양식','RESUME','CV','#dfe9f3','#718cac'],
 ['photo-edit','사진보정 Pro','PHOTO STUDIO','RAW','#dfd9f5','#7e65b7',true],
 ['video-edit','컷편집 Pro','VIDEO STUDIO','▶','#e7dcf2','#986cba',true],
 ['image-convert','이미지 변환','CONVERT','JPG','#dcebe3','#6d9684'],
 ['qr-code','QR 코드','QUICK SHARE','QR','#e9e8d9','#97916c'],
 ['audio-edit','음원 편집','AUDIO STUDIO','WAV','#e1e4f5','#7e80b0',true],
 ['image-resize','크기 조절','RESIZE','↗↙','#f4e6da','#b88b6b'],
 ['pdf-split','PDF 나누기','DOCUMENT','1/2','#f1dfe5','#b77c90'],
 ['stamp-maker','도장 만들기','STAMP','印','#e6e2ee','#8d7a9e']];
 const orbit=document.querySelector('#tool-orbit'),pause=document.querySelector('#orbit-pause'),rail=document.querySelector('#app-rail'),track=document.querySelector('#app-track');
 const cards=tools.slice(0,10).map((t,i)=>{
  const a=document.createElement('a');a.href='/tools/'+t[0]+'/';a.className='orbit-card'+(t[6]?' is-pro':'');a.draggable=false;
  a.style.setProperty('--tile',t[4]);a.style.setProperty('--ink',t[5]);
  a.innerHTML=`${t[6]?'<span class="pro-dot">PRO</span>':''}<span class="placeholder-art" aria-hidden="true">${t[3]}</span><strong>${t[1]}</strong><small>${t[2]}</small>`;orbit.append(a);
  const y=1-2*(i+.5)/10,phi=i*Math.PI*(3-Math.sqrt(5));return {el:a,p:[Math.sqrt(1-y*y)*Math.cos(phi),y,Math.sqrt(1-y*y)*Math.sin(phi)]};
 });
 const motion=new OrbitMotion();
 let drag=null,paused=reduced.matches,inView=true,last=0,raf=0,suppress=false;
 function syncPause(){pause.textContent=paused?'자동 회전':'일시정지';pause.setAttribute('aria-pressed',String(paused));pause.setAttribute('aria-label',paused?'도구 자동 회전 시작':'도구 자동 회전 일시정지');}
 function render(){
  const radius=Math.min(orbit.clientWidth*.35,orbit.clientHeight*.36,205);
  cards.forEach(({el,p})=>{const [x,y,z]=motion.project(p),depth=(z+1)/2;
   el.style.transform='translate(-50%,-50%) translate('+x*radius+'px,'+y*radius+'px) scale('+(.58+depth*.43)+') rotate('+x*6+'deg)';
   el.style.opacity=String(.42+depth*.58);el.style.zIndex=String(Math.round(depth*100));
  });
 }
 function tick(now){raf=0;const dt=Math.min((now-last)/1000,.05);last=now;if(!drag&&!paused)motion.step(dt);render();if(inView&&!document.hidden&&!paused)raf=requestAnimationFrame(tick);}
 function start(){if(!raf&&inView&&!document.hidden&&!paused){last=performance.now();raf=requestAnimationFrame(tick);}}
 pause.onclick=()=>{paused=!paused;motion.resetSpeed();syncPause();start();};syncPause();
 reduced.addEventListener('change',()=>{paused=reduced.matches;motion.resetSpeed();syncPause();render();start();});
 new ResizeObserver(render).observe(orbit);
 new IntersectionObserver(([e])=>{inView=e.isIntersecting;if(inView)start();else if(raf){cancelAnimationFrame(raf);raf=0;}},{threshold:0}).observe(orbit);
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&raf){cancelAnimationFrame(raf);raf=0;}else start();});
 orbit.addEventListener('pointerdown',e=>{
  if(e.button!==0||drag)return;suppress=false;
  drag={id:e.pointerId,x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,time:e.timeStamp,vx:0,vy:0,moved:false};
 });
 orbit.addEventListener('pointermove',e=>{
  if(!drag||drag.id!==e.pointerId)return;
  if(!drag.moved&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<=5)return;
  if(!drag.moved)orbit.setPointerCapture(e.pointerId);
  drag.moved=true;orbit.classList.add('is-dragging');
  const dt=Math.max(.004,Math.min(.1,(e.timeStamp-drag.time)/1000));
  const [dx,dy]=motion.limit((e.clientX-drag.lastX)*.006,(e.clientY-drag.lastY)*.006,4*dt);
  motion.rotate(dx,dy);
  // Time-based smoothing avoids device-event-rate dependent flick speeds.
  const blend=1-Math.exp(-dt/.045);
  drag.vx+=(dx/dt-drag.vx)*blend;drag.vy+=(dy/dt-drag.vy)*blend;
  drag.lastX=e.clientX;drag.lastY=e.clientY;drag.time=e.timeStamp;render();
 });
 function release(e){
  if(!drag||e.pointerId!==drag.id)return;
  const moved=drag.moved,age=Math.max(0,(e.timeStamp-drag.time)/1000),fresh=Math.exp(-age/.12);
  if(moved&&!paused&&!reduced.matches&&e.type!=='pointercancel')motion.release(drag.vx*fresh,drag.vy*fresh);else motion.resetSpeed();
  suppress=moved;drag=null;orbit.classList.remove('is-dragging');
  if(orbit.hasPointerCapture(e.pointerId))orbit.releasePointerCapture(e.pointerId);
  start();setTimeout(()=>suppress=false,0);
 }
 orbit.addEventListener('pointerup',release);orbit.addEventListener('pointercancel',release);
 orbit.addEventListener('lostpointercapture',e=>{if(drag&&drag.id===e.pointerId){drag=null;motion.resetSpeed();orbit.classList.remove('is-dragging');start();}});
 orbit.addEventListener('click',e=>{if(suppress){e.preventDefault();e.stopPropagation();}},true);
 orbit.addEventListener('keydown',e=>{const d={ArrowLeft:[-.18,0],ArrowRight:[.18,0],ArrowUp:[0,-.13],ArrowDown:[0,.13]}[e.key];if(!d)return;e.preventDefault();motion.rotate(...d);motion.resetSpeed();render();});
 render();start();
 window.moumCatalog.then(data=>{let recent=[];try{recent=JSON.parse(localStorage.getItem('moum-recent')||'[]');}catch{}if(!Array.isArray(recent))return;recent=recent.slice(0,4).map(id=>data.find(t=>t.id===id)).filter(Boolean);if(recent.length){document.querySelector('#recent-strip').hidden=false;recent.forEach(t=>{const a=document.createElement('a');a.href='/tools/'+t.id+'/';a.textContent=t.name+' ↗';document.querySelector('#recent-links').append(a);});}});
})();
