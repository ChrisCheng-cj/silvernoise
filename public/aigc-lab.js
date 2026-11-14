const lab=document.querySelector('#aigc-lab');
if(lab){
 const stage=lab.querySelector('.aigc-stage'),stack=lab.querySelector('.aigc-stack'),caption=lab.querySelector('.aigc-caption');
 const originals=[...stack.querySelectorAll('.aigc-card')],reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const modes=document.createElement('div');modes.className='aigc-modes';modes.setAttribute('role','group');modes.setAttribute('aria-label','图片展示模式');
 let mode='Flat',selected=0,phase=0,dragPhase=0,frame=0;
 const hint=document.createElement('p');hint.className='aigc-hint';hint.textContent='SCROLL / DRAG TO EXPLORE';stage.append(modes,hint);
 const thumbs=document.createElement('div');thumbs.className='aigc-thumbs';thumbs.setAttribute('aria-label','选择图片');stage.append(thumbs);
 const cards=[...originals];
 const intro=document.createElement('div');intro.className='aigc-intro';intro.innerHTML='<img src="/assets/aigc/lab-logo.png" alt="AIGC LAB"><p>这里是我的AI实验室<br>这些都是我用AI创建的作品</p>';stage.append(intro);
 stack.setAttribute('aria-label','AIGC图片展示，支持拖动和方向键');
 const states=cards.map(()=>({x:0,y:0,s:.05,ry:0,o:0}));
 for(const name of ['Flat','Tilt','Ring','Gallery']){const button=document.createElement('button');button.type='button';button.textContent=name;button.addEventListener('click',()=>setMode(name));modes.append(button);}
 originals.forEach((card,i)=>{const button=document.createElement('button');button.type='button';button.setAttribute('aria-label',card.dataset.title);const img=card.querySelector('img').cloneNode();img.alt='';button.append(img);button.addEventListener('click',()=>{selected=i;sync();animate();});thumbs.append(button);});
 function sync(){stage.dataset.mode=mode;intro.hidden=mode==='Ring';[...modes.children].forEach(b=>b.setAttribute('aria-pressed',String(b.textContent===mode)));thumbs.hidden=mode!=='Gallery';[...thumbs.children].forEach((b,i)=>b.setAttribute('aria-pressed',String(i===selected)));caption.textContent=`${String(selected+1).padStart(2,'0')} — ${String(originals.length).padStart(2,'0')}`;}
 function setMode(value){mode=value;sync();animate();}
 function dimensions(w,h){
  const density=Math.min(1.2,Math.sqrt(6/cards.length));
  const size=Math.min(w*.17,h*.25/1.414,290)*density;
  const galleryScale=Math.min(w/900,h/590,1.35)*1.8;
  const galleryY=stage.clientHeight/2+30-stack.offsetTop-h/2;
  return {size,rx:Math.min(w*.32,(w-size)/2-20),ry:h*.29,galleryScale,galleryY};
 }
 function target(i,w,h){
  const a=i/cards.length*Math.PI*2+phase-Math.PI/2;
  const {size,rx,ry,galleryScale,galleryY}=dimensions(w,h);
  if(mode==='Flat')return {x:Math.cos(a)*rx,y:Math.sin(a)*ry,s:size/100,ry:0,o:1};
  if(mode==='Ring'){const x=Math.cos(a)*rx,y=Math.sin(a)*h*.20;return{x:x*.92-y*.25,y:x*.18+y*.85,s:size/100*(.85+.25*(Math.sin(a)+1)/2),ry:Math.cos(a)*20,o:1};}
  if(mode==='Tilt'){const depth=(Math.sin(a)+1)/2;return {x:Math.cos(a)*rx,y:Math.sin(a)*h*.18+h*.08,s:size/100*(.95+.4*depth),ry:-Math.cos(a)*25,o:1};}
  const delta=(i-selected+originals.length*1.5)%originals.length-originals.length*.5;
  return{x:delta*Math.min(w*.25,280),y:galleryY,s:galleryScale*(delta===0?1:1.5/1.8),ry:0,o:Math.abs(delta)<=2?1:0};
 }
 function render(){frame=0;const w=stack.clientWidth,h=stack.clientHeight;let moving=false;
  const {galleryScale,galleryY}=dimensions(w,h),galleryCenter=stack.offsetTop+h/2+galleryY;
  intro.style.top=mode==='Gallery'?(galleryCenter-galleryScale*141.4/2-79)+'px':mode==='Tilt'?(stack.offsetTop+h*.08)+'px':'';
  thumbs.style.top=(galleryCenter+galleryScale*141.4/2+24)+'px';thumbs.style.bottom='auto';
  cards.forEach((card,i)=>{const t=target(i,w,h),s=states[i];for(const key of ['x','y','s','ry','o']){const d=t[key]-s[key];s[key]+=reduced.matches?d:d*.16;if(Math.abs(d)>.015)moving=true;}
   card.style.transform=`translate(-50%,-50%) translate3d(${s.x}px,${s.y}px,0) perspective(900px) rotateY(${s.ry}deg) scale(${s.s})`;card.style.opacity=s.o;card.style.zIndex=String(Math.round(s.s*100));card.style.pointerEvents=t.o>.3?'auto':'none';card.inert=t.o<.3;card.tabIndex=i<originals.length&&t.o>.3?0:-1;
  });if(moving)frame=requestAnimationFrame(render);
 }
 function animate(){if(!frame)frame=requestAnimationFrame(render);}
 function scroll(){const top=parseFloat(getComputedStyle(stage).top)||0;const p=Math.max(0,Math.min(1,(top-lab.getBoundingClientRect().top)/Math.max(1,lab.offsetHeight-stage.offsetHeight)));phase=(reduced.matches?0:p*Math.PI*2)+dragPhase;animate();}
 let start=null,moved=false,suppressClick=false;
 stack.addEventListener('pointerdown',e=>{if(e.button!==0)return;start={x:e.clientX,y:e.clientY,phase:dragPhase};moved=false;});
 addEventListener('pointermove',e=>{if(!start)return;const dx=e.clientX-start.x;if(Math.abs(dx)>8)moved=true;if(!moved)return;dragPhase=start.phase+dx/stack.clientWidth*Math.PI*2;scroll();});
 addEventListener('pointerup',e=>{if(!start)return;if(moved){suppressClick=true;if(mode==='Gallery'){selected=(selected+(e.clientX<start.x?1:originals.length-1))%originals.length;sync();animate();}setTimeout(()=>suppressClick=false,0);}start=null;});
 addEventListener('pointercancel',()=>{start=null;});
 cards.forEach((card,i)=>{card.addEventListener('click',()=>{if(suppressClick)return;selected=i%originals.length;setMode('Gallery');});card.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();selected=(selected+(e.key==='ArrowRight'?1:originals.length-1))%originals.length;if(mode==='Gallery'){sync();animate();}else{dragPhase+=(e.key==='ArrowRight'?1:-1)*Math.PI/9;scroll();}});});
 addEventListener('scroll',scroll,{passive:true});addEventListener('resize',scroll);reduced.addEventListener('change',scroll);sync();scroll();
}
