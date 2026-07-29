(function(){
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Footer year ---------- */
  var yearEl = document.getElementById('year');
  if(yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Nav scroll state ---------- */
  var nav = document.getElementById('nav');
  function onScrollNav(){
    if(window.scrollY > 40) nav.classList.add('is-scrolled');
    else nav.classList.remove('is-scrolled');
  }
  window.addEventListener('scroll', onScrollNav, { passive: true });
  onScrollNav();

  /* ---------- Hide nav during destinations scroller ---------- */
  var destinationsSection = document.getElementById('destinations');
  var destinationsVisual = document.querySelector('.destinations-visual');
  function onScrollNavHide(){
    if(!nav || !destinationsSection || !destinationsVisual) return;
    var navHeight = nav.getBoundingClientRect().height;
    var sectionRect = destinationsSection.getBoundingClientRect();
    var visualRect = destinationsVisual.getBoundingClientRect();
    var shouldHide = visualRect.top <= navHeight && sectionRect.bottom > navHeight;
    nav.classList.toggle('is-hidden', shouldHide);
  }
  window.addEventListener('scroll', onScrollNavHide, { passive: true });
  window.addEventListener('resize', onScrollNavHide);
  onScrollNavHide();

  /* ---------- Mobile menu ---------- */
  var navToggle = document.getElementById('navToggle');
  var mobileMenu = document.getElementById('mobileMenu');
  if(navToggle && mobileMenu){
    navToggle.addEventListener('click', function(){
      var open = mobileMenu.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.documentElement.style.overflow = open ? 'hidden' : '';
    });
    mobileMenu.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(){
        mobileMenu.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
        document.documentElement.style.overflow = '';
      });
    });
  }

//===================== Automate collage images ================

const images = [
    "images/img1.jpg",
    "images/img2.jpg",
    "images/img3.jpg"
];

const heroImage = document.getElementById("heroImage");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

let currentIndex = 0;
let timer;

function showImage(index) {
    heroImage.style.opacity = 0;

    setTimeout(() => {
        heroImage.src = images[index];
        heroImage.style.opacity = 1;
    }, 300);
}

function nextImage() {
    currentIndex = (currentIndex + 1) % images.length;
    showImage(currentIndex);
}

function prevImage() {
    currentIndex = (currentIndex - 1 + images.length) % images.length;
    showImage(currentIndex);
}

function startSlider() {
    timer = setTimeout(function slide() {
        nextImage();
        timer = setTimeout(slide, 3000);
    }, 3000);
}

function resetSlider() {
    clearTimeout(timer);
    startSlider();
}

nextBtn.addEventListener("click", () => {
    nextImage();
    resetSlider();
});

prevBtn.addEventListener("click", () => {
    prevImage();
    resetSlider();
});

startSlider();

  /* ---------- Scroll progress bar ---------- */
  var progressBar = document.getElementById('progressBar');
  function onScrollProgress(){
    var h = document.documentElement;
    var scrollTop = h.scrollTop || document.body.scrollTop;
    var scrollHeight = (h.scrollHeight || document.body.scrollHeight) - h.clientHeight;
    var pct = scrollHeight > 0 ? (scrollTop/scrollHeight)*100 : 0;
    if(progressBar) progressBar.style.width = pct + '%';
  }
  window.addEventListener('scroll', onScrollProgress, { passive: true });
  onScrollProgress();

  /* ---------- Generic reveal-on-scroll ---------- */
  var revealTargets = Array.prototype.slice.call(document.querySelectorAll('.reveal, .reveal-photo'));
  if('IntersectionObserver' in window){
    var revealObserver = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.16, rootMargin: '0px 0px -6% 0px' });
    revealTargets.forEach(function(el){ revealObserver.observe(el); });

    // Viewport-scoped backup: catches anything the observer misses,
    // but only reveals items already in/near view — never fires blind,
    // so it can't short-circuit reveals further down the page.
    var scrollTicking = false;
    window.addEventListener('scroll', function(){
      if(scrollTicking) return;
      scrollTicking = true;
      requestAnimationFrame(function(){
        revealTargets.forEach(function(el){
          if(!el.classList.contains('is-visible')){
            var r = el.getBoundingClientRect();
            if(r.top < window.innerHeight*0.95 && r.bottom > 0){
              el.classList.add('is-visible');
            }
          }
        });
        scrollTicking = false;
      });
    }, { passive: true });
  } else {
    revealTargets.forEach(function(el){ el.classList.add('is-visible'); });
  }

  /* ---------- Destinations scrollytelling ---------- */
  var destSteps = document.querySelectorAll('.dest-step');
  var destPanels = document.querySelectorAll('.dest-panel');
  var destLabelNum = document.getElementById('destLabelNum');
  var destLabelName = document.getElementById('destLabelName');
  // Continent-first order: Asia (Dubai, Singapore) and Europe (UK) lead,
  // followed by the remaining top destinations.
  var destNames = ['Dubai, UAE','Singapore','United Kingdom','Australia','Canada','United States'];

  function setActiveDest(index){
    destSteps.forEach(function(s){ s.classList.toggle('is-active', s.dataset.index === String(index)); });
    destPanels.forEach(function(p){ p.classList.toggle('is-active', p.dataset.index === String(index)); });
    if(destLabelNum) destLabelNum.textContent = String(index+1).length < 2 ? '0'+(index+1) : String(index+1);
    if(destLabelName) destLabelName.textContent = destNames[index] || '';
  }

  if(destSteps.length && 'IntersectionObserver' in window){
    var destObserver = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          setActiveDest(parseInt(entry.target.getAttribute('data-index'),10));
        }
      });
    }, { threshold: 0, rootMargin: '-45% 0px -45% 0px' });
    destSteps.forEach(function(s){ destObserver.observe(s); });
  }

  /* ---------- Destination page navigation ---------- */
var destinationPages = [
  './countryPages/dubai.html',
  './countryPages/singapore.html',
  './countryPages/uk.html',
  './countryPages/australia.html',
  './countryPages/canada.html',
  './countryPages/us.html'
];

function openDestinationPage(element){
  var index = parseInt(element.getAttribute('data-index'), 10);
  var pageUrl = destinationPages[index];

  if(pageUrl){
    window.location.href = pageUrl;
  }
}

function makeDestinationClickable(element){
  element.setAttribute('role', 'link');
  element.setAttribute('tabindex', '0');

  element.addEventListener('click', function(){
    openDestinationPage(element);
  });

  element.addEventListener('keydown', function(event){
    if(event.key === 'Enter' || event.key === ' '){
      event.preventDefault();
      openDestinationPage(element);
    }
  });
}

destSteps.forEach(makeDestinationClickable);
destPanels.forEach(makeDestinationClickable);

  /* ---------- Process line-draw + step reveal ---------- */
  var processSection = document.getElementById('process');
  var processFill = document.getElementById('processLineFill');
  var processSteps = document.querySelectorAll('.process-step');
  function onScrollProcess(){
    if(!processSection || !processFill) return;
    var rect = processSection.getBoundingClientRect();
    var vh = window.innerHeight;
    var total = rect.height + vh*0.4;
    var passed = (vh*0.7) - rect.top;
    var pct = Math.max(0, Math.min(1, passed/total));
    processFill.style.height = (pct*100) + '%';
    processSteps.forEach(function(step){
      var r = step.getBoundingClientRect();
      if(r.top < vh*0.78) step.classList.add('is-visible');
    });
  }
  window.addEventListener('scroll', onScrollProcess, { passive: true });
  window.addEventListener('resize', onScrollProcess);
  onScrollProcess();

  /* ---------- Stories slider ---------- */
  var storyIndex = 0;
  var storyTimer;
  var stories = [];
  function setStory(i){
    if(!stories.length) return;
    storyIndex = (i + stories.length) % stories.length;
    stories.forEach(function(s){ s.classList.toggle('is-active', s.getAttribute('data-index') === String(storyIndex)); });
  }
  function restartStoryTimer(){
    clearInterval(storyTimer);
    if(stories.length > 1){
      storyTimer = setInterval(function(){ setStory(storyIndex+1); }, 7000);
    }
  }
  function initStoriesSlider(){
    stories = Array.prototype.slice.call(document.querySelectorAll('.story'));
    storyIndex = 0;
    if(stories.length){
      setStory(0);
      restartStoryTimer();
    }
  }
  var storyPrev = document.getElementById('storyPrev');
  var storyNext = document.getElementById('storyNext');
  if(storyPrev) storyPrev.addEventListener('click', function(){ setStory(storyIndex-1); restartStoryTimer(); });
  if(storyNext) storyNext.addEventListener('click', function(){ setStory(storyIndex+1); restartStoryTimer(); });
  initStoriesSlider();

  // Pages that fetch stories from the API and inject them after this script
  // runs (e.g. the homepage) can call this to pick up the new elements.
  window.KiAspireReinitStories = initStoriesSlider;

  /* ============================================================
     HERO INTRO — plane flight, smoke trail, jagged paper tear
     (Only runs on pages that include the intro canvases, e.g. index.html.
     On country pages these elements don't exist, so this whole block
     safely no-ops via the canRunIntro guard below.)
     ============================================================ */
  var introOverlay = document.getElementById('introOverlay');
  var coverCanvas = document.getElementById('coverCanvas');
  var planeCanvas = document.getElementById('planeCanvas');
  var introSkip = document.getElementById('introSkip');
  var heroTexts = document.querySelectorAll('.reveal-hero-text');

  var introEnded = false;
  var textFired = false;

  // Once per browser session, not once ever — sessionStorage clears when
  // the tab/window closes, so returning later (or in a new tab) plays the
  // intro again, but reloading or re-visiting the homepage within the same
  // session won't replay it.
  var INTRO_SESSION_KEY = 'kiaspireIntroShown';
  var introAlreadySeenThisSession = false;
  try {
    introAlreadySeenThisSession = sessionStorage.getItem(INTRO_SESSION_KEY) === '1';
  } catch (e) {
    introAlreadySeenThisSession = false;
  }

  function revealHeroText(){
    if(textFired) return;
    textFired = true;
    heroTexts.forEach(function(el, i){
      setTimeout(function(){ el.classList.add('is-visible'); }, i*110);
    });
  }
  function showNav(){ nav.classList.add('is-ready'); }
  function endIntro(){
    if(introEnded) return;
    introEnded = true;
    try { sessionStorage.setItem(INTRO_SESSION_KEY, '1'); } catch (e) {}
    document.documentElement.style.overflow = '';
    if(introOverlay){
      introOverlay.classList.add('is-done');
      setTimeout(function(){ introOverlay.style.display = 'none'; }, 950);
    }
    showNav();
    revealHeroText();
  }

  var canRunIntro = !reduceMotion && !introAlreadySeenThisSession && coverCanvas && planeCanvas && coverCanvas.getContext;

  if(!canRunIntro){
    if(introOverlay) introOverlay.style.display = 'none';
    showNav();
    revealHeroText();
  } else {
    try{
      runIntro();
    }catch(err){
      endIntro();
    }
  }

  // Hard safety net: whatever else happens, never leave the hero
  // permanently hidden behind the intro overlay.
  setTimeout(endIntro, 6800);

  function runIntro(){
    document.documentElement.style.overflow = 'hidden';

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = window.innerWidth, H = window.innerHeight;
    [coverCanvas, planeCanvas].forEach(function(c){
      c.width = Math.round(W*dpr);
      c.height = Math.round(H*dpr);
      c.getContext('2d').setTransform(dpr,0,0,dpr,0,0);
    });
    var coverCtx = coverCanvas.getContext('2d');
    var planeCtx = planeCanvas.getContext('2d');

    var rootStyles = getComputedStyle(document.documentElement);
    var coverColor = (rootStyles.getPropertyValue('--ivory') || '#F6F1E6').trim() || '#F6F1E6';
    var pineColor = (rootStyles.getPropertyValue('--pine') || '#E9F3F7').trim() || '#E9F3F7';

    /* ---- flight path: gentle bow, bottom-left to top-right ---- */
    var start = { x: -W*0.16, y: H*1.14 };
    var end   = { x: W*1.16,  y: -H*0.18 };
    var mid   = { x: (start.x+end.x)/2, y: (start.y+end.y)/2 };
    var dx = end.x-start.x, dy = end.y-start.y;
    var len = Math.hypot(dx,dy) || 1;
    var nx = -dy/len, ny = dx/len;
    var bow = len*0.07;
    var ctrl = { x: mid.x + nx*bow, y: mid.y + ny*bow };

    function bezierPoint(t){
      var it = 1-t;
      return {
        x: it*it*start.x + 2*it*t*ctrl.x + t*t*end.x,
        y: it*it*start.y + 2*it*t*ctrl.y + t*t*end.y
      };
    }
    function bezierAngle(t){
      var p0 = bezierPoint(Math.max(0,t-0.01));
      var p1 = bezierPoint(Math.min(1,t+0.01));
      return Math.atan2(p1.y-p0.y, p1.x-p0.x);
    }

    /* ---- precompute a jagged torn-paper envelope along the path ---- */
    var N = 90;
    var tearPath = [];
    function jag(seed, t){
      return Math.sin(t*12.9+seed)*0.5 + Math.sin(t*27.3+seed*1.7)*0.3 + Math.sin(t*53.7+seed*3.1)*0.2;
    }
    function spike(seed, t){
      return Math.pow(Math.max(0, Math.sin(t*9+seed)), 10);
    }
    var baseHalf = Math.max(46, Math.min(W,H)*0.055);
    for(var i=0;i<=N;i++){
      var t = i/N;
      var p = bezierPoint(t);
      var ang = bezierAngle(t);
      var nxp = -Math.sin(ang), nyp = Math.cos(ang);
      var wUp = baseHalf + jag(1.7,t)*18 + spike(2.1,t)*34;
      var wDn = baseHalf + jag(4.3,t)*18 + spike(5.8,t)*34;
      tearPath.push({
        upX: p.x + nxp*wUp,        upY: p.y + nyp*wUp,
        dnX: p.x - nxp*wDn,        dnY: p.y - nyp*wDn,
        upXin: p.x + nxp*(wUp-9),  upYin: p.y + nyp*(wUp-9),
        dnXin: p.x - nxp*(wDn-9),  dnYin: p.y - nyp*(wDn-9)
      });
    }

    function drawCover(progress){
      coverCtx.clearRect(0,0,W,H);
      coverCtx.fillStyle = coverColor;
      coverCtx.fillRect(0,0,W,H);
      var idx = Math.floor(progress*N);
      if(idx < 1) return;

      coverCtx.save();
      coverCtx.fillStyle = 'rgba(140,108,58,0.16)';
      coverCtx.beginPath();
      coverCtx.moveTo(tearPath[0].upX, tearPath[0].upY);
      for(var a=1; a<=idx; a++) coverCtx.lineTo(tearPath[a].upX, tearPath[a].upY);
      for(var b=idx; b>=0; b--) coverCtx.lineTo(tearPath[b].dnX, tearPath[b].dnY);
      coverCtx.closePath();
      coverCtx.fill();
      coverCtx.restore();

      coverCtx.save();
      coverCtx.globalCompositeOperation = 'destination-out';
      coverCtx.beginPath();
      coverCtx.moveTo(tearPath[0].upXin, tearPath[0].upYin);
      for(var c=1; c<=idx; c++) coverCtx.lineTo(tearPath[c].upXin, tearPath[c].upYin);
      for(var d=idx; d>=0; d--) coverCtx.lineTo(tearPath[d].dnXin, tearPath[d].dnYin);
      coverCtx.closePath();
      coverCtx.fill();
      coverCtx.restore();
    }

    /* ---- tiny path helpers for the plane sprite ---- */
    function tracePoly(points){
      planeCtx.beginPath();
      planeCtx.moveTo(points[0][0], points[0][1]);
      for(var i=1;i<points.length;i++) planeCtx.lineTo(points[i][0], points[i][1]);
      planeCtx.closePath();
    }
    function tracePathD(d){
      var cmds = d.match(/[MLCZ][^MLCZ]*/g) || [];
      planeCtx.beginPath();
      cmds.forEach(function(cmd){
        var type = cmd[0];
        var nums = cmd.slice(1).trim().split(/[\s,]+/).filter(Boolean).map(Number);
        if(type === 'M') planeCtx.moveTo(nums[0], nums[1]);
        else if(type === 'L') planeCtx.lineTo(nums[0], nums[1]);
        else if(type === 'C') planeCtx.bezierCurveTo(nums[0],nums[1],nums[2],nums[3],nums[4],nums[5]);
        else if(type === 'Z') planeCtx.closePath();
      });
    }

    /* ---- plane sprite, drawn in a local 0-480 x 0-220 space ---- */
    function drawPlane(x, y, angle, scale){
      planeCtx.save();
      planeCtx.translate(x,y);
      planeCtx.rotate(angle);
      planeCtx.scale(scale, scale);
      planeCtx.translate(-240,-110);

      try{
        planeCtx.save();
        planeCtx.globalAlpha = 0.16;
        planeCtx.filter = 'blur(6px)';
        planeCtx.fillStyle = '#5b4a30';
        planeCtx.beginPath();
        planeCtx.ellipse(230,184,160,15,0,0,Math.PI*2);
        planeCtx.fill();
        planeCtx.restore();
      }catch(e){ /* filter unsupported — skip shadow, non-critical */ }

      planeCtx.fillStyle = '#cbc0a3';
      planeCtx.strokeStyle = '#8f8362';
      planeCtx.lineWidth = 1;
      planeCtx.beginPath();
      planeCtx.ellipse(88,148,30,12,0,0,Math.PI*2);
      planeCtx.fill(); planeCtx.stroke();
      planeCtx.fillStyle = '#6b5638';
      planeCtx.beginPath(); planeCtx.arc(62,144,8,0,Math.PI*2); planeCtx.fill();
      planeCtx.fillStyle = '#8a7454';
      planeCtx.beginPath(); planeCtx.arc(62,144,4,0,Math.PI*2); planeCtx.fill();

      planeCtx.fillStyle = pineColor;
      tracePoly([[80,28],[46,14],[52,27],[88,38]]);
      planeCtx.fill();

      planeCtx.fillStyle = pineColor;
      tracePathD('M58,112 C 50,80 56,50 74,26 L100,30 C 90,56 84,82 90,111 Z');
      planeCtx.fill();

      planeCtx.fillStyle = '#cbc0a3';
      planeCtx.strokeStyle = '#8f8362';
      tracePoly([[305,132],[350,140],[182,215],[150,203]]);
      planeCtx.fill(); planeCtx.stroke();
      planeCtx.fillStyle = pineColor;
      tracePoly([[150,203],[166,178],[180,187],[182,215]]);
      planeCtx.fill();

      var fuseGrad = planeCtx.createLinearGradient(0,88,0,140);
      fuseGrad.addColorStop(0,'#fffdf8');
      fuseGrad.addColorStop(1,'#dbd2ba');
      planeCtx.fillStyle = fuseGrad;
      planeCtx.strokeStyle = '#9c927a';
      planeCtx.lineWidth = 1;
      tracePathD('M28,120 C 46,102 88,94 145,91 C 220,88 305,88 365,92 C 400,95 432,101 458,114 C 432,123 396,130 345,134 C 275,139 195,140 130,136 C 85,133 48,128 28,120 Z');
      planeCtx.fill(); planeCtx.stroke();

      planeCtx.strokeStyle = '#AC8551';
      planeCtx.lineWidth = 3.2;
      planeCtx.lineCap = 'round';
      planeCtx.beginPath();
      planeCtx.moveTo(46,118);
      planeCtx.bezierCurveTo(130,124,310,124,440,112);
      planeCtx.stroke();

      planeCtx.fillStyle = 'rgba(31,94,118,0.72)';
      tracePathD('M398,99 C 412,101.5 422,105.5 430,111 L 414,116.5 C 404,112 396,107.5 392,103 Z');
      planeCtx.fill();

      planeCtx.fillStyle = 'rgba(31,94,118,0.4)';
      var wx = [126,152,178,204,230,256,282,308,334,358];
      var wy = [110.5,109.3,108.4,107.9,107.9,108.3,109,110,111.3,112.8];
      for(var w=0; w<wx.length; w++){
        planeCtx.beginPath();
        planeCtx.ellipse(wx[w], wy[w], 6.2, 3.8, 0, 0, Math.PI*2);
        planeCtx.fill();
      }

      planeCtx.restore();
    }

    /* ---- smoke trail ---- */
    var particles = [];
    function spawnSmoke(x,y,angle){
      for(var k=0;k<2;k++){
        particles.push({
          x: x + (Math.random()-0.5)*6,
          y: y + (Math.random()-0.5)*6,
          vx: -Math.cos(angle)*0.35 + (Math.random()-0.5)*0.5,
          vy: -Math.sin(angle)*0.35 - Math.random()*0.35,
          r: 5 + Math.random()*4,
          maxR: 20 + Math.random()*16,
          life: 0,
          maxLife: 1000 + Math.random()*600,
          alpha: 0.4 + Math.random()*0.16
        });
      }
    }
    function drawSmoke(dt){
      for(var i=particles.length-1; i>=0; i--){
        var p = particles[i];
        p.life += dt;
        var lt = p.life/p.maxLife;
        if(lt >= 1){ particles.splice(i,1); continue; }
        p.x += p.vx*dt*0.06;
        p.y += p.vy*dt*0.06;
        p.r = p.r + (p.maxR-p.r)*0.02;
        var a = p.alpha*(1-lt);
        var grad = planeCtx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r);
        grad.addColorStop(0, 'rgba(255,253,248,'+a+')');
        grad.addColorStop(1, 'rgba(255,253,248,0)');
        planeCtx.fillStyle = grad;
        planeCtx.beginPath();
        planeCtx.arc(p.x,p.y,p.r,0,Math.PI*2);
        planeCtx.fill();
      }
    }

    /* ---- run loop ---- */
    var duration = 3100;
    var startTime = null;
    var skipped = false;

    function easeInOutCubic(x){ return x<0.5 ? 4*x*x*x : 1-Math.pow(-2*x+2,3)/2; }

    function frame(now){
      if(startTime === null) startTime = now;
      var elapsed = now - startTime;
      var rawT = Math.min(1, elapsed/duration);
      var t = easeInOutCubic(rawT);

      drawCover(t);

      planeCtx.clearRect(0,0,W,H);
      var pos = bezierPoint(t);
      var angle = bezierAngle(t) + Math.sin(elapsed/170)*0.06;
      var scale = (0.62 + Math.sin(Math.PI*t)*0.22) * (Math.min(W,H)/620);
      var bobAngle = angle + Math.PI/2;
      var bob = Math.sin(elapsed/85)*3;
      var px = pos.x + Math.cos(bobAngle)*bob;
      var py = pos.y + Math.sin(bobAngle)*bob;

      if(rawT > 0.03 && rawT < 0.94){
        var tailOffset = 235*scale;
        spawnSmoke(px - Math.cos(angle)*tailOffset, py - Math.sin(angle)*tailOffset, angle);
      }
      drawSmoke(16);
      drawPlane(px, py, angle, scale);

      if(rawT > 0.58){
        revealHeroText();
        showNav();
      }

      if(rawT < 1 && !skipped){
        requestAnimationFrame(frame);
      } else {
        setTimeout(endIntro, 220);
      }
    }

    requestAnimationFrame(frame);

    if(introSkip){
      setTimeout(function(){ introSkip.classList.add('is-visible'); }, 500);
      introSkip.addEventListener('click', function(){
        skipped = true;
        endIntro();
      });
    }
  }

})();
