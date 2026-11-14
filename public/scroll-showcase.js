const section = document.querySelector('#selected-works');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const clamp = value => Math.max(0, Math.min(1, value));
const mix = (a,b,t) => a+(b-a)*t;
const ease = t => t*t*(3-2*t);
if (section) {
  const stage=section.querySelector('.showcase-stage');
  const cards=[...stage.querySelectorAll('.showcase-card')];
  const intro=stage.querySelector('.showcase-intro-card');
  const copy=stage.querySelector('.showcase-copy');
  const folder=stage.querySelector('.showcase-folder');
  const originals=cards.map(card=>({href:card.getAttribute('href'),src:card.querySelector('img').getAttribute('src'),alt:card.querySelector('img').alt}));
  const tabs=[...folder.querySelectorAll('[data-folder]')];
  const gallery=folder.querySelector('#folder-gallery'),empty=folder.querySelector('.folder-empty');
  let active='commercial',personal=[],loadFailed=false;
  function chooseFolder(key){
    active=key;folder.dataset.active=key;
    tabs.forEach(tab=>{const selected=tab.dataset.folder===key;tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;});
    gallery.setAttribute('aria-labelledby','tab-'+key);
    const items=key==='commercial'?originals:personal;
    cards.forEach((card,i)=>{const item=items[i];card.hidden=!item;if(item){card.href=item.href;card.setAttribute('aria-label',item.alt);const img=card.querySelector('img');img.src=item.src;img.alt=item.alt;}});
    empty.hidden=key!=='personal'||items.length>0;
    empty.textContent=loadFailed?'作品暂时无法加载，请刷新重试':'暂无已发布的非商业作品';
    copy.querySelector('.showcase-eyebrow').textContent=key==='commercial'?'SELECTED WORK / COMMERCIAL':'SELECTED WORK / PERSONAL';
    copy.querySelector('a').href=key==='commercial'?'#work':'#personal-work';
  }
  tabs.forEach((tab,i)=>{tab.addEventListener('click',()=>chooseFolder(tab.dataset.folder));tab.addEventListener('keydown',event=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){event.preventDefault();const next=event.key==='Home'?tabs[0]:event.key==='End'?tabs[1]:tabs[1-i];chooseFolder(next.dataset.folder);next.focus();}});});
  chooseFolder('commercial');
  fetch('/api/projects').then(response=>{if(!response.ok)throw Error();return response.json();}).then(projects=>{
    personal=Object.entries(projects).filter(([id,p])=>p.brand?.startsWith('personal-')&&p.cover?.src&&!p.isDraft).slice(0,6).map(([id,p])=>({href:'/projects/'+id+'.html',src:p.cover.src,alt:p.title}));if(active==='personal')chooseFolder(active);
  }).catch(()=>{loadFailed=true;if(active==='personal')chooseFolder(active);});
  const heading=copy.querySelector('h2');
  const headingText=heading.textContent;
  heading.setAttribute('aria-label',headingText);
  heading.replaceChildren(...[...headingText].map(char=>{
    const span=document.createElement('span');span.className='reveal-char';span.textContent=char;span.setAttribute('aria-hidden','true');return span;
  }));
  const chars=[...heading.children];
  let scheduled=false;
  function render(){
    scheduled=false;
    const rect=section.getBoundingClientRect(), w=stage.clientWidth,h=stage.clientHeight;
    const top=parseFloat(getComputedStyle(stage).top)||0;
    const p=reduced.matches?1:clamp((top-rect.top)/(section.offsetHeight-h));
    const mobile=w<=700;
    const panelX=w*(mobile?.05:.52), panelW=w*(mobile?.9:.43);
    const gap=panelW*.045;
    const finalW=(panelW-gap*4)/3;
    const finalH=Math.min(finalW*1.333,h*(mobile?.20:.27));
    const panelH=finalH*2+gap*3+110;
    const panelY=mobile?Math.max(h*.34,220):(h-panelH)/2;
    folder.inert=p<.48;folder.style.visibility=p<.48?'hidden':'visible';
    folder.style.cssText=`left:${panelX}px;top:${panelY}px;width:${panelW}px;height:${panelH}px;opacity:${clamp((p-.48)/.24)}`;
    const startW=mobile?w*.29:Math.min(w*.17,h*.34),startH=startW*1.333;
    const startTop=mobile?h*.12:h*.06;
    cards.forEach((card,i)=>{
      const t=ease(clamp((p-.12-i*.022)/.60));
      const startX=w*.035+i*(w*.93-startW)/5;
      const startY=startTop+i*(h-startH-startTop-h*.06)/5;
      // The leading poster moves into the second row, matching the reference motion.
      const position=[3,0,1,2,4,5][i], col=position%3,row=Math.floor(position/3);
      const x=mix(startX,panelX+gap+col*(finalW+gap),t);
      const y=mix(startY,panelY+110+gap+row*(finalH+gap),t);
      card.style.width=`${mix(startW,finalW,t)}px`;card.style.height=`${mix(startH,finalH,t)}px`;
      card.style.transform=`translate3d(${x}px,${y}px,0)`;
      card.style.zIndex=String(i+2);
    });
    if(intro){intro.style.width=`${startW}px`;intro.style.left=`${w*.16}px`;intro.style.top=`${startTop+startH*.27}px`;
    intro.style.opacity=String(1-clamp((p-.17)/.25));intro.style.transform=`translateY(${-clamp(p/.5)*40}px)`;}
    const reveal=clamp((p-.50)/.36);
    copy.style.opacity=String(clamp((p-.43)/.15));copy.style.transform=`translateY(${(1-ease(reveal))*24}px)`;
    copy.style.visibility=p>.43?'visible':'hidden';
    chars.forEach((char,i)=>{const t=clamp(reveal*1.7-i/chars.length*.7);char.style.opacity=String(.12+t*.88);char.style.filter=`blur(${(1-t)*5}px)`;char.style.transform=`translateY(${(1-t)*12}px)`;});
  }
  function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(render);}}
  addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);reduced.addEventListener('change',schedule);render();
}
// Reveal content on entry without affecting navigation, table alignment, or editable fields.
const targets='.lab-heading,.brand-outline-title,.brand-panel h3,.project-table thead,.project-table tbody tr,.about-profile h2,.about-profile p,.social-links a';
const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
  if(entry.isIntersecting){entry.target.classList.remove('is-pending');observer.unobserve(entry.target);}
}),{threshold:.12,rootMargin:'0px 0px -25px 0px'});
function observeText(root=document){
  root.querySelectorAll(targets).forEach((element,i)=>{
    if(element.dataset.revealReady)return;element.dataset.revealReady='true';
    element.classList.add('scroll-reveal');
    if(!reduced.matches){element.classList.add('is-pending');element.style.setProperty('--reveal-delay',`${(i%3)*65}ms`);observer.observe(element);}
  });
}
observeText();
document.querySelectorAll('.brand-work').forEach(work=>new MutationObserver(()=>observeText(work)).observe(work,{childList:true,subtree:true}));
reduced.addEventListener('change',()=>{if(reduced.matches)document.querySelectorAll('.is-pending').forEach(el=>el.classList.remove('is-pending'));});
