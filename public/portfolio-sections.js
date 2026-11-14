const motionPreference=matchMedia('(prefers-reduced-motion: reduce)');
const tiltCards=[...document.querySelectorAll('.showcase-card')];
let scrolling=false,scrollTimer;
const resetTilt=card=>{card.style.setProperty('--tilt-x','0deg');card.style.setProperty('--tilt-y','0deg');};
addEventListener('scroll',()=>{scrolling=true;clearTimeout(scrollTimer);tiltCards.forEach(resetTilt);scrollTimer=setTimeout(()=>{scrolling=false;},160);},{passive:true});
for(const card of tiltCards){
  card.addEventListener('pointermove',event=>{
    if(event.pointerType!=='mouse'||scrolling||motionPreference.matches)return;
    const rect=card.getBoundingClientRect();
    const x=Math.max(-1,Math.min(1,(event.clientX-rect.left)/rect.width*2-1));
    const y=Math.max(-1,Math.min(1,(event.clientY-rect.top)/rect.height*2-1));
    card.style.setProperty('--tilt-x',`${-y*5}deg`);card.style.setProperty('--tilt-y',`${x*5}deg`);
  });
  card.addEventListener('pointerleave',()=>resetTilt(card));card.addEventListener('blur',()=>resetTilt(card));
}
motionPreference.addEventListener('change',()=>tiltCards.forEach(resetTilt));
