/* Lightweight scroll-performance guard: the 52 s hero film is 4K in the
   original and keeps decoding long after it has left the viewport. Pause it
   off-screen; everything else is handled by the site's own observers. */
(function () {
  var hero = document.querySelector('.hero__video');
  var section = document.getElementById('hero');
  if (!hero || !section) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    try { hero.pause(); } catch (e) {}
    hero.removeAttribute('autoplay');
    return;
  }
  if (!('IntersectionObserver' in window)) return;

  var io = new IntersectionObserver(function (entries) {
    if (entries[0].isIntersecting) {
      if (hero.paused) { var p = hero.play(); if (p && p.catch) p.catch(function () {}); }
    } else if (!hero.paused) {
      hero.pause();
    }
  }, { threshold: 0.02 });

  io.observe(section);
})();

/* mass closing loop — attach + play only when the section is near the viewport */
(function () {
  var section = document.getElementById('mass');
  var v = section ? section.querySelector('.scene__bg') : null;
  if (!v || v.tagName !== 'VIDEO') return;
  var src = v.getAttribute('data-src');
  if (!src) return;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var attached = false;

  function attach() {
    if (attached) return;
    attached = true;
    var s = document.createElement('source');
    s.src = src;
    s.type = 'video/mp4';
    v.appendChild(s);
    try { v.load(); } catch (e) {}
  }
  function play() {
    attach();
    var p = v.play();
    if (p && p.catch) p.catch(function () {});
  }

  if (reduced) {
    attach();
    v.removeAttribute('autoplay');
    try { v.pause(); } catch (e) {}
    return;
  }
  if (!('IntersectionObserver' in window)) { play(); return; }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) play();
      else if (!v.paused) v.pause();
    });
  }, { rootMargin: '360px 0px', threshold: 0.01 });
  io.observe(section);
})();
