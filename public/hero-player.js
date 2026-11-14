// Preload the following clip while the current clip plays. Never fade to an unloaded frame.
const hero = document.querySelector('#hero-video');
if (hero) {
  const clips = ['omega-hd.mp4', 'video01-hd.mp4', 'bugatti-hd.mp4'];
  const standby = document.createElement('video');
  standby.className = 'hero-layer';
  standby.muted = true;
  standby.playsInline = true;
  standby.preload = 'auto';
  standby.setAttribute('aria-hidden', 'true');
  hero.after(standby);
  hero.classList.add('hero-layer', 'hero-visible');
  hero.muted = true;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let current = hero, next = standby, index = 0, switching = false;
  function preload(element, clipIndex) {
    element.src = `assets/${clips[clipIndex]}`;
    element.load();
  }
  preload(next, 1);
  function check() {
    if (motion.matches || switching || !Number.isFinite(current.duration)) return;
    if (current.duration - current.currentTime > .5 || next.readyState < 3) return;
    switchClip();
  }
  async function switchClip() {
    switching = true;
    const outgoing = current, incoming = next;
    try {
      await incoming.play();
      if (incoming.requestVideoFrameCallback) {
        await new Promise(resolve => incoming.requestVideoFrameCallback(resolve));
      }
      incoming.style.zIndex = '2';
      outgoing.style.zIndex = '1';
      incoming.classList.add('hero-visible');
      await new Promise(resolve => setTimeout(resolve, 450));
      outgoing.pause();
      outgoing.classList.remove('hero-visible');
      outgoing.style.zIndex = '0';
      incoming.style.zIndex = '1';
      current = incoming;
      next = outgoing;
      index = (index + 1) % clips.length;
      preload(next, (index + 1) % clips.length);
    } catch {
      // Retain the last visible frame if playback is temporarily blocked.
    } finally {
      switching = false;
    }
  }
  for (const element of [hero, standby]) {
    element.addEventListener('timeupdate', check);
    element.addEventListener('ended', check);
    element.addEventListener('canplay', check);
  }
  function start() {
    if (!motion.matches) current.play().catch(() => {});
    else current.pause();
  }
  motion.addEventListener('change', start);
  document.addEventListener('pointerdown', start, {once:true});
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { start(); check(); } });
  start();
}
