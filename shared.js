// Shared JS for all pages

// ---------- Shared reduced-motion check ----------
var reducedGlobal = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- Shared toast + confetti helpers ----------
function showToast(text){
  var toast = document.createElement('div');
  toast.className = 'egg-toast';
  toast.textContent = text;
  document.body.appendChild(toast);
  requestAnimationFrame(function(){ toast.classList.add('is-visible'); });
  setTimeout(function(){
    toast.classList.remove('is-visible');
    setTimeout(function(){ toast.remove(); }, 350);
  }, 2800);
}

function spawnConfetti(x, y){
  if (reducedGlobal){ return; }
  var colors = ['var(--accent)', 'var(--accent-2)'];
  for (var i = 0; i < 22; i++){
    var piece = document.createElement('div');
    piece.className = 'confetti-piece';
    var angle = Math.random() * Math.PI * 2;
    var dist = 70 + Math.random() * 130;
    piece.style.left = x + 'px';
    piece.style.top = y + 'px';
    piece.style.background = colors[i % 2];
    piece.style.setProperty('--tx', (Math.cos(angle) * dist) + 'px');
    piece.style.setProperty('--ty', (Math.sin(angle) * dist) + 'px');
    piece.style.setProperty('--rot', (Math.random() * 360) + 'deg');
    document.body.appendChild(piece);
    setTimeout(function(p){ return function(){ p.remove(); }; }(piece), 1200);
  }
}

function spawnPawRain(){
  if (reducedGlobal){ return; }
  for (var i = 0; i < 16; i++){
    var paw = document.createElement('div');
    paw.className = 'paw-rain';
    paw.textContent = '🐾';
    paw.style.left = (Math.random() * 100) + 'vw';
    paw.style.setProperty('--dur', (2.2 + Math.random() * 1.6) + 's');
    paw.style.setProperty('--delay', (Math.random() * 0.6) + 's');
    paw.style.setProperty('--rot', (Math.random() * 60 - 30) + 'deg');
    document.body.appendChild(paw);
    setTimeout(function(p){ return function(){ p.remove(); }; }(paw), 4400);
  }
}

// ---------- Click ripple ----------
document.addEventListener('click', function(e){
  if (reducedGlobal){ return; }
  var ripple = document.createElement('div');
  ripple.className = 'click-ripple';
  ripple.style.left = e.clientX + 'px';
  ripple.style.top = e.clientY + 'px';
  document.body.appendChild(ripple);
  setTimeout(function(){ ripple.remove(); }, 650);
});

// ---------- Mobile hamburger menu ----------
(function(){
  var btn = document.getElementById('hamburgerBtn');
  var menu = document.getElementById('mobileMenu');
  if (!btn || !menu){ return; }
  function closeMenu(){
    btn.classList.remove('is-open');
    menu.classList.remove('is-open');
    btn.setAttribute('aria-expanded', 'false');
  }
  btn.addEventListener('click', function(){
    var open = menu.classList.toggle('is-open');
    btn.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  menu.querySelectorAll('a').forEach(function(a){
    a.addEventListener('click', closeMenu);
  });
})();

// ---------- Easter egg: 5 clicks on logo ----------
(function(){
  var logo = document.querySelector('.logo');
  if (!logo){ return; }
  var count = 0, lastClick = 0;
  logo.addEventListener('click', function(e){
    var now = Date.now();
    if (now - lastClick > 1400){ count = 0; }
    lastClick = now;
    count++;
    if (count >= 5){
      count = 0;
      spawnConfetti(e.clientX, e.clientY);
      showToast('🏆 Achievement unlocked: 5 klikov na logo. Rešpekt.');
    }
  });
})();

// ---------- Easter egg: type "max" anywhere ----------
(function(){
  var buffer = '';
  window.addEventListener('keydown', function(e){
    if (e.key && e.key.length === 1){ buffer = (buffer + e.key.toLowerCase()).slice(-10); }
    if (buffer.indexOf('max') !== -1){
      buffer = '';
      spawnPawRain();
      showToast('🐾 Max ťa zdraví. Najlepší kontrolór kvality strihu.');
    }
  });
})();

// ---------- Easter egg: type "hesoyam" anywhere ----------
(function(){
  var buffer = '';
  window.addEventListener('keydown', function(e){
    if (e.key && e.key.length === 1){ buffer = (buffer + e.key.toLowerCase()).slice(-10); }
    if (buffer.indexOf('hesoyam') !== -1){
      buffer = '';
      showToast('🏆 Achievement unlocked: hesoyam. Ah s#!t, here we go again.');
    }
  });
})();

// ---------- Easter egg: Konami code ----------
(function(){
  var seq = ['arrowup','arrowup','arrowdown','arrowdown','arrowleft','arrowright','arrowleft','arrowright','b','a'];
  var idx = 0;
  window.addEventListener('keydown', function(e){
    var key = e.key.toLowerCase();
    if (key === seq[idx]){
      idx++;
      if (idx === seq.length){
        idx = 0;
        spawnConfetti(window.innerWidth / 2, window.innerHeight / 2);
        showToast('🕹️ Konami kód rozpoznaný. Level up, hráč.');
      }
    } else {
      idx = (key === seq[0]) ? 1 : 0;
    }
  });
})();
