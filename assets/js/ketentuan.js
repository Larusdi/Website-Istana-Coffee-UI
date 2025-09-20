(() => {
  /* ---------- Helpers ---------- */
  const $  = (s, el=document) => el.querySelector(s);
  const $$ = (s, el=document) => [...el.querySelectorAll(s)];
  const clamp = (v,a,b) => Math.max(a, Math.min(b, v));
  const prefersDark = () => matchMedia('(prefers-color-scheme: dark)').matches;
  const html = document.documentElement;

  /* ---------- Tahun & tombol umum ---------- */
  const y = new Date().getFullYear();
  $('#copyYear') && ($('#copyYear').textContent = y);
  $('#yearFoot') && ($('#yearFoot').textContent = y);
  $('#printBtn')?.addEventListener('click', () => window.print());
  $('#toTopBtn')?.addEventListener('click', () => window.scrollTo({ top:0, behavior:'smooth' }));

  const headerOffset = () => {
    const bar = $('.pvbar');
    return (bar?.offsetHeight || 56) + 12;
  };
  const topOf = (el) => window.scrollY + el.getBoundingClientRect().top - headerOffset();

  /* =====================================================================
     THEME & ACCENT (popover eksklusif)
     ===================================================================== */
  const THEME_KEY = 'ic-theme-pref';
  const ACCENT_KEY = 'ic-accent-color';
  const themeBtn  = $('#themeBtn');
  const colorBtn  = $('#colorBtn');
  const themeMenu = $('#themeMenu');
  const colorMenu = $('#colorMenu');

  let backdrop = $('.menu__backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.className = 'menu__backdrop';
    document.body.appendChild(backdrop);
  }

  const closeMenus = () => {
    themeMenu?.classList.remove('is-open');
    colorMenu?.classList.remove('is-open');
    themeBtn?.setAttribute('aria-expanded','false');
    colorBtn?.setAttribute('aria-expanded','false');
    backdrop.classList.remove('is-open');
  };
  const openMenu = (menu, btn) => {
    if (!menu || !btn) return;
    const willOpen = !menu.classList.contains('is-open');
    closeMenus();
    if (willOpen) {
      menu.classList.add('is-open');
      btn.setAttribute('aria-expanded','true');
      backdrop.classList.add('is-open');
    }
  };

  themeBtn?.addEventListener('click', () => openMenu(themeMenu, themeBtn));
  colorBtn?.addEventListener('click', () => openMenu(colorMenu, colorBtn));
  backdrop.addEventListener('click', closeMenus);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenus(); });

  const applyTheme = (pref) => {
    const applied = pref === 'auto' ? (prefersDark() ? 'dark' : 'light') : pref;
    html.setAttribute('data-theme', applied);
    $$('[data-theme]', themeMenu).forEach(b => {
      b.setAttribute('aria-checked', String(b.getAttribute('data-theme') === pref));
    });
    localStorage.setItem(THEME_KEY, pref);
  };
  const shadeHex = (hex, p) => {
    const n = (x) => clamp(Math.round(x),0,255);
    const h = hex.replace('#','');
    const r = parseInt(h.slice(0,2),16), g = parseInt(h.slice(2,4),16), b = parseInt(h.slice(4,6),16);
    const t = p<0?0:255, P = Math.abs(p)/100;
    return '#'+[n((t-r)*P+r), n((t-g)*P+g), n((t-b)*P+b)]
      .map(v=>v.toString(16).padStart(2,'0')).join('');
  };
  const setAccent = (hex) => {
    html.style.setProperty('--first-color', hex);
    html.style.setProperty('--first-color-alt', shadeHex(hex,-12));
    $$('.swatch', colorMenu).forEach(sw => {
      sw.setAttribute('aria-checked', String(sw.dataset.color === hex));
    });
    localStorage.setItem(ACCENT_KEY, hex);
  };

  applyTheme(localStorage.getItem(THEME_KEY) || 'auto');
  const savedAccent = localStorage.getItem(ACCENT_KEY);
  if (savedAccent) setAccent(savedAccent);

  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if ((localStorage.getItem(THEME_KEY) || 'auto') === 'auto') applyTheme('auto');
  });
  themeMenu?.addEventListener('click', e => {
    const btn = e.target.closest('[data-theme]'); if (!btn) return;
    applyTheme(btn.getAttribute('data-theme')); closeMenus();
  });
  colorMenu?.addEventListener('click', e => {
    const sw = e.target.closest('.swatch'); if (!sw) return;
    setAccent(sw.dataset.color); closeMenus();
  });

  /* =====================================================================
     TOC Desktop + Smooth Anchor
     ===================================================================== */
  const toc      = $('#policyToc');
  const tocLinks = toc ? $$('a[href^="#"]', toc) : [];
  const sections = tocLinks.map(a => $(a.getAttribute('href'))).filter(Boolean);

  // referensi item FAB utk highlight sinkron
  let fabItemsRef = [];

  const setActive = (id) => {
    tocLinks.forEach(a => {
      const on = a.getAttribute('href') === id;
      a.classList.toggle('is-active', on);
      a.setAttribute('aria-current', on ? 'true' : 'false');
    });
    fabItemsRef.forEach(b => b.classList.toggle('is-active', b.dataset.target === id));
  };

  tocLinks.forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      const id = a.getAttribute('href');
      const el = $(id); if (!el) return;
      window.scrollTo({ top: topOf(el), behavior:'smooth' });
      setActive(id);
      closeFab();
    });
  });

  if (sections.length){
    const io = new IntersectionObserver((entries) => {
      entries.forEach(ent => {
        if (!ent.isIntersecting) return;
        setActive('#'+ent.target.id);
      });
    }, { rootMargin: `-${headerOffset()+10}px 0% -60% 0%`, threshold: 0 });
    sections.forEach(sec => io.observe(sec));
  }

  // smooth untuk anchor lain (di konten)
  $$( 'a[href^="#"]' ).forEach(a => {
    if (tocLinks.includes(a)) return;
    a.addEventListener('click', e => {
      const id = a.getAttribute('href'); if (!id || id==='#') return;
      const el = $(id); if (!el) return;
      e.preventDefault();
      window.scrollTo({ top: topOf(el), behavior:'smooth' });
      setActive(id);
      closeFab();
    });
  });

  // hide TOC di mobile kecil
  if (toc){
    const mq = matchMedia('(max-width: 560px)');
    const toggleToc = () => { toc.style.display = mq.matches ? 'none' : ''; };
    toggleToc(); mq.addEventListener('change', toggleToc);
  }

  /* =====================================================================
     FAB Mobile (radial): buka/tutup saat TAP, drag + snap, simpan posisi
     ===================================================================== */
  const fab      = $('#policyFab');
  const fabMenu  = $('#policyFabMenu');
  const fabCenter= $('#fabCenterBtn');
  const overlay  = $('.policy-fab-menu__overlay', fabMenu);
  const fabItems = $$('.policy-fab-item', fabMenu);
  fabItemsRef = fabItems;

  // sebar ikon mengitari pusat (mulai jam 12)
  if (fabItems.length){
    const N = fabItems.length;
    fabItems.forEach((btn,i) => {
      const deg = -90 + (360/N) * i; // start at 12 o'clock
      btn.style.setProperty('--deg', deg.toFixed(2));
      btn.style.setProperty('--R', '118px');
    });
  }

  const openFab = () => {
    if (!fabMenu) return;
    closeMenus();
    fabMenu.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
  };
  const closeFab = () => {
    if (!fabMenu) return;
    fabMenu.setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
  };

  // klik item → scroll & close
  fabItems.forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.target;
      const el = id && $(id);
      closeFab();
      if (el){
        setTimeout(() => {
          window.scrollTo({ top: topOf(el), behavior:'smooth' });
          setActive(id);
        }, 60);
      }
    });
  });

  // pusat, overlay, Escape
  fabCenter?.addEventListener('click', closeFab);
  overlay?.addEventListener('click', e => { if (e.target.dataset.close) closeFab(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeFab(); });

  // Drag + snap + TAP detection
  if (fab){
    const POS_KEY = 'ic-fab-pos-terms';
    // restore posisi
    try{
      const s = JSON.parse(localStorage.getItem(POS_KEY) || '{}');
      if (s?.side === 'left')  { fab.style.left = '12px'; fab.style.right = ''; }
      if (s?.side === 'right') { fab.style.left = '';     fab.style.right = '12px'; }
      if (typeof s.top === 'number') fab.style.top = clamp(s.top, 60, innerHeight - 80) + 'px';
    }catch{}

    let dragging=false, moved=false, startX=0, startY=0, offX=0, offY=0;

    const onDown = (e) => {
      const p = e.touches ? e.touches[0] : e;
      dragging = true; moved=false;
      const r = fab.getBoundingClientRect();
      startX = p.clientX; startY = p.clientY;
      offX = startX - r.left; offY = startY - r.top;
      fab.style.transition = 'none'; fab.style.bottom = 'auto';
      fab.setPointerCapture?.(e.pointerId);
    };

    const onMove = (x,y) => {
      if (!dragging) return;
      const dx = x - startX, dy = y - startY;
      if (!moved && Math.hypot(dx,dy) > 6) moved = true;
      const nx = clamp(x - offX, 6, innerWidth  - fab.offsetWidth  - 6);
      const ny = clamp(y - offY, 60, innerHeight - fab.offsetHeight - 6);
      fab.style.left = nx + 'px';
      fab.style.top  = ny + 'px';
      fab.style.right = 'auto';
      startX = x; startY = y;
    };

    const onUp = () => {
      if (!dragging) return;
      dragging = false; fab.style.transition = '';
      if (!moved){
        // TAP → toggle menu
        const willOpen = fabMenu?.getAttribute('aria-hidden') !== 'false';
        willOpen ? openFab() : closeFab();
        return;
      }
      // SNAP + simpan
      const r = fab.getBoundingClientRect();
      const side = (r.left + r.width/2) < innerWidth/2 ? 'left' : 'right';
      if (side === 'left') { fab.style.left = '12px'; fab.style.right = ''; }
      else { fab.style.left = ''; fab.style.right = '12px'; }
      const top = clamp(r.top, 60, innerHeight - 80);
      try{ localStorage.setItem(POS_KEY, JSON.stringify({ side, top })); }catch{}
    };

    // pointer + touch
    fab.addEventListener('pointerdown', onDown, {passive:false});
    addEventListener('pointermove', e => onMove(e.clientX, e.clientY), {passive:true});
    addEventListener('pointerup', onUp);
    fab.addEventListener('touchstart', onDown, {passive:false});
    addEventListener('touchmove', e => { const t=e.touches[0]; if(t) onMove(t.clientX, t.clientY); }, {passive:true});
    addEventListener('touchend', onUp);

    // jaga top saat resize/keyboard
    addEventListener('resize', () => {
      const r = fab.getBoundingClientRect();
      fab.style.top = clamp(r.top, 60, innerHeight - 80) + 'px';
    });
  }
})();