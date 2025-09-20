/*=============== JAM OPERATIONAL ===============*/
(function () {
    const elH = document.getElementById('wcHour');
    const elM = document.getElementById('wcMinute');
    const elS = document.getElementById('wcSecond');
    const daySpan = document.getElementById('wibDay');
    const timeSpan = document.getElementById('wibTime');
    const badge = document.getElementById('openStatus');
    const label = badge ? badge.querySelector('.label') : null;

    const fmt = (opts) => new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', ...opts });

    const pad = (n) => String(n).padStart(2, '0');
    const cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

    function getWIBParts() {
    const now = new Date();
    return {
        hour: parseInt(fmt({ hour: '2-digit', hour12: false }).format(now), 10),
        min: parseInt(fmt({ minute: '2-digit' }).format(now), 10),
        sec: parseInt(fmt({ second: '2-digit' }).format(now), 10),
        wk: fmt({ weekday: 'long' }).format(now)
    };
    }

    function update() {
    const { hour, min, sec, wk } = getWIBParts();

    const hDeg = (hour % 12) * 30 + min * 0.5;
    const mDeg = min * 6;
    const sDeg = sec * 6;
    if (elH) elH.style.transform = `translate(-50%, -100%) rotate(${hDeg}deg)`;
    if (elM) elM.style.transform = `translate(-50%, -100%) rotate(${mDeg}deg)`;
    if (elS) elS.style.transform = `translate(-50%, -100%) rotate(${sDeg}deg)`;

    if (daySpan) daySpan.textContent = cap(wk);
    if (timeSpan) timeSpan.textContent = `${pad(hour)}:${pad(min)}:${pad(sec)}`;

    const openToday = wk !== 'Minggu';
    const isOpen = openToday && hour >= 9 && hour < 22;

    if (badge && label) {
        badge.classList.toggle('open', isOpen);
        badge.classList.toggle('closed', !isOpen);
        label.textContent = isOpen ? 'Buka sekarang' : 'Tutup';
        badge.setAttribute('aria-label', isOpen ? 'Status: buka' : 'Status: tutup');
    }
    }

    update();
    setInterval(update, 1000);
})();

/*=============== KONTEN SLIDE OTOMATIS DI POPULAR ===============*/
const popular2025 = new Swiper('#popular-2025 .popular-2025__swiper', {
    loop: true,
    loopAdditionalSlides: 6,
    loopPreventsSliding: false,

    speed: 600,
    grabCursor: true,
    watchSlidesProgress: true,

    autoplay: {
    delay: 2800,
    disableOnInteraction: false,
    pauseOnMouseEnter: true
    },

    slidesPerView: 1,
    slidesPerGroup: 1,
    centeredSlides: false,
    spaceBetween: 0,

    breakpoints: {
    768: { slidesPerView: 2, slidesPerGroup: 1, centeredSlides: true, spaceBetween: 20 },
    1024: { slidesPerView: 3, slidesPerGroup: 1, centeredSlides: true, spaceBetween: 24 }
    },

    pagination: {
    el: '#popular-2025 .popular-2025__pagination',
    clickable: true,
    dynamicBullets: true
    }
});

document.addEventListener('visibilitychange', () => {
    if (document.hidden) popular2025.autoplay.stop();
    else popular2025.autoplay.start();
});
popular2025.on('touchEnd', () => popular2025.autoplay.start());

/*=============== TEKS BERJALAN DI HALAMAN POPULAR ===============*/
(function () {
    const root = document.querySelector('#popular-2025 #addons-marquee');
    if (!root) return;

    const viewport = root.querySelector('.popular-2025__addons-viewport');
    const track = root.querySelector('.popular-2025__addons-track');
    const first = track.querySelector('.popular-2025__addons-item');
    const second = first?.nextElementSibling || first?.cloneNode(true);

    let flipAlt = true;

    const getGap = () => {
    const g = getComputedStyle(track).gap || '0';
    return parseFloat(g) || 0;
    };

    const getPxPerSec = () => {
    const w = window.innerWidth;
    if (w <= 480) return 70;
    if (w <= 768) return 85;
    if (w <= 1024) return 100;
    return 115;
    };

    const ensureLength = (cycle) => {
    while (track.scrollWidth < viewport.offsetWidth + cycle * 2) {
        const c1 = first.cloneNode(true);
        c1.setAttribute('aria-hidden', 'true');
        if (flipAlt) c1.classList.add('is-alt'); else c1.classList.remove('is-alt');
        track.appendChild(c1);
        flipAlt = !flipAlt;

        const c2 = second.cloneNode(true);
        c2.setAttribute('aria-hidden', 'true');
        if (flipAlt) c2.classList.add('is-alt'); else c2.classList.remove('is-alt');
        track.appendChild(c2);
        flipAlt = !flipAlt;
    }
    };

    const setVars = () => {
    const gap = getGap();
    const w1 = first.getBoundingClientRect().width;
    const w2 = (second && second !== first) ? second.getBoundingClientRect().width : w1;
    const cycle = Math.round(w1 + gap + w2 + gap);

    const pxps = getPxPerSec();
    const duration = Math.max(16, Math.round((track.scrollWidth || (cycle * 4)) / pxps));

    root.style.setProperty('--marquee-cycle', cycle + 'px');
    root.style.setProperty('--marquee-speed', duration + 's');
    return cycle;
    };

    const init = () => {
    const prevState = track.style.animationPlayState;
    track.style.animationPlayState = 'paused';
    track.style.animation = 'none'; void track.offsetWidth;
    const cycle = setVars();
    ensureLength(cycle);
    track.style.animation = '';
    track.style.animationPlayState = prevState || 'running';
    };

    let t;
    const onResize = () => { clearTimeout(t); t = setTimeout(init, 120); };

    init();
    window.addEventListener('resize', onResize, { passive: true });
})();



/*=============== BALON TEKS ORANG DI TENTANG KAMI ===============*/
(function () {
    const scope = document.querySelector('#about-2025 .about-2025__bubble-anchor');
    if (!scope) return;

    const bubble = scope.querySelector('.about-2025__bubble');

    const phrases = [
    "Aroma hangat, cerita baru hadir",
    "Biji terpilih, kualitas utama",
    "Seduh presisi, rasa konsisten",
    "Manis seimbang, pahit elegan",
    "Istirahat sejenak, teguk damai"
    ];

    const FIRST_DELAY_MS = 5000;
    const SHOW_MS = 10000;
    const GAP_MS = 10000;

    let i = 0, timer;

    const show = () => {
    bubble.textContent = phrases[i % phrases.length];
    bubble.classList.add('is-visible');

    timer = setTimeout(() => {
        bubble.classList.remove('is-visible');
        i++;
        timer = setTimeout(show, GAP_MS);
    }, SHOW_MS);
    };

    timer = setTimeout(show, FIRST_DELAY_MS);

    document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        clearTimeout(timer);
        bubble.classList.remove('is-visible');
    } else {
        clearTimeout(timer);
        timer = setTimeout(show, 800);
    }
    });
})();



/*=============== BALON TEKS KARYAWAN DAN KURIR ===============*/
(function () {
    const staff = document.getElementById('bubble-staff');
    const courier = document.getElementById('bubble-courier');
    if (!staff || !courier) return;

    const dialog = [
    // 1 (intro perkenalan)
    { el: staff, text: "Perkenalkan, saya Riski karyawan baru di Istana Coffee. 😊" },
    { el: staff, text: "Saya di rekrut langsung oleh Owner Bpk. Latif Rusdi. 😊" },
    { el: courier, text: "Owhh yaa... saya Roy kurir antar pesanan di Istana Coffee ini. 😁" },
    { el: courier, text: "Senang bertemu dengan mu, Sudah berapa hari kamu kerja disini? 🤗" },
    { el: staff, text: "Saya baru bekerja disini sudah memasuki hari ke 3 di Istana Coffee ini." },
    { el: courier, text: "Owhh... Masih baru ya kerja disini, Mudah-mudahan kamu nyaman ya kerja disini. 😊" },
    { el: staff, text: "Siap mas... Pesanan nya lagi di bikin ya mas, tunggu sebentar! 🙏🏻" },
    { el: courier, text: "Ohh iya gak pp, Sebelum nya kamu kerja dimana?" },
    { el: staff, text: "Sebelum nya aku kerja jadi sales rokok, Selama 2 Tahun." },
    { el: courier, text: "Owhh... Baguslah yaa 😊, Jadi kerja disini hati-hati ya." },
    { el: staff, text: "Siap Mas... Saya akan kerja keras dan displin dan bertanggung jawab." },
    { el: courier, text: "(Ini orang gak tau ya kalau disini kerja di kondisikan sama atasan nya.) 🤔" },
    { el: staff, text: "Kenapa diam Mas?" },
    { el: courier, text: "Ehh... anu itu apa yaa..., Initinya kamu yang rajin aja disini. 💪" },
    { el: staff, text: "Iya Mas saya juga baru disini, jadi butuh arahan juga dari senior dan atasan saya." },
    { el: courier, text: "hehe... Owhh iya bagus yaa, Mantap. 👍" },
    { el: courier, text: "(Bilang gak ya?, Ahh gak usah deh, Biarkan dia sendiri yang tau!) 🤔" },
    { el: staff, text: "Owhh iya Mas... Mas nya udah lama ya jadi kurir di Istana Coffee ini?" },
    { el: courier, text: "Udah lama saya disini Bang, Hampir 3 tahun disini. 🥱" },
    { el: staff, text: "Waduh lama juga ya... Pasti udah banyak itu pengalaman nya!" },
    { el: courier, text: "yaa... Gimana lagi bang namanya juga mencari uang untuk keluarga tercinta. 😁" },
    { el: courier, text: "Yang penting halal, Cari kerja susah, Ya syukuri aja selagi bekerja. 🤗" },
    { el: staff, text: "Iya ya Mas... Saya juga lagi berjuang mas untuk keluarga saya juga." },
    { el: courier, text: "Iya dong kita Laki-laki ini harus semangat bekerja bekerja dan bekerja. 😁" },
    { el: staff, text: "Hehehe... Iya mas, selagi kuat jangan menyerah. 💪" },
    { el: courier, text: "Itu Bpk. Latif Rusdi itu memang kreatif dia itu, Saya juga udah lama kenal sama beliau." },
    { el: staff, text: "Owhh... Gtu ya mas." },
    { el: courier, text: "Betul, Pak Latif memang kreatif, saya lama kenal beliau dari komunitas kopi lokal." },
    { el: staff, text: "Ooh begitu, Mas. Beliau merekrut saya di sini karena keahlian Desain dan operasional program." },

    // 2
    { el: staff, text: "Beliau minta platform adaptif. Menurut Mas, prioritas transformasi digital minggu ini apa saja?" },
    { el: courier, text: "Tracking pengiriman realtime, katalog dinamis, program loyalti—semua tersinkron dengan inventori dan kasir." },
    { el: courier, text: "Perlu saya bantu koordinasi konten hero dan foto produk terbaru biar rapi?" },
    { el: staff, text: "Iya. Tampilkan roastery, profil petani mitra, serta promo musiman—tone hangat dan bersih." },
    // 3
    { el: staff, text: "Bagaimana menjaga suhu minuman saat pengantaran jarak agak jauh?" },
    { el: courier, text: "Kami pakai sleeve insulasi, segel rapat, rute tercepat berbasis GPS." },
    { el: courier, text: "Perlu es terpisah agar tekstur tetap pas?" },
    { el: staff, text: "Ya, es terpisah, hindari watery." },

    // 4
    { el: staff, text: "Estimasi sampai daerah Lubuk Alung sore ini berapa menit?" },
    { el: courier, text: "Di jam normal empat puluh menit; macet, kami update realtime." },
    { el: courier, text: "Pembayaran QRIS, tunai, atau transfer bank pilihan Anda?" },
    { el: staff, text: "QRIS saja, cepat tanpa kontak." },

    // 5
    { el: staff, text: "Apakah kemasan terbaru sudah pakai material ramah lingkungan bersertifikat?" },
    { el: courier, text: "Benar, cup PLA, sedotan kertas, sleeve daur ulang, sertifikasi aman." },
    { el: courier, text: "Ingin kartu loyalti digital untuk poin tiap pembelian?" },
    { el: staff, text: "Tentu, aktifkan pada nomor ini." },

    // 6
    { el: staff, text: "Ada promo musiman spesial Ramadan untuk varian susu nabati?" },
    { el: courier, text: "Ada bundle dua gelas, diskon lima belas persen, oat atau almond." },
    { el: courier, text: "Kapan jadwalkan langganan mingguan untuk kantor Anda?" },
    { el: staff, text: "Setiap Senin pagi, sebelum rapat." },

    // 7
    { el: staff, text: "Bagaimana prosedur quality check sebelum pesanan naik kendaraan?" },
    { el: courier, text: "Barista cek suhu, rasa, segel; saya foto bukti pengerjaan." },
    { el: courier, text: "Perlu catatan khusus pada label pengiriman hari ini?" },
    { el: staff, text: "Tuliskan tanpa gula, ekstra shot." },

    // 8
    { el: staff, text: "Apakah rute membawa melewati jalan rusak, risiko tumpah meningkat?" },
    { el: courier, text: "Kami hindari, pakai rute kota; holder anti slip terpasang." },
    { el: courier, text: "Perlu panggilan dulu saat tiba di lokasi?" },
    { el: staff, text: "Ya, telepon dua menit sebelum." },

    // 9
    { el: staff, text: "Bila hujan deras, strategi menjaga paket tetap kering bagaimana?" },
    { el: courier, text: "Box kedap air, rain cover ganda, buffer foam, prioritas kecepatan." },
    { el: courier, text: "Ada pesanan tambahan menit terakhir sebelum berangkat?" },
    { el: staff, text: "Tambahkan croissant almond satu." },

    // 10
    { el: staff, text: "Untuk stok sirup musiman, varian mana paling direkomendasikan?" },
    { el: courier, text: "Caramel salted homemade, bahan natural, konsisten, tidak terlalu manis." },
    { el: courier, text: "Perlu kemasan gift box premium?" },
    { el: staff, text: "Ya, untuk pelanggan langganan." },

    // 11
    { el: staff, text: "Bagaimana pelacakan pesanan, apakah pelanggan menerima link realtime?" },
    { el: courier, text: "Kami kirim tautan live tracking, estimasi dinamis berbasis lalu lintas." },
    { el: courier, text: "Aktifkan juga notifikasi SMS pelanggan?" },
    { el: staff, text: "Aktifkan, pakai nomor yang sama." },

    // 12
    { el: staff, text: "Ada feedback pelanggan kemarin tentang Latte Vanila low sugar?" },
    { el: courier, text: "Nilai rata-rata tinggi; puji body, aftertaste bersih, manis seimbang." },
    { el: courier, text: "Mau kita pertahankan rasio sirup saat ini?" },
    { el: staff, text: "Ya, pertahankan formulanya." },

    // 13
    { el: staff, text: "Program sedekah kopi Jumat masih berjalan di cabang utama?" },
    { el: courier, text: "Masih; setiap pembelian, satu cangkir dibagikan ke relawan." },
    { el: courier, text: "Apakah ingin kami dokumentasikan kegiatannya?" },
    { el: staff, text: "Tolong ambil beberapa foto." },

    // 14
    { el: staff, text: "Apakah motor sudah servis, ban dan rem aman untuk rute malam?" },
    { el: courier, text: "Sudah servis lengkap; tekanan ban tepat, rem responsif, lampu terang." },
    { el: courier, text: "Butuh helm ekstra untuk penumpang?" },
    { el: staff, text: "Tidak, single delivery saja." },

    // 15
    { el: staff, text: "Sebelum berangkat, ada hal lain perlu dipastikan oleh tim?" },
    { el: courier, text: "Kuantitas, suhu, label alergi, pembayaran terkonfirmasi; siap berangkat." },
    { el: courier, text: "Boleh konfirmasi titik serah depan lobi?" },
    { el: staff, text: "Betul, lobi utama." }
    ];

    const WAIT_MS = 10000;  // jeda sebelum bubble muncul
    const SHOW_MS = 6000;  // durasi bubble terlihat

    let i = 0;
    function cycle() {
    const { el, text } = dialog[i % dialog.length];

    setTimeout(() => {
        el.textContent = text;
        el.classList.add('is-visible');

        setTimeout(() => {
        el.classList.remove('is-visible');
        i++;
        cycle();
        }, SHOW_MS);

    }, WAIT_MS);
    }
    cycle();
})();

/* ===== MODAL TOMBOL MENU DI HP ===== */
(() => {
  const $  = (s, el=document) => el.querySelector(s);
  const $$ = (s, el=document) => [...el.querySelectorAll(s)];

  const sheet     = $('#navsheet');
  const panel     = $('.navsheet__panel', sheet);
  const overlay   = $('.navsheet__overlay', sheet);
  const closeBtn  = $('#navsheet-close');
  const toggleBtn = $('#nav-toggle');
  const header    = $('#header'); // dipakai buat class sinkron

  if(!sheet || !toggleBtn) return;

  const open = () => {
    sheet.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    header?.classList.add('navsheet--open');     // buat animasi toggle “tenggelam”
  };
  const close = () => {
    sheet.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    header?.classList.remove('navsheet--open');
  };
  const isOpen = () => sheet.getAttribute('aria-hidden') === 'false';

  // Toggle
  toggleBtn.addEventListener('click', () => (isOpen() ? close() : open()));

  // Tutup: overlay, tombol X, Escape
  overlay?.addEventListener('click', e => { if(e.target.dataset.close) close(); });
  closeBtn?.addEventListener('click', close);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && isOpen()) close(); });

  // Klik item: tutup lalu smooth scroll (kalau anchor di halaman yang sama)
  $$('.navsheet__item').forEach(a => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href') || '';
      if(href.startsWith('#')){
        e.preventDefault();
        const el = document.querySelector(href);
        close();
        if(el){
          setTimeout(() => {
            const offset = (document.querySelector('.pvbar')?.offsetHeight || 64) + 8;
            const top = window.scrollY + el.getBoundingClientRect().top - offset;
            window.scrollTo({ top, behavior:'smooth' });
          }, 260); // beri waktu panel menutup
        }
      } else {
        // kalau link ke page lain, tetap tutup
        close();
      }
    });
  });
})();

/* ===== SUBSCRIBE ===== */
document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('.footer__form');
    if (!form) return;

    const input = form.querySelector('input[type="email"]') || form.querySelector('.footer__input');
    const btn = form.querySelector('.footer__button');

    // ========= KONFIG =========
    const GMAIL_TO = 'latifrusdi@gmail.com';
    const SUBJECT = 'Newsletter — Istana Coffee';
    const USE_GMAIL_UI = true;   // true: Gmail compose, false: mailto
    const TOAST_MS = 1800;
    // ==========================

    // Inject CSS toast (biar pasti muncul)
    const ensureToastCss = () => {
    if (document.getElementById('toast-css')) return;
    const css = `
#toast-wrap{position:fixed;left:50%;bottom:max(12px,env(safe-area-inset-bottom,0));
transform:translateX(-50%);display:flex;flex-direction:column;gap:8px;z-index:2147483647;pointer-events:none}
.toast{max-width:min(92vw,560px);padding:10px 14px;border-radius:12px;background:rgba(15,15,16,.92);
color:#fff;font-weight:800;text-align:center;border:1px solid rgba(255,255,255,.12);
box-shadow:0 12px 30px rgba(0,0,0,.35);transform:translateY(12px);opacity:0;
transition:transform .25s ease,opacity .25s ease;pointer-events:auto}
.toast--show{transform:translateY(0);opacity:1}
.toast--success{border-color:rgba(16,185,129,.35)}
.toast--error{border-color:rgba(239,68,68,.35)}
.toast--warn{border-color:rgba(245,158,11,.35)}
`;
    const style = document.createElement('style');
    style.id = 'toast-css';
    style.textContent = css;
    document.head.appendChild(style);
    };
    ensureToastCss();

    const toast = (text, type = 'info', ms = TOAST_MS) => {
    let wrap = document.getElementById('toast-wrap');
    if (!wrap) {
        wrap = document.createElement('div');
        wrap.id = 'toast-wrap';
        wrap.setAttribute('aria-live', 'polite');
        document.body.appendChild(wrap);
    }
    const el = document.createElement('div');
    el.className = `toast toast--${type}`;
    el.textContent = text;
    wrap.appendChild(el);
    requestAnimationFrame(() => el.classList.add('toast--show'));
    setTimeout(() => {
        el.classList.remove('toast--show');
        setTimeout(() => el.remove(), 250);
    }, ms);
    };

    const emailOk = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test((v || '').trim());

    // Jangan disable tombol — validasi saat submit
    form.setAttribute('novalidate', '');

    form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = (input.value || '').trim();

    if (!email) { toast('Isi email dulu ya ☕', 'warn'); input.focus(); return; }
    if (!emailOk(email)) { toast('Format email belum valid', 'warn'); input.focus(); return; }

    btn.textContent = 'Mengirim…';

    const body = `Email pendaftar: ${email}`;
    const url = USE_GMAIL_UI
        ? `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(GMAIL_TO)}&su=${encodeURIComponent(SUBJECT)}&body=${encodeURIComponent(body)}`
        : `mailto:${encodeURIComponent(GMAIL_TO)}?subject=${encodeURIComponent(SUBJECT)}&body=${encodeURIComponent(body)}`;

    const win = window.open(url, '_blank', 'noopener');

    // bersihkan total
    form.reset();
    input.blur();
    btn.textContent = 'Daftar';

    toast('Terima kasih! Pendaftaran dikirim.', 'success');

    if (!win) {
        toast('Popup diblokir — izinkan pop-up untuk kirim via Gmail.', 'warn', 2600);
    }
    });
});


/* ===== RESPONSIVE MINIMIZE ===== */
const mqDesktop = window.matchMedia('(min-width: 769px)');

const handleViewport = (e) => {
  if (e.matches) {           // sekarang desktop
    sheet?.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    header?.classList.remove('navsheet--open');
  }
};

// jalankan saat load & saat berubah
mqDesktop.addEventListener('change', handleViewport);
handleViewport(mqDesktop);