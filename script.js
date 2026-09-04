// ========= SHEETS CONFIG =========
const SHEET_ID = window.CONFIG?.sheetIdProducts || "1bdnXrwr84blKbZVQR0LRS0gDrQ2Arh8v-MmLAJK4Y84";
const SHEET_NAME = window.CONFIG?.sheetNameProducts || "Produk";
const SHEET_TNC_NAME = window.CONFIG?.sheetNameTnc || "tnc";
const DEFAULT_WA = window.CONFIG?.whatsappNumber || "6283865477000";
const SHEET_JSON_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(SHEET_NAME)}`;
const SHEET_TNC_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(SHEET_TNC_NAME)}`;

// ========= STATE =========
let produkVariants = []; // tiap baris sheet = varian
let produkGroups = [];   // hasil dikelompokkan per kolom group
let viewData = [];
let page = 1;
const perPage = 12;

const CART_KEY = "pbt_cart";
const WISH_KEY = "pbt_wishlist";

const categoryIconsFA = {
  "Langganan": "fa-bell", "Streaming": "fa-tv", "Penyimpanan": "fa-hard-drive", "Software": "fa-puzzle-piece",
  "Desain": "fa-palette", "Produktivitas": "fa-book", "AI Tools": "fa-robot", "Keamanan": "fa-shield-halved",
  "Game": "fa-gamepad", "Voucher": "fa-gift", "Instagram": "fa-brands fa-instagram", "TikTok": "fa-brands fa-tiktok"
};

const money = n => `Rp${(Number(n) || 0).toLocaleString('id-ID')}`;
const getStorage = (k, f) => { try { return JSON.parse(localStorage.getItem(k)) ?? f; } catch { return f; } };
const setStorage = (k, v) => localStorage.setItem(k, JSON.stringify(v));

// ===== Page Navigation (Tab Switcher) =====
window.showPage = function (pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + pageId);
  if (target) target.classList.add('active');

  document.querySelectorAll('.nav-btn').forEach(btn => {
    const onclickAttr = btn.getAttribute('onclick') || '';
    if (onclickAttr.includes(`showPage('${pageId}')`)) {
      btn.classList.add('active');
    } else if (onclickAttr.includes('showPage')) {
      btn.classList.remove('active');
    }
  });

  if (pageId === 'testi') {
    renderTestimonials();
  } else if (pageId === 'tnc') {
    loadTncFromSheet();
  }
};

function showLoading() {
  const produkList = document.getElementById("produk-list");
  if (produkList) {
    produkList.innerHTML = `<div class="col-12 text-center py-5"><div class="spinner-border text-pink-hot" role="status"></div></div>`;
  }
}

// ===== Bangun grup dari varian (pakai kolom group) =====
function buildGroups() {
  const map = new Map();

  produkVariants.forEach(v => {
    const key = v.group || v.nama;
    let g = map.get(key);
    if (!g) {
      g = {
        key,
        title: key,
        kategori: v.kategori,
        ikon: v.ikon,
        wa: v.wa || DEFAULT_WA,
        variants: [],
        minHarga: v.harga || 0,
        maxHargaLama: v.harga_lama || 0,
        available: Number(v.stok) > 0
      };
      map.set(key, g);
    }
    g.variants.push(v);
    if ((v.harga || 0) < g.minHarga) g.minHarga = v.harga || 0;
    if ((v.harga_lama || 0) > g.maxHargaLama) g.maxHargaLama = v.harga_lama || 0;
    if (Number(v.stok) > 0) g.available = true;
  });

  produkGroups = Array.from(map.values());
}

// ===== Category Pills Renderer =====
function renderCategoryPills() {
  const catBar = document.getElementById('cat-bar');
  if (!catBar) return;
  const uniqueCats = ["Semua", ...new Set(produkGroups.map(g => g.kategori).filter(Boolean))];
  catBar.innerHTML = uniqueCats.map((cat, idx) => `
    <button class="cat-pill ${idx === 0 ? 'active' : ''}" onclick="filterCategory('${cat.replace(/'/g, "\\'")}', this)">
      <span>${cat === 'Semua' ? '✦' : '🌸'}</span>
      <span>${cat}</span>
    </button>
  `).join('');
}

window.filterCategory = function (cat, btnEl) {
  document.querySelectorAll('.cat-pill').forEach(b => b.classList.remove('active'));
  if (btnEl) btnEl.classList.add('active');

  const searchInput = document.getElementById("searchInput");
  const q = (searchInput?.value || "").toLowerCase();
  viewData = produkGroups.filter(g => {
    const matchCat = (cat === "Semua" || g.kategori === cat);
    const inTitle = (g.title || "").toLowerCase().includes(q);
    const inVariants = g.variants.some(v => (v.nama || "").toLowerCase().includes(q));
    return matchCat && (inTitle || inVariants);
  });
  page = 1;
  renderProduk(false);
};

window.toggleWishlist = function (btn, encodedKey) {
  const key = decodeURIComponent(encodedKey);
  let wishlist = getStorage(WISH_KEY, []);
  if (wishlist.includes(key)) {
    wishlist = wishlist.filter(k => k !== key);
    btn.classList.remove('active');
  } else {
    wishlist.push(key);
    btn.classList.add('active');
  }
  setStorage(WISH_KEY, wishlist);
};

// ===== Filter & Sort =====
function applyFilterSort() {
  const searchInput = document.getElementById("searchInput");
  const q = (searchInput?.value || "").toLowerCase();

  viewData = produkGroups.filter(g => {
    const inTitle = (g.title || "").toLowerCase().includes(q);
    const inVariants = g.variants.some(v => (v.nama || "").toLowerCase().includes(q));
    return (inTitle || inVariants);
  });

  page = 1;
}

// ===== Render card per group =====
function renderProduk(append = false) {
  const produkList = document.getElementById("produk-list");
  const btnLoadMore = document.getElementById("btnLoadMore");
  if (!produkList) return;

  const start = (page - 1) * perPage;
  const slice = viewData.slice(start, start + perPage);

  if (!append) produkList.innerHTML = "";

  if (slice.length === 0 && !append) {
    produkList.innerHTML = `
      <div class="col-12">
        <div class="empty-state">
          <i class="fas fa-search"></i>
          <h4>Produk tidak ditemukan</h4>
          <p>Coba ubah kata kunci atau filter pilihanmu</p>
        </div>
      </div>`;
    if (btnLoadMore) btnLoadMore.style.display = "none";
    return;
  }

  slice.forEach((group) => {
    const catIconClass = categoryIconsFA[group.kategori] || "fa-box";
    const hasDiscount = (group.maxHargaLama || 0) > (group.minHarga || 0);
    const stokOK = !!group.available;
    const wishlist = getStorage(WISH_KEY, []);
    const wished = wishlist.includes(group.key);
    const encKey = encodeURIComponent(group.key);

    const card = document.createElement("div");
    card.className = "product-card";
    if (!stokOK) card.setAttribute("data-disabled", "true");
    card.onclick = () => showDetailByKey(group.key);

    card.innerHTML = `
      <button class="wishlist-btn ${wished ? 'active' : ''}" title="Favorit"
              onclick="event.stopPropagation(); toggleWishlist(this, '${encKey}')">
        <i class="fa-solid fa-heart"></i>
      </button>
      <div class="category-badge">
        <i class="fa-solid ${catIconClass}"></i>
        <span>${group.kategori || ''}</span>
      </div>
      <div class="product-icon">
        <img src="${group.ikon || ''}" alt="${group.title || ''}"
             onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHJ4PSI4IiBmaWxsPSIjZmZmIiBzdHJva2U9IiNlMmU4ZjAiIHN0cm9rZS13aWR0aD0iMSIvPjwvc3ZnPg=='">
      </div>
      <h6 class="product-title">${group.title || ''}</h6>
      <div class="price-wrap">
        <span class="price">Mulai ${money(group.minHarga)}</span>
        ${hasDiscount ? `<span class="price-old">${money(group.maxHargaLama)}</span>` : ""}
      </div>
      <div class="stock-badge ${stokOK ? 'stock-ready' : 'stock-empty'} mb-2">
        ${stokOK ? 'Tersedia (' + group.variants.length + ' varian)' : 'Habis'}
      </div>
      <button class="btn-card-buy" onclick="event.stopPropagation(); showDetailByKey('${group.key.replace(/'/g, "\\'")}')">
        <span>Beli Sekarang</span> <span>✦</span>
      </button>
    `;
    produkList.appendChild(card);
  });

  if (btnLoadMore) {
    btnLoadMore.style.display = (viewData.length > (start + slice.length)) ? "inline-block" : "none";
  }
}

function getFullProductName(item) {
  if (!item) return "";
  const variantObj = (typeof produkVariants !== "undefined" && Array.isArray(produkVariants))
    ? produkVariants.find(p => p.nama === item.nama) || item
    : item;
  const nama = (item.nama || variantObj.nama || "").trim();
  const group = (item.group || variantObj.group || "").trim();

  if (!group) return nama;
  if (nama.toLowerCase().startsWith(group.toLowerCase())) {
    return nama;
  }
  return `${group} ${nama}`;
}

function buildSingleVariantWALink(v, defaultWaGroup) {
  const storeName = window.CONFIG?.storeName || "Lilacmart";
  const now = new Date();
  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':');
  const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const dateTimeFormatted = `${timeStr}, ${dateStr}`;

  const formatIDR = num => (Number(num) || 0).toLocaleString('id-ID');
  const priceIDR = formatIDR(v.harga);
  const fullNama = getFullProductName(v);

  const text = `𓉳  ❤️︎  ⋆ 𓌔𓌔𓌔⠀${storeName} 𝐵𝑖𝑙𝑙  ࣪   .𖥔 ݁ ˖ 
︶︶︶ ⊹ ︶︶︶ ୨♡୧ ︶︶︶ ⊹ ︶︶︶ 

˚യ  ៶៲៸  🕯️  halo, aku mau pesan ini  Ი ⑅ ♡
୨୧⠀⊹  🪞  payment  :  dana/qris/spay ♡ ︵ ⊹⠀୨୧

 ⊹  ♡⌇ 🎀  nama   :  Nama Pemesan
 ⊹  ♡⌇ 🌸  waktu  :  ${dateTimeFormatted}

𓇚⠀✿  detail pesanan
    ⊹ ꒰ 𓈒 ⓘ  pesanan 1  :  ${fullNama}  :  IDR. ${priceIDR}

⊹ ⎯⎯⎯  ꒰꒰  𓉸ྀི  total order : IDR. ${priceIDR}

🦢 ⁞ ⠀⁺ ⊹    thank you for purchase in ${storeName}, may your day blooming like flower 🌷 ⊹ ⊹ 

 ⊹ ⎯⎯⎯  with love, ${storeName} 𓈒 ꒱⠀⊹ 𓇚⠀✿`;

  const rawWa = (v.wa || defaultWaGroup || DEFAULT_WA).toString().replace(/[^0-9]/g, '');
  return `https://wa.me/${rawWa}?text=${encodeURIComponent(text)}`;
}

// ===== Modal Detail & varian =====
let bsModal = null;
window.showDetailByKey = function (groupKey) {
  const group = produkGroups.find(g => g.key === groupKey);
  if (!group) return;

  const modalEl = document.getElementById('produkModal');
  if (!modalEl) return;
  if (!bsModal) bsModal = new bootstrap.Modal(modalEl);

  const modalBody = document.getElementById('modalBody');
  const modalAddCart = document.getElementById('modalAddCart');
  const modalPesanBtn = document.getElementById('modalPesanBtn');

  const catIconClass = categoryIconsFA[group.kategori] || "fa-box";
  const primaryVariant = group.variants.find(v => Number(v.stok) > 0) || group.variants[0];

  const variantsHTML = group.variants.map((v, i) => {
    const stokOK = Number(v.stok) > 0;
    const fiturHTML = (v.deskripsi || []).length > 0
      ? `<div class="peony-feature-label">Deskripsi Produk :</div>
         <ul class="peony-feature-list">${(v.deskripsi || []).map(li =>
        `<li class="peony-feature-item"><span class="peony-bullet">✦</span><span>${li}</span></li>`
      ).join("")}</ul>`
      : "";

    const singleWaUrl = buildSingleVariantWALink(v, group.wa);

    return `
      <div class="peony-variant-card">
        <div class="d-flex justify-content-between align-items-start mb-2">
          <div>
            <div class="peony-variant-title">${v.nama}</div>
          </div>
          <div class="text-end">
            <div class="peony-variant-price">${money(v.harga)}</div>
            ${(v.harga_lama && v.harga_lama > v.harga) ? `<div class="peony-variant-old-price">${money(v.harga_lama)}</div>` : ""}
            <div class="mt-1">
              <span class="stock-badge ${stokOK ? 'stock-ready' : 'stock-empty'}">
                ${stokOK ? '✦ Tersedia' : '✕ Habis'}
              </span>
            </div>
          </div>
        </div>
        ${fiturHTML}
        <div class="d-flex gap-2 flex-wrap mt-3">
          <button class="btn-peony-cart" onclick="addToCart('${v.nama.replace(/'/g, "\\'")}'); new bootstrap.Offcanvas('#offcanvasCart').show();" ${stokOK ? '' : 'disabled'}>
            <i class="fa-solid fa-cart-plus"></i> + Keranjang
          </button>
          <a href="${singleWaUrl}" target="_blank" class="btn-peony-wa ${stokOK ? '' : 'disabled'}">
            <i class="fab fa-whatsapp"></i> Pesan Varian Ini
          </a>
        </div>
      </div>`;
  }).join("");

  modalBody.innerHTML = `
    <div class="peony-product-box">
      <div class="row align-items-center g-3">
        <div class="col-md-3 text-center">
          <div class="product-icon mx-auto" style="width: 84px; height: 84px; margin: 0 auto;">
            <img src="${group.ikon || ''}" alt="${group.title || ''}" style="width:100%;height:100%;object-fit:contain;">
          </div>
          <div class="category-badge mt-2" style="position:static; display:inline-flex;">
            <i class="fa-solid ${catIconClass}"></i>
            <span>${group.kategori || ''}</span>
          </div>
        </div>
        <div class="col-md-9">
          <h4 class="product-title text-start mb-1" style="font-size:1.35rem;">${group.title || ''}</h4>
          <p class="small text-muted mb-2">
            Tersedia <strong>${group.variants.length} varian pilihan</strong> dengan harga mulai
            <strong class="text-pink-hot fs-6">${money(group.minHarga)}</strong>
          </p>
          <div class="d-flex gap-2">
            <span class="stock-badge stock-ready">
              🌸 ${group.available ? 'Ready Stock' : 'Stok Terbatas'}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div class="d-flex align-items-center justify-content-between mb-3 px-1">
      <span class="fw-bold text-dark" style="font-family:'Fredoka One',cursive; font-size:1.1rem;">Pilihan Varian (${group.variants.length})</span>
      <span class="small text-muted">Pilih varian favoritmu 💖</span>
    </div>

    <div class="modal-variant-list">
      ${variantsHTML}
    </div>
  `;

  if (primaryVariant && modalPesanBtn && modalAddCart) {
    modalPesanBtn.href = buildSingleVariantWALink(primaryVariant, group.wa);
    modalAddCart.onclick = () => {
      addToCart(primaryVariant.nama);
      bsModal.hide();
      new bootstrap.Offcanvas('#offcanvasCart').show();
    };
  }

  bsModal.show();
};

// ===== Load Data Dari Sheet =====
async function loadProdukFromSheet() {
  showLoading();
  try {
    const currentSheetId = window.CONFIG?.sheetIdProducts || SHEET_ID;
    const currentSheetName = window.CONFIG?.sheetNameProducts || SHEET_NAME;
    const timestamp = Date.now();
    const freshUrl = `https://docs.google.com/spreadsheets/d/${currentSheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(currentSheetName)}&_t=${timestamp}`;
    const res = await fetch(freshUrl, { cache: 'no-store' });
    const text = await res.text();
    const json = JSON.parse(text.substring(47, text.length - 2));
    const rows = json.table.rows || [];

    produkVariants = rows.map((r, idx) => {
      const c = r.c || [];
      const nama = c[0]?.v ?? "";
      const harga = Number(c[1]?.v ?? 0) || 0;
      const ikon = c[2]?.v ?? "";
      const deskripsi = (c[3]?.v ?? "").toString().split(/\|\||II|Il|lI|\r?\n|\|/).map(s => s.trim()).filter(Boolean);
      const kategori = c[4]?.v ?? "";
      const wa = c[5]?.v ?? DEFAULT_WA;
      const harga_lama = Number(c[6]?.v ?? 0) || 0;
      const stok = Number(c[7]?.v ?? 0) || 0;
      const kode = c[8]?.v ?? "";
      const group = c[9]?.v ?? "";
      return { id: idx, nama, harga, ikon, deskripsi, kategori, wa, harga_lama, stok, kode, group };
    });

    buildGroups();
    applyFilterSort();
    renderCategoryPills();
    renderProduk(false);

    const statReadyEl = document.getElementById("stat-ready");
    if (statReadyEl) statReadyEl.textContent = `${produkGroups.length}`;
    const prodCountEl = document.getElementById("product-count");
    if (prodCountEl) prodCountEl.textContent = `(${produkGroups.length} produk ready)`;

    if (window.applyDynamicBranding) window.applyDynamicBranding();

  } catch (err) {
    console.error(err);
    const produkList = document.getElementById("produk-list");
    if (produkList) {
      produkList.innerHTML = `
        <div class="col-12">
          <div class="empty-state text-center py-5">
            <i class="fas fa-triangle-exclamation text-danger fs-1 mb-2"></i>
            <h4>Gagal Memuat Data</h4>
            <p>Silakan periksa koneksi internet atau data spreadsheet Anda.</p>
          </div>
        </div>`;
    }
  }
}

const defaultTncData = [
  {
    icon: "fa-shield-halved",
    judul: "🔰 Syarat, Ketentuan & Garansi Layanan",
    deskripsi: "Setiap transaksi aplikasi premium & produk digital di Lilacmart dilindungi garansi resmi penuh selama durasi paket aktif. Apabila terdapat kendala teknis atau masalah akses akun, tim CS kami akan membantu proses perbaikan atau memberikan penggantian akun baru dalam waktu 1x24 jam."
  },
  {
    icon: "fa-bolt",
    judul: "⚡ Panduan Pemesanan & Pembayaran Instan",
    deskripsi: "Pilih aplikasi yang Anda butuhkan melalui katalog, tentukan durasi varian, lalu masukkan ke keranjang belanja. Tekan tombol Checkout untuk melanjutkan transaksi via WhatsApp CS. Pembayaran dapat dilakukan secara instan via QRIS (DANA, ShopeePay, GoPay, OVO) atau Transfer Bank (BCA, Mandiri, BRI)."
  },
  {
    icon: "fa-user-lock",
    judul: "📜 Aturan Penggunaan Akun (Sharing & Private)",
    deskripsi: "• Akun Sharing: Pembeli dilarang keras mengubah password, profil, email utama, atau PIN profil yang terdaftar. Gunakan hanya pada 1 device sesuai kesepakatan.||• Akun Private: Pembeli berhak mengubah password, profil, & mengatur akun secara penuh."
  },
  {
    icon: "fa-clock",
    judul: "⏱️ Jam Operasional & Durasi Proses",
    deskripsi: "Layanan CS & pemrosesan pesanan aktif setiap hari pukul 08:00 - 23:00 WIB. Pesanan diproses kilat antara 5 hingga 15 menit setelah bukti pembayaran dikonfirmasi oleh Admin."
  },
  {
    icon: "fa-rotate-left",
    judul: "🔄 Kebijakan Pengembalian & Refund",
    deskripsi: "Klaim refund atau pengembalian dana dapat disetujui 100% apabila tim CS kami tidak mampu memberikan solusi atau produk pengganti setelah batas waktu 1x24 jam sejak laporan kendala diterima."
  }
];

// ===== Load Terms & Conditions Dari Sheet =====
async function loadTncFromSheet() {
  try {
    const currentSheetId = window.CONFIG?.sheetIdProducts || SHEET_ID;
    const currentTncSheetName = window.CONFIG?.sheetNameTnc || SHEET_TNC_NAME;
    const timestamp = Date.now();
    const freshTncUrl = `https://docs.google.com/spreadsheets/d/${currentSheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(currentTncSheetName)}&_t=${timestamp}`;
    const res = await fetch(freshTncUrl, { cache: 'no-store' });
    const text = await res.text();
    const json = JSON.parse(text.substring(47, text.length - 2));
    const rows = json.table.rows || [];

    const safeDecode = str => {
      if (!str) return "";
      try { return decodeURIComponent(str); } catch { return str; }
    };

    const tncData = rows.map(r => {
      const c = r.c || [];
      const rawJ = (c[0]?.v ?? "").toString().trim();
      const rawD = (c[1]?.v ?? "").toString().trim();
      const judul = safeDecode(rawJ);
      const deskripsi = safeDecode(rawD);
      return { judul, deskripsi };
    }).filter(item => {
      const j = item.judul.toLowerCase();
      const d = item.deskripsi.toLowerCase();
      if (j === "judul" && d === "deskripsi") return false;
      return item.judul || item.deskripsi;
    });

    // Validasi apakah data yang ditarik adalah katalog produk (bukan T&C / FAQ):
    const isProductData = tncData.some(item => {
      const j = item.judul.toLowerCase();
      const d = item.deskripsi.toLowerCase();
      const isPrice = !isNaN(Number(d.replace(/[^0-9]/g, ''))) && d.replace(/[^0-9]/g, '').length >= 4;
      const hasProductKeywords = ["youtube", "netflix", "canva", "spotify", "apple", "vidio", "capcut", "goodnotes", "bulan", "invite", "seller", "private", "sharing", "unit"].some(k => j.includes(k));
      return isPrice || hasProductKeywords;
    });

    if (tncData.length > 0 && !isProductData) {
      renderTncAccordions(tncData);
    } else {
      renderTncAccordions(defaultTncData);
    }
  } catch (err) {
    console.warn("Spreadsheet Terms & Conditions belum memuat data valid, menggunakan default Lilacmart.", err);
    renderTncAccordions(defaultTncData);
  }
}

function renderTncAccordions(tncList) {
  const container = document.querySelector("#page-tnc .tnc-container");
  if (!container) return;

  const defaultIcons = ["fa-shield-halved", "fa-bolt", "fa-user-lock", "fa-clock", "fa-rotate-left", "fa-circle-info"];

  const accordionsHTML = tncList.map((item, index) => {
    const isOpen = index === 0 ? "open" : "";
    const iconClass = item.icon || defaultIcons[index % defaultIcons.length];
    const isList = item.deskripsi.includes("||") || item.deskripsi.includes("\n");

    let bodyHTML = "";
    if (isList) {
      const items = item.deskripsi.split(/\|\||\n/).map(s => s.trim()).filter(Boolean);
      bodyHTML = `<ul>${items.map(it => {
        if (it.startsWith("•") || it.startsWith("-")) {
          const content = it.replace(/^[•\-]\s*/, "").trim();
          if (content.includes(":")) {
            const parts = content.split(":");
            return `<li><strong>${parts[0].trim()}:</strong> ${parts.slice(1).join(":").trim()}</li>`;
          }
          return `<li>${content}</li>`;
        }
        if (it.includes("—") || it.includes("-")) {
          const parts = it.split(/—|-/);
          return `<li><strong>${parts[0].trim()}</strong> — ${parts.slice(1).join("—").trim()}</li>`;
        }
        return `<li>${it}</li>`;
      }).join("")}</ul>`;
    } else {
      bodyHTML = `<p>${item.deskripsi.replace(/\n/g, "<br>")}</p>`;
    }

    return `
      <div class="tnc-accordion ${isOpen}">
        <button class="tnc-acc-btn" onclick="toggleAcc(this)">
          <div class="d-flex align-items-center gap-3">
            <div class="tnc-acc-icon">
              <i class="fa-solid ${iconClass}"></i>
            </div>
            <span class="tnc-acc-title">${item.judul}</span>
          </div>
          <span class="tnc-acc-arrow"><i class="fa-solid fa-chevron-down"></i></span>
        </button>
        <div class="tnc-acc-body">
          ${bodyHTML}
        </div>
      </div>`;
  }).join("");

  const contactCardHTML = `
    <div class="tnc-contact-card mt-4">
      <div class="tnc-contact-header">
        <i class="fa-solid fa-headset me-2 text-raspberry"></i> Hubungi Customer Support Lilacmart
      </div>
      <div class="tnc-contact-sub">
        Tim CS Lilacmart siap membantu pertanyaan, konsultasi varian produk, atau klaim garansi transaksi kamu!
      </div>
      <div class="tnc-social-grid">
        <a class="tnc-social-btn telegram" href="#" id="tncTeleBtn" target="_blank">
          <i class="fab fa-telegram text-primary fs-5"></i>
          <span>Testimonial Channel</span>
        </a>
        <a class="tnc-social-btn twitter" href="https://x.com/rainztore?s=21" id="tncXBtn" target="_blank">
          <i class="fab fa-x-twitter text-dark fs-5"></i>
          <span>X (Twitter)</span>
        </a>
        <a class="tnc-social-btn instagram" href="https://instagram.com" id="tncIgBtn" target="_blank">
          <i class="fab fa-instagram text-danger fs-5"></i>
          <span>Instagram Official</span>
        </a>
        <a class="tnc-social-btn whatsapp" href="https://wa.me/${DEFAULT_WA}" id="tncWaBtn" target="_blank">
          <i class="fab fa-whatsapp text-success fs-5"></i>
          <span>WhatsApp CS Admin</span>
        </a>
      </div>
    </div>`;

  container.innerHTML = `<div class="tnc-acc-wrapper">${accordionsHTML}</div>${contactCardHTML}`;
}

// ===== Cart & Wishlist Logic =====
function getCart() { return getStorage(CART_KEY, []); }
function setCart(c) { setStorage(CART_KEY, c); updateCartUI(); }

window.addToCart = function (name, qty = 1) {
  const item = produkVariants.find(p => p.nama === name);
  if (!item || !(Number(item.stok) > 0)) return;
  const cart = getCart();
  const ex = cart.find(ci => ci.nama === name);
  if (ex) { ex.qty += qty; }
  else { cart.push({ nama: item.nama, group: item.group || "", harga: item.harga, wa: item.wa || DEFAULT_WA, qty }); }
  setCart(cart);
};

window.removeFromCart = function (name) { setCart(getCart().filter(ci => ci.nama !== name)); };
window.changeQty = function (name, delta) {
  const cart = getCart();
  const it = cart.find(ci => ci.nama === name);
  if (!it) return;
  it.qty = Math.max(1, (it.qty || 1) + delta);
  setCart(cart);
};
window.clearCart = function () { setCart([]); };

function updateCartUI() {
  const cart = getCart();
  const totalQty = cart.reduce((a, b) => a + (b.qty || 1), 0);

  const cartCountEl = document.getElementById("cartCount");
  if (cartCountEl) cartCountEl.textContent = totalQty;
  const navCartCountEl = document.getElementById("navCartCount");
  if (navCartCountEl) navCartCountEl.textContent = totalQty;

  const wrap = document.getElementById("cartItems");
  const cartTotalEl = document.getElementById("cartTotal");
  const btnCheckoutWA = document.getElementById("btnCheckoutWA");

  if (!wrap) return;

  if (cart.length === 0) {
    wrap.innerHTML = `<div class="empty-state text-center py-4"><i class="fa-regular fa-face-frown fs-2 mb-2"></i><p>Keranjang masih kosong</p></div>`;
    if (cartTotalEl) cartTotalEl.textContent = money(0);
    if (btnCheckoutWA) btnCheckoutWA.href = "#";
    return;
  }

  let total = 0;
  wrap.innerHTML = cart.map(ci => {
    const sub = (ci.harga || 0) * (ci.qty || 1);
    total += sub;
    const fullNama = getFullProductName(ci);
    return `
    <div class="d-flex align-items-center justify-content-between border rounded-3 p-2 mb-2 bg-light">
      <div>
        <div class="fw-bold text-dark">${fullNama}</div>
        <div class="text-pink-hot small">${money(ci.harga)} × ${ci.qty}</div>
      </div>
      <div class="d-flex align-items-center gap-1">
        <button class="btn btn-sm btn-outline-secondary px-2" onclick="changeQty('${ci.nama.replace(/'/g, "\\'")}', -1)">-</button>
        <button class="btn btn-sm btn-outline-secondary px-2" onclick="changeQty('${ci.nama.replace(/'/g, "\\'")}', 1)">+</button>
        <button class="btn btn-sm btn-outline-danger px-2" onclick="removeFromCart('${ci.nama.replace(/'/g, "\\'")}')"><i class="fa-solid fa-trash"></i></button>
      </div>
    </div>`;
  }).join("");

  if (cartTotalEl) cartTotalEl.textContent = money(total);

  // Formatting helper for IDR currency without 'Rp' prefix (e.g. 15.000)
  const formatIDR = num => (Number(num) || 0).toLocaleString('id-ID');

  // Formatting date and time
  const now = new Date();
  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':');
  const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const dateTimeFormatted = `${timeStr}, ${dateStr}`;

  const storeName = window.CONFIG?.storeName || "Lilacmart";
  const buyerNameVal = document.getElementById("buyerName")?.value.trim();
  const buyerName = buyerNameVal || "Nama Pemesan";
  const paymentVal = document.getElementById("paymentMethod")?.value || "dana/qris/spay";

  // Format detail pesanan lines
  const detailPesananLines = cart.map((ci, i) => {
    const itemSub = formatIDR((ci.harga || 0) * (ci.qty || 1));
    const qtyLabel = ci.qty > 1 ? ` (${ci.qty}x)` : '';
    const fullNama = getFullProductName(ci);
    return `    ⊹ ꒰ 𓈒 ⓘ  pesanan ${i + 1}  :  ${fullNama}${qtyLabel}  :  IDR. ${itemSub}`;
  }).join('\n');

  const totalIDR = formatIDR(total);

  const text = `𓉳  ❤️︎  ⋆ 𓌔𓌔𓌔⠀${storeName} 𝐵𝑖𝑙𝑙  ࣪   .𖥔 ݁ ˖ 
︶︶︶ ⊹ ︶︶︶ ୨♡୧ ︶︶︶ ⊹ ︶︶︶ 

˚യ  ៶៲៸  🕯️  halo, aku mau pesan ini  Ი ⑅ ♡
୨୧⠀⊹  🪞  payment  :  ${paymentVal} ♡ ︵ ⊹⠀୨୧

 ⊹  ♡⌇ 🎀  nama   :  ${buyerName}
 ⊹  ♡⌇ 🌸  waktu  :  ${dateTimeFormatted}

𓇚⠀✿  detail pesanan
${detailPesananLines}

⊹ ⎯⎯⎯  ꒰꒰  𓉸ྀི  total order : IDR. ${totalIDR}

🦢 ⁞ ⠀⁺ ⊹    thank you for purchase in ${storeName}, may your day blooming like flower 🌷 ⊹ ⊹ 

 ⊹ ⎯⎯⎯  with love, ${storeName} 𓈒 ꒱⠀⊹ 𓇚⠀✿`;

  const uniqueWAs = [...new Set(cart.map(c => c.wa || DEFAULT_WA))];
  const waTarget = uniqueWAs.length === 1 ? uniqueWAs[0] : DEFAULT_WA;
  if (btnCheckoutWA) {
    btnCheckoutWA.href = `https://wa.me/${encodeURIComponent(String(waTarget).replace(/[^0-9]/g, ''))}?text=${encodeURIComponent(text)}`;
  }
}

// ===== Testimonials Logic =====
let selectedStar = 5;
window.setStar = function (val) {
  selectedStar = val;
  document.querySelectorAll('.star-opt').forEach(el => {
    const v = Number(el.dataset.v);
    if (v <= val) el.classList.add('selected');
    else el.classList.remove('selected');
  });
};

function renderTestimonials() {
  const grid = document.getElementById('testi-grid');
  if (!grid) return;
  const defaultTestis = [
    { name: "Putri A.", rating: 5, text: "Aplikasi Netflix langganan super cepat prosentasenya, penjual ramah dan fast respon bgt! 💖", date: "Hari ini" },
    { name: "Budi S.", rating: 5, text: "Canva Pro langsung aktif dalam 5 menit, mantap banget store terpercaya! 🌸", date: "Kemarin" },
    { name: "Siti R.", rating: 5, text: "Beli Spotify Family hemat banget harganya, garansi full anti kendala.", date: "2 hari yang lalu" },
    { name: "Rian K.", rating: 5, text: "CapCut Pro works 100%! Sangat membantu buat ngedit konten video daily.", date: "3 hari yang lalu" }
  ];
  const userTestis = getStorage('pbt_testimonials', []);
  const allTestis = [...userTestis, ...defaultTestis];

  grid.innerHTML = allTestis.map(t => `
    <div class="testi-card">
      <div class="testi-head">
        <span class="testi-user">${t.name}</span>
        <span class="testi-stars">${'⭐'.repeat(t.rating)}</span>
      </div>
      <p class="testi-text">${t.text}</p>
      <span class="testi-date">${t.date || 'Baru saja'}</span>
    </div>
  `).join('');
}

window.submitTestimonial = function () {
  const nameEl = document.getElementById('t-name');
  const textEl = document.getElementById('t-text');
  if (!nameEl || !textEl) return;
  const name = nameEl.value.trim();
  const text = textEl.value.trim();
  if (!name || !text) {
    alert("Mohon isi nama dan pengalaman kamu ya 💖");
    return;
  }
  const userTestis = getStorage('pbt_testimonials', []);
  userTestis.unshift({
    name,
    rating: selectedStar,
    text,
    date: 'Baru saja'
  });
  setStorage('pbt_testimonials', userTestis);
  nameEl.value = '';
  textEl.value = '';
  renderTestimonials();
  alert("Terima kasih atas ulasan manis kamu! 🌸");
};

window.toggleAcc = function (btn) {
  const accordion = btn.closest('.tnc-accordion');
  if (accordion) {
    accordion.classList.toggle('open');
  }
};

// ===== Initializer =====
document.addEventListener('DOMContentLoaded', () => {
  loadProdukFromSheet();
  loadTncFromSheet();
  updateCartUI();
  renderTestimonials();

  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      applyFilterSort();
      renderProduk(false);
    });
  }

  const btnLoadMore = document.getElementById("btnLoadMore");
  if (btnLoadMore) {
    btnLoadMore.addEventListener("click", () => {
      page += 1;
      renderProduk(true);
    });
  }

  const btnClearCart = document.getElementById("btnClearCart");
  if (btnClearCart) {
    btnClearCart.addEventListener("click", () => clearCart());
  }
});
