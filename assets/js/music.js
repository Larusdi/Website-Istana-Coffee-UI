
/* ========================================================================
   ISTANA COFFEE • MUSIC MODAL (Fix: title hanya saat playing + reset total)
   ======================================================================== */
(() => {
  const $  = (s, el=document) => el.querySelector(s);
  const $$ = (s, el=document) => [...el.querySelectorAll(s)];
  const fmtTime = (s) => !isFinite(s) ? "0:00" : `${Math.floor(s/60)}:${Math.floor(s%60).toString().padStart(2,'0')}`;
  const setFill = (rangeEl, pct01) => rangeEl?.style?.setProperty('--_val', `${Math.max(0,Math.min(1,pct01))*100}%`);

  /* ---------- Cache buster + lifecycle reset ---------- */
  const DEFAULT_TITLE  = document.title;
  const SESSION_BUSTER = Date.now().toString(36);
  const bust = (url) => { try{const u=new URL(url,location.href);u.searchParams.set('_v',SESSION_BUSTER);return u.toString();}catch{ return url+(url.includes('?')?'&':'?')+'_v='+SESSION_BUSTER; } };
  const hardReset = (audio) => { try{ audio.pause(); audio.currentTime=0; audio.removeAttribute('src'); audio.load(); }catch{} try{ if('mediaSession' in navigator){ navigator.mediaSession.metadata=null; navigator.mediaSession.playbackState='none'; } }catch{} document.title = DEFAULT_TITLE; };
  window.addEventListener('beforeunload', () => hardReset(window.__musicAudio||new Audio()), {capture:true});
  window.addEventListener('pagehide',     () => hardReset(window.__musicAudio||new Audio()), {capture:true});
  window.addEventListener('pageshow', (e) => { if (e.persisted) location.reload(); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') document.title = DEFAULT_TITLE; });

  /* ---------- Elements ---------- */
  const modal   = $('#musicModal'); if (!modal) return;
  const overlay = $('.music-modal__overlay', modal);
  const panel   = $('.music-modal__panel',   modal);
  const btnClose   = $('#musicClose');
  const btnPlay    = $('#btnPlay');
  const btnPrev    = $('#btnPrev');
  const btnNext    = $('#btnNext');
  const btnShuffle = $('#btnShuffle');
  const btnRepeat  = $('#btnRepeat');
  const btnMute    = $('#btnMute');
  const seek = $('#seek');  const vol  = $('#volume');
  const tCur = $('#timeCurrent'); const tTot = $('#timeTotal');
  const cover  = $('#musicCover'); const tTitle = $('#musicTitle'); const tArtist = $('#musicArtist');
  const queue  = $('#musicQueue');

  const musicBtn = document.querySelector(
    '.footer__social .footer__social-link[aria-label*="Musik"],' +
    '.footer__social .footer__social-link[title*="Musik"],' +
    '.footer__social .ri-music-2-fill'
  );
  const trigger = musicBtn?.closest('.footer__social-link') || musicBtn || null;

  /* ---------- Audio & state ---------- */
  const audio = new Audio(); window.__musicAudio = audio;
  audio.preload = 'metadata';

  const STORE = 'ic-music';
  const saveState = (o) => { try{ const p=JSON.parse(localStorage.getItem(STORE)||'{}'); localStorage.setItem(STORE, JSON.stringify({...p,...o})); }catch{} };
  const readState = () => { try{ return JSON.parse(localStorage.getItem(STORE)||'{}'); }catch{ return {}; } };

  let index = 0, isShuffle = false, repeatMode = 'off';
  let releaseFocusTrap = () => {}; let bodyOverflowPrev = '';

  const trapFocus = (el) => {
    const sel = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
    const c = $$(sel, el).filter(n => n.offsetParent !== null);
    if (!c.length) return () => {};
    const first = c[0], last = c[c.length-1];
    const onKey = (e) => { if (e.key !== 'Tab') return; if (e.shiftKey && document.activeElement===first){e.preventDefault();last.focus();} else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first.focus();} };
    el.addEventListener('keydown', onKey); requestAnimationFrame(() => first.focus());
    return () => el.removeEventListener('keydown', onKey);
  };

  /* ---------- Playlist ---------- */
  const tracks = [
    { title:'Tapi Tahukah Kamu', artist:'Dygta ft Kamasean',             src:'https://dqyenorycxhffqjvcoqf.supabase.co/storage/v1/object/public/Music/Musik%20Istana-Coffee/lagu-1.mp3', cover:'assets/img/covers/tapi-tahukah-kamu.jpg' },
    { title:'Sebatas Mimpi',       artist:'Angie Carvalho, Yovie Widianto', src:'https://dqyenorycxhffqjvcoqf.supabase.co/storage/v1/object/public/Music/Musik%20Istana-Coffee/lagu-2.mp3', cover:'assets/img/covers/sebatas-mimpi.jpg' },
    { title:'Tanpa Cinta',         artist:'Tiara Andini, Yovie Widianto',   src:'https://dqyenorycxhffqjvcoqf.supabase.co/storage/v1/object/public/Music/Musik%20Istana-Coffee/lagu-4.mp3', cover:'assets/img/covers/tanpa-cinta.jpg' },
    { title:'Tak Kan Terganti',    artist:'Shabrina Leanor, Yovie Widianto',src:'https://dqyenorycxhffqjvcoqf.supabase.co/storage/v1/object/public/Music/Musik%20Istana-Coffee/lagu-5.mp3', cover:'assets/img/covers/tak-kan-terganti.jpg' },
    { title:'Bukan Cinta Biasa',   artist:'Afgan',                          src:'https://dqyenorycxhffqjvcoqf.supabase.co/storage/v1/object/public/Music/Musik%20Istana-Coffee/lagu-6.mp3', cover:'assets/img/covers/bukan-cinta-biasa.jpg' },
    { title:'Terlalu Cinta',       artist:'Bagas Ran, Rossa',               src:'https://dqyenorycxhffqjvcoqf.supabase.co/storage/v1/object/public/Music/Musik%20Istana-Coffee/lagu-3.mp3', cover:'assets/img/covers/terlalu-cinta.jpg' },
    { title:'Cinta Terakhirku',    artist:'Bagas Ran ft Anggis Devaki',     src:'https://dqyenorycxhffqjvcoqf.supabase.co/storage/v1/object/public/Music/Musik%20Istana-Coffee/lagu-7.mp3', cover:'assets/img/covers/cinta-terakhirku.jpg' },
  ];

  const buildQueue = () => {
    queue.innerHTML = '';
    const frag = document.createDocumentFragment();
    tracks.forEach((t,i) => {
      const li = document.createElement('li');
      li.dataset.index = i;
      li.innerHTML = `
        <div class="track-cover" style="background-image:url('${t.cover||''}')"></div>
        <div class="track-meta">
          <span class="track-title">${t.title}</span>
          <span class="track-artist">${t.artist}</span>
        </div>
        <span class="track-duration" data-time>--:--</span>`;
      li.addEventListener('click', () => load(i, true), {passive:true});
      frag.appendChild(li);

      const a = new Audio(); a.preload='metadata'; a.src=bust(t.src);
      a.addEventListener('loadedmetadata', () => { const tt=li.querySelector('[data-time]'); if(tt) tt.textContent=fmtTime(a.duration); }, {once:true});
    });
    queue.appendChild(frag);
  };

  const markActive = () => {
    $$('#musicQueue li').forEach(li => {
      const active = Number(li.dataset.index) === index;
      li.classList.toggle('is-active', active);
      if (active) li.scrollIntoView({block:'nearest', behavior:'smooth'});
    });
  };

  /* ---------- Title & Media Session: hanya saat playing & modal terbuka ---------- */
  const trackNow = () => tracks[index];
  const updateTitle = () => {
    if (modal.classList.contains('is-open') && !audio.paused) {
      const t = trackNow();
      document.title = `🎵 ${t.title} • ${t.artist} — Istana Coffee`;
    } else {
      document.title = DEFAULT_TITLE;
    }
  };
  const applyMediaSession = () => {
    if (!('mediaSession' in navigator)) return;
    const t = trackNow();
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: t.title, artist: t.artist,
        artwork: [{ src: t.cover, sizes:'512x512', type:'image/jpeg' }]
      });
      navigator.mediaSession.setActionHandler('play',  play);
      navigator.mediaSession.setActionHandler('pause', pause);
      navigator.mediaSession.setActionHandler('previoustrack', prev);
      navigator.mediaSession.setActionHandler('nexttrack',     next);
      navigator.mediaSession.playbackState = audio.paused ? 'paused' : 'playing';
    } catch {}
  };

  /* ---------- Core ---------- */
  const load = (i, autoplay=false) => {
    index = i; const t = tracks[index];
    audio.src = bust(t.src); // anti cache
    tTitle.textContent = t.title; tArtist.textContent = t.artist;
    cover.style.backgroundImage = `url('${t.cover||''}')`;
    markActive();
    tCur.textContent='0:00'; tTot.textContent='0:00';
    seek.value=0; setFill(seek,0);
    if (autoplay) play();
    else updateTitle();            // <- tidak mengganti judul tab bila belum memutar
    saveState({ index });
  };

  const play = async () => {
    try {
      await audio.play();
      btnPlay.innerHTML = '<i class="ri-pause-fill"></i>';
      btnPlay.setAttribute('aria-label','Jeda');
      applyMediaSession();
      updateTitle();
    } catch {}
  };
  const pause = () => {
    audio.pause();
    btnPlay.innerHTML = '<i class="ri-play-fill"></i>';
    btnPlay.setAttribute('aria-label','Putar');
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState='paused';
    updateTitle();
  };
  const togglePlay = () => audio.paused ? play() : pause();

  const next = () => {
    if (repeatMode === 'one') return play();
    if (isShuffle){ let n; do{ n=Math.floor(Math.random()*tracks.length); }while(n===index && tracks.length>1); load(n,true); }
    else{ if(index<tracks.length-1) load(index+1,true); else if(repeatMode==='all') load(0,true); }
  };
  const prev = () => {
    if (audio.currentTime>3){ audio.currentTime=0; return; }
    if (isShuffle){ let p; do{ p=Math.floor(Math.random()*tracks.length); }while(p===index && tracks.length>1); load(p,true); }
    else{ if(index>0) load(index-1,true); else if(repeatMode==='all') load(tracks.length-1,true); }
  };

  /* ---------- UI bindings ---------- */
  seek.addEventListener('input', () => { const pct=Number(seek.value)/100; setFill(seek,pct); audio.currentTime=pct*(audio.duration||0); }, {passive:true});
  vol.addEventListener('input',  () => { audio.volume=Number(vol.value)/100; setFill(vol,audio.volume);
    btnMute.innerHTML = audio.volume===0?'<i class="ri-volume-mute-fill"></i>':'<i class="ri-volume-up-fill"></i>'; saveState({volume:audio.volume}); }, {passive:true});
  btnMute.addEventListener('click', () => {
    if (audio.volume>0){ audio.dataset.prevVol=audio.volume; audio.volume=0; vol.value=0; setFill(vol,0); btnMute.innerHTML='<i class="ri-volume-mute-fill"></i>'; }
    else{ const v=Math.max(.1, Number(audio.dataset.prevVol||.8)); audio.volume=v; vol.value=Math.round(v*100); setFill(vol,v); btnMute.innerHTML='<i class="ri-volume-up-fill"></i>'; }
    saveState({volume:audio.volume});
  });
  btnShuffle.addEventListener('click', () => { isShuffle=!isShuffle; btnShuffle.setAttribute('aria-pressed', String(isShuffle)); saveState({shuffle:isShuffle}); });
  btnRepeat.addEventListener('click',  () => {
    repeatMode = repeatMode==='off'?'all':repeatMode==='all'?'one':'off';
    btnRepeat.dataset.mode=repeatMode; btnRepeat.setAttribute('aria-pressed', String(repeatMode!=='off'));
    btnRepeat.title = repeatMode==='one'?'Repeat: one':repeatMode==='all'?'Repeat: all':'Repeat: off';
    saveState({repeat:repeatMode});
  });
  btnPlay.addEventListener('click', togglePlay);
  btnNext.addEventListener('click', next);
  btnPrev.addEventListener('click', prev);

  audio.addEventListener('timeupdate', () => {
    tCur.textContent = fmtTime(audio.currentTime);
    tTot.textContent = fmtTime(audio.duration);
    const pct = audio.duration ? (audio.currentTime/audio.duration) : 0;
    seek.value=pct*100; setFill(seek,pct);
  });
  audio.addEventListener('loadedmetadata', () => { tTot.textContent = fmtTime(audio.duration); });
  audio.addEventListener('ended', () => { if (repeatMode==='one'){ play(); return; } if (isShuffle||repeatMode==='all'||index<tracks.length-1) next(); else pause(); });
  audio.addEventListener('error', () => next());

  /* ---------- Modal ---------- */
  const openModal = () => {
    if (modal.classList.contains('is-open')) return;
    modal.classList.add('is-open'); modal.setAttribute('aria-hidden','false');
    bodyOverflowPrev = document.body.style.overflow; document.body.style.overflow='hidden';
    releaseFocusTrap = trapFocus(panel);
    setFill(seek, (audio.duration?audio.currentTime/audio.duration:0)); setFill(vol, audio.volume ?? .8);
    updateTitle();
  };
  const closeModal = () => {
    modal.classList.remove('is-open'); modal.setAttribute('aria-hidden','true');
    document.body.style.overflow = bodyOverflowPrev || '';
    releaseFocusTrap(); updateTitle();
  };
  overlay.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeModal(); });
  btnClose.addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('is-open')) return;
    if (e.key==='Escape') closeModal();
    const tag=(e.target.tagName||'').toLowerCase(); if(tag==='input'||tag==='textarea') return;
    if (e.key===' ') { e.preventDefault(); togglePlay(); }
    if (e.key==='ArrowRight') audio.currentTime=Math.min((audio.currentTime||0)+5,audio.duration||0);
    if (e.key==='ArrowLeft')  audio.currentTime=Math.max((audio.currentTime||0)-5,0);
    if (e.key==='ArrowUp')   { const v=Math.min((audio.volume||0)+.1,1); audio.volume=v; vol.value=Math.round(v*100); setFill(vol,v); saveState({volume:v}); }
    if (e.key==='ArrowDown') { const v=Math.max((audio.volume||0)-.1,0); audio.volume=v; vol.value=Math.round(v*100); setFill(vol,v); saveState({volume:v}); }
    if (e.key.toLowerCase()==='m') btnMute.click();
    if (e.key.toLowerCase()==='s') btnShuffle.click();
    if (e.key.toLowerCase()==='r') btnRepeat.click();
  });
  trigger?.addEventListener('click', (e) => { e.preventDefault(); modal.getAttribute('aria-hidden')==='true'?openModal():closeModal(); });

  /* ---------- Init (selalu mulai dari track 0) ---------- */
  const { volume, shuffle, repeat } = readState();
  audio.volume = (typeof volume==='number') ? Math.max(0,Math.min(1,volume)) : .8;
  vol.value = Math.round(audio.volume*100); setFill(vol, audio.volume);
  isShuffle = !!shuffle; btnShuffle.setAttribute('aria-pressed', String(isShuffle));
  repeatMode = ['off','all','one'].includes(repeat) ? repeat : 'off';
  btnRepeat.dataset.mode = repeatMode; btnRepeat.setAttribute('aria-pressed', String(repeatMode!=='off'));
  btnRepeat.title = repeatMode==='one'?'Repeat: one':repeatMode==='all'?'Repeat: all':'Repeat: off';

  buildQueue();
  load(0, false);         // <- tidak mengubah title
  document.title = DEFAULT_TITLE; // pastikan default saat awal

})();
