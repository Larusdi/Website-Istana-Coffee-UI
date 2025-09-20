/* ==========================================================================
   ISTANA COFFEE – CHAT ASSISTANT (2025)
   Sections:
   1) Core helpers & config
   2) Theme + Accent menus (persist)
   3) Chat state (reset on load) & render
   4) Send, Enter/Shift+Enter, typing, streaming
   5) Attachments (images/files)
   6) Quick replies
   7) Init
   ========================================================================== */

(() => {
  /* =============== 1) Core helpers & config =============== */
  const $  = (s, el=document) => el.querySelector(s);
  const $$ = (s, el=document) => [...el.querySelectorAll(s)];

  const els = {
    scroll:   $('#chatScroll'),
    form:     $('#composer'),
    input:    $('#msgInput'),
    send:     $('#sendBtn'),
    chips:    $('#chips'),
    attach:   $('#attachBtn'),
    file:     $('#fileInput'),
    themeBtn: $('#themeBtn'),
    themePop: $('#themeMenu'),
    colorBtn: $('#colorBtn'),
    colorPop: $('#colorMenu'),
  };

  const root = document.documentElement;
  const STORE_THEME  = 'ic-theme';
  const STORE_ACCENT = 'ic-accent';

  // Balasan cepat (keyword sederhana)
  const brain = (txt) => {
    const t = (txt||'').toLowerCase();
    if(/(menu|best ?seller|rekomendasi)/.test(t))
      return "Best seller kami: Es Kopi Susu Gula Aren, Cappuccino, Signature Latte. Mau reguler atau large?";
    if(/(harga|berapa|price)/.test(t))
      return "Harga mulai Rp18.000–45.000. Es Kopi Susu 18k, Cappuccino 45k. Butuh daftar lengkap?";
    if(/(lokasi|alamat|map|peta)/.test(t))
      return "Alamat: Jambak Asri, Lubuk Alung. Kami siap antar—boleh share pin lokasimu.";
    if(/(jam|buka|operasional|open|close)/.test(t))
      return "Buka Senin–Sabtu 09.00–22.00 WIB. Layanan antar aktif di jam tersebut.";
    if(/(promo|diskon|voucher)/.test(t))
      return "Promo: beli 4 gratis 1 untuk Es Kopi Susu hingga akhir bulan. Mau saya catatkan?";
    if(/(antar|delivery|kirim|ongkir)/.test(t))
      return "Gratis ongkir 2km pertama, di atas itu flat 6k. Kirim titiknya ya.";
    if(/(bayar|pembayaran|qris|ovo|gopay|dana|bank|cash)/.test(t))
      return "Pembayaran: QRIS, OVO, GoPay, Dana, transfer bank, atau tunai. Yang mana nyaman?";
    return "Siap! Tanyakan menu, harga, lokasi, jam, promo, atau minta rekomendasi sesuai seleramu ☕️";
  };

  // Util
  const wait = (ms) => new Promise(r => setTimeout(r, ms));
  const nowLabel = () =>
    new Date().toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'});

  /* =============== 2) Theme + Accent menus (persist) =============== */
  (() => {
    if(!els.themeBtn || !els.themePop || !els.colorBtn || !els.colorPop) return;

    const prefersDark = matchMedia('(prefers-color-scheme: dark)');
    let backdrop = $('.menu__backdrop');
    if(!backdrop){
      backdrop = document.createElement('div');
      backdrop.className = 'menu__backdrop';
      document.body.appendChild(backdrop);
    }

    const applyTheme = (mode) => {
      root.setAttribute('data-theme', mode);
      localStorage.setItem(STORE_THEME, mode);
      root.classList.toggle('is-dark-auto', mode === 'auto' && prefersDark.matches);
      $$('#themeMenu [data-theme]').forEach(b =>
        b.setAttribute('aria-checked', String(b.dataset.theme === mode)));
    };

    const hexToHsl = (hex) => {
      let r=0,g=0,b=0;
      if(hex.length===4){ r="0x"+hex[1]+hex[1]; g="0x"+hex[2]+hex[2]; b="0x"+hex[3]+hex[3]; }
      else{ r="0x"+hex[1]+hex[2]; g="0x"+hex[3]+hex[4]; b="0x"+hex[5]+hex[6]; }
      r/=255; g/=255; b/=255;
      const max=Math.max(r,g,b), min=Math.min(r,g,b);
      let h,s,l=(max+min)/2;
      if(max===min){ h=s=0; }
      else {
        const d=max-min;
        s=l>0.5? d/(2-max-min) : d/(max+min);
        switch(max){ case r:h=(g-b)/d+(g<b?6:0);break; case g:h=(b-r)/d+2;break; default:h=(r-g)/d+4; }
        h/=6;
      }
      return {h:Math.round(h*360), s:Math.round(s*100), l:Math.round(l*100)};
    };

    const setAccent = (hex) => {
      const {h,s,l} = hexToHsl(hex);
      const alt = `hsl(${h} ${Math.max(0,s-4)}% ${Math.max(0,l-6)}%)`;
      root.style.setProperty('--first-color', hex);
      root.style.setProperty('--first-color-alt', alt);
      localStorage.setItem(STORE_ACCENT, hex);
      $$('#colorMenu .swatch').forEach(sw =>
        sw.setAttribute('aria-checked', String(sw.dataset.color.toLowerCase()===hex.toLowerCase())));
    };

    // open/close
    const openMenu  = (btn,pop) => { pop.classList.add('is-open');  btn.setAttribute('aria-expanded','true');  backdrop.classList.add('is-open'); };
    const closeMenu = (btn,pop) => { pop.classList.remove('is-open'); btn.setAttribute('aria-expanded','false'); backdrop.classList.remove('is-open'); };
    const closeAll  = () => {
      [els.themePop, els.colorPop].forEach(p=>p.classList.remove('is-open'));
      [els.themeBtn, els.colorBtn].forEach(b=>b.setAttribute('aria-expanded','false'));
      backdrop.classList.remove('is-open');
    };

    els.themeBtn.addEventListener('click', () => {
      if(els.themePop.classList.contains('is-open')) closeMenu(els.themeBtn, els.themePop);
      else { closeAll(); openMenu(els.themeBtn, els.themePop); }
    });
    els.colorBtn.addEventListener('click', () => {
      if(els.colorPop.classList.contains('is-open')) closeMenu(els.colorBtn, els.colorPop);
      else { closeAll(); openMenu(els.colorBtn, els.colorPop); }
    });
    backdrop.addEventListener('click', closeAll);
    document.addEventListener('keydown', e => { if(e.key==='Escape') closeAll(); });

    els.themePop.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-theme]');
      if(!btn) return;
      applyTheme(btn.dataset.theme);
      closeAll();
    });

    els.colorPop.addEventListener('click', (e) => {
      const sw = e.target.closest('.swatch');
      if(!sw) return;
      setAccent(sw.dataset.color);
      closeAll();
    });

    // load saved
    applyTheme(localStorage.getItem(STORE_THEME) || 'auto');
    const savedAccent = localStorage.getItem(STORE_ACCENT);
    if(savedAccent) setAccent(savedAccent);
    prefersDark.addEventListener('change', () => {
      if(localStorage.getItem(STORE_THEME)==='auto'){
        root.classList.toggle('is-dark-auto', prefersDark.matches);
      }
    });
  })();

  /* =============== 3) Chat state (reset on load) & render =============== */
  // Reset riwayat pada setiap kunjungan
  const resetConversation = () => {
    els.scroll && (els.scroll.innerHTML = '');
    greeting();
  };

  const greeting = () => {
    addMsg('ai',
      "Halo! Saya asisten Istana Coffee. Tanya menu, harga, promo, atau minta rekomendasi—siap bantu ☕️",
    true);
  };

  const addMsg = (role, text, autoscroll=true, attachments=[]) => {
    if(!els.scroll) return;
    const row = document.createElement('div');
    row.className = `msg ${role==='user'?'msg--me':'msg--ai'}`;

    const avatar = document.createElement('div');
    avatar.className = 'msg__avatar';
    avatar.innerHTML = role==='user' ? '<i class="ri-user-3-fill"></i>' : '<i class="ri-robot-2-fill"></i>';
    row.appendChild(avatar);

    const body = document.createElement('div');
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.textContent = text || '';
    body.appendChild(bubble);

    // attachments
    if(attachments.length){
      const wrap = document.createElement('div');
      wrap.className = 'bubble__attachments';
      attachments.forEach(att => wrap.appendChild(att));
      body.appendChild(wrap);
    }

    const time = document.createElement('div');
    time.className = 'time';
    time.textContent = nowLabel();
    body.appendChild(time);

    row.appendChild(body);
    els.scroll.appendChild(row);
    if(autoscroll) scrollToBottom();
    return { row, bubble };
  };

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      els.scroll.scrollTop = els.scroll.scrollHeight;
    });
  };

  // typing indicator
  let typingEl = null;
  const showTyping = () => {
    if(!els.scroll || typingEl) return;
    const row = document.createElement('div');
    row.className = 'typing';
    row.innerHTML = `
      <div class="msg__avatar"><i class="ri-robot-2-fill"></i></div>
      <div class="typing__dots"><span></span><span></span><span></span></div>
    `;
    typingEl = row;
    els.scroll.appendChild(row);
    scrollToBottom();
  };
  const hideTyping = () => { if(typingEl){ typingEl.remove(); typingEl=null; } };

  /* =============== 4) Send, Enter/Shift+Enter, typing, streaming =============== */
  const streamReply = async (fullText) => {
    const { bubble } = addMsg('ai','',true);
    const chars = [...fullText];
    for(let i=0;i<chars.length;i++){
      bubble.textContent += chars[i];
      if(i%3===0) await wait(10);
    }
    scrollToBottom();
  };

  const handleSend = async () => {
    const text = (els.input?.value || '').trim();
    if(!text) return;
    addMsg('user', text);
    els.input.value = ''; autosize();
    showTyping();
    await wait(400 + Math.random()*600);
    hideTyping();
    const answer = brain(text);
    await streamReply(answer);
  };

  const autosize = () => {
    if(!els.input) return;
    els.input.style.height = 'auto';
    els.input.style.height = Math.min(els.input.scrollHeight, 160) + 'px';
  };

  if(els.form){
    els.form.addEventListener('submit', (e) => { e.preventDefault(); handleSend(); });
  }
  if(els.send){
    els.send.addEventListener('click', handleSend);
  }
  if(els.input){
    els.input.addEventListener('input', autosize);
    els.input.addEventListener('keydown', (e) => {
      if(e.key==='Enter' && !e.shiftKey){
        e.preventDefault();
        handleSend();
      }
    });
  }

  /* =============== 5) Attachments (images/files) =============== */
  if(els.attach && els.file){
    els.attach.addEventListener('click', () => els.file.click());
    els.file.addEventListener('change', async (e) => {
      const files = [...(e.target.files || [])];
      if(!files.length) return;

      const nodes = await Promise.all(files.map(async f => {
        if(f.type.startsWith('image/')){
          const img = document.createElement('img');
          img.className = 'att att--image';
          img.alt = f.name;
          img.loading = 'lazy';
          img.src = await readAsDataURL(f);
          return img;
        } else {
          const chip = document.createElement('a');
          chip.className = 'att att--file';
          chip.textContent = f.name;
          chip.href = URL.createObjectURL(f);
          chip.download = f.name;
          chip.title = f.name;
          return chip;
        }
      }));

      addMsg('user', 'Mengirim lampiran', true, nodes);
      showTyping();
      await wait(500 + Math.random()*700);
      hideTyping();
      await streamReply('Lampiran diterima. Kalau perlu, saya bantu catat pesanan dari file/gambar tersebut.');
      els.file.value = '';
    });
  }

  function readAsDataURL(file){
    return new Promise((res,rej)=>{
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = rej;
      r.readAsDataURL(file);
    });
  }

  /* =============== 6) Quick replies =============== */
  if(els.chips){
    els.chips.addEventListener('click', (e) => {
      const btn = e.target.closest('.chip');
      if(!btn) return;
      els.input.value = btn.dataset.text || btn.textContent || '';
      autosize();
      els.input.focus();
    });
  }

  /* =============== 7) Init =============== */
  // Selalu reset chat saat halaman dimuat / kembali ke halaman ini
  try{ localStorage.removeItem('ic-chat'); }catch{}
  resetConversation();

  // Jaga-jaga bila ada bfcache
  window.addEventListener('pageshow', (ev) => {
    if (ev.persisted) resetConversation();
  });
})();


/* ====== THEME & ACCENT MENUS (exclusive open) ====== */
(() => {
  const root = document.documentElement;
  const THEME_KEY = 'ic-theme';
  const ACCENT_KEY = 'ic-accent';
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

  const qs  = (s, el=document) => el.querySelector(s);
  const qsa = (s, el=document) => [...el.querySelectorAll(s)];

  const themeBtn = qs('#themeBtn');
  const themePop = qs('#themeMenu');
  const colorBtn = qs('#colorBtn');
  const colorPop = qs('#colorMenu');

  // Backdrop global
  let backdrop = qs('.menu__backdrop');
  if(!backdrop){
    backdrop = document.createElement('div');
    backdrop.className = 'menu__backdrop';
    document.body.appendChild(backdrop);
  }

  // --- State menu terbuka (null | 'theme' | 'color')
  let openMenu = null;

  function setAria(btn, pop, open){
    btn?.setAttribute('aria-expanded', String(!!open));
    pop?.classList.toggle('is-open', !!open);
    backdrop.classList.toggle('is-open', !!open);
  }
  function close(name){
    if(name === 'theme'){ setAria(themeBtn, themePop, false); }
    if(name === 'color'){ setAria(colorBtn, colorPop, false); }
    if(openMenu === name) openMenu = null;
  }
  function closeAll(){
    close('theme'); close('color');
    backdrop.classList.remove('is-open');
    openMenu = null;
  }
  function toggle(name){
    const target = name === 'theme' ? [themeBtn, themePop] : [colorBtn, colorPop];
    const other  = name === 'theme' ? 'color' : 'theme';
    // tutup yang lain dulu
    close(other);
    const willOpen = openMenu !== name;
    setAria(...target, willOpen);
    openMenu = willOpen ? name : null;
  }

  // --- THEME
  function applyTheme(mode){
    root.setAttribute('data-theme', mode);
    localStorage.setItem(THEME_KEY, mode);
    const syncAuto = () => root.classList.toggle('is-dark-auto', prefersDark.matches);
    if(mode === 'auto'){ syncAuto(); prefersDark.addEventListener('change', syncAuto); }
    else { root.classList.remove('is-dark-auto'); }

    qsa('[data-theme]', themePop).forEach(b => {
      b.setAttribute('aria-checked', String(b.dataset.theme === mode));
    });
  }

  // --- ACCENT
  function hexToHsl(hex){
    let r=0,g=0,b=0;
    if(hex.length===4){ r="0x"+hex[1]+hex[1]; g="0x"+hex[2]+hex[2]; b="0x"+hex[3]+hex[3]; }
    else{ r="0x"+hex[1]+hex[2]; g="0x"+hex[3]+hex[4]; b="0x"+hex[5]+hex[6]; }
    r/=255; g/=255; b/=255;
    const max=Math.max(r,g,b), min=Math.min(r,g,b);
    let h=0,s=0,l=(max+min)/2;
    if(max!==min){
      const d=max-min; s = l>0.5 ? d/(2-max-min) : d/(max+min);
      switch(max){ case r:h=(g-b)/d+(g<b?6:0); break; case g:h=(b-r)/d+2; break; case b:h=(r-g)/d+4; }
      h/=6;
    }
    return {h:Math.round(h*360), s:Math.round(s*100), l:Math.round(l*100)};
  }
  function setAccent(hex){
    localStorage.setItem(ACCENT_KEY, hex);
    const {h,s,l} = hexToHsl(hex);
    root.style.setProperty('--first-color', hex);
    root.style.setProperty('--first-color-alt', `hsl(${h} ${Math.max(0,s-4)}% ${Math.max(0,l-6)}%)`);
    qsa('.swatch', colorPop).forEach(sw => {
      sw.setAttribute('aria-checked', String(sw.dataset.color.toLowerCase() === hex.toLowerCase()));
    });
  }

  // Load persisted
  applyTheme(localStorage.getItem(THEME_KEY) || 'auto');
  const storedAccent = localStorage.getItem(ACCENT_KEY);
  if(storedAccent) setAccent(storedAccent);

  // Open/close handlers
  themeBtn?.addEventListener('click', () => toggle('theme'));
  colorBtn?.addEventListener('click', () => toggle('color'));
  backdrop.addEventListener('click', closeAll);
  document.addEventListener('keydown', (e) => { if(e.key === 'Escape') closeAll(); });

  // Close if click outside popovers & buttons
  document.addEventListener('click', (e) => {
    const withinTheme = themePop.contains(e.target) || themeBtn.contains(e.target);
    const withinColor = colorPop.contains(e.target) || colorBtn.contains(e.target);
    if(!withinTheme && !withinColor) closeAll();
  });

  // Choose theme
  themePop?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-theme]');
    if(!btn) return;
    applyTheme(btn.dataset.theme);
    closeAll();
  });

  // Choose accent
  colorPop?.addEventListener('click', (e) => {
    const sw = e.target.closest('.swatch');
    if(!sw) return;
    setAccent(sw.dataset.color);
    closeAll();
  });
})();