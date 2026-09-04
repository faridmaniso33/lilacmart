// config.js
window.CONFIG = {
  // Store Details
  storeName: "Lilacmart", // Full Store Name
  shortStoreName: "Lilacmart",
  whatsappNumber: "6287751126614", // Format: 62xxxxxxxxxx (no + or spaces)
  telegramUsername: "Mavhdu",
  telegramLink: "https://t.me/rainstoreproof",
  websiteUrl: "",
  emailAdmin: "",
  workHours: "08:00 – 23:00 WITA",
  location: "Indonesia",
  qrisImagePath: "qris.png", // Path or URL to QRIS payment image

  // Google Sheets Config (for index.html)
  sheetIdProducts: "1kXWg6pqo4H4J1JEUGZ3_aYRGUbSJlzkj-MSDaTqpLTk",
  sheetNameProducts: "Produk",
  sheetNameInfo: "informasi_modal",
  sheetNameTnc: "tnc", // Tab untuk Terms & Conditions (Kolom A: judul, Kolom B: deskripsi)

  // Theme Config
  // Options: "lilacmart" (default), "peony", "green", "blue", "purple", "orange", "red", "custom"
  activeTheme: "lilacmart",

  // Custom Theme Colors (Only used if activeTheme is set to "custom")
  customTheme: {
    primary: "#bf2b54",       // Raspberry
    primaryHover: "#9e2043",  // Deep Raspberry Hover
    primaryLight: "#f5e9d0",  // Vanilla
    secondary: "#da6c81",     // Grapefruit
    accent: "#bf2b54"         // Raspberry Accent
  }
};

// Apply theme dynamically as early as possible
applyDynamicTheme();

// Automatic replacement on page load
document.addEventListener("DOMContentLoaded", () => {
  applyDynamicBranding();
});

function applyDynamicTheme() {
  const cfg = window.CONFIG;
  if (!cfg) return;

  const themes = {
    lilacmart: {
      primary: "#bf2b54",
      primaryHover: "#9e2043",
      primaryLight: "#faf4e8",
      secondary: "#da6c81",
      accent: "#bf2b54"
    },
    peony: {
      primary: "#bf2b54",
      primaryHover: "#9e2043",
      primaryLight: "#f5e9d0",
      secondary: "#da6c81",
      accent: "#bf2b54"
    },
    green: {
      primary: "#00AA5B",
      primaryHover: "#03ac0e",
      primaryLight: "#e8f8f0",
      secondary: "#00c853",
      accent: "#ff5722"
    },
    blue: {
      primary: "#0084FF",
      primaryHover: "#006fe6",
      primaryLight: "#e6f7ff",
      secondary: "#00b8ff",
      accent: "#ff4d4f"
    },
    purple: {
      primary: "#7c3aed",
      primaryHover: "#6d28d9",
      primaryLight: "#f5f3ff",
      secondary: "#a855f7",
      accent: "#10b981"
    },
    orange: {
      primary: "#ff5722",
      primaryHover: "#f4511e",
      primaryLight: "#fff3e0",
      secondary: "#ff9800",
      accent: "#29b6f6"
    },
    red: {
      primary: "#e11d48",
      primaryHover: "#be123c",
      primaryLight: "#fff1f2",
      secondary: "#f43f5e",
      accent: "#eab308"
    }
  };

  let activeThemeColors = themes[cfg.activeTheme || "green"];

  // Fallback to custom theme if selected
  if (cfg.activeTheme === "custom" && cfg.customTheme) {
    activeThemeColors = {
      primary: cfg.customTheme.primary || "#00AA5B",
      primaryHover: cfg.customTheme.primaryHover || "#03ac0e",
      primaryLight: cfg.customTheme.primaryLight || "#e8f8f0",
      secondary: cfg.customTheme.secondary || cfg.customTheme.accent || "#00c853",
      accent: cfg.customTheme.accent || "#ff5722"
    };
  }

  if (activeThemeColors) {
    const secondaryColor = activeThemeColors.secondary || activeThemeColors.accent || activeThemeColors.primary;
    const css = `
      :root {
        --primary-color: ${activeThemeColors.primary} !important;
        --primary-color-hover: ${activeThemeColors.primaryHover} !important;
        --primary-light: ${activeThemeColors.primaryLight} !important;
        --secondary-color: ${secondaryColor} !important;
        --accent-color: ${activeThemeColors.accent} !important;
        --accent: ${activeThemeColors.primary} !important;
        --accent-2: ${secondaryColor} !important;
        --success-color: ${activeThemeColors.primary} !important;
        --gradient-primary: linear-gradient(135deg, ${activeThemeColors.primary} 0%, ${secondaryColor} 100%) !important;
        --gradient-accent: linear-gradient(135deg, ${activeThemeColors.accent} 0%, ${activeThemeColors.primary} 100%) !important;
        --bs-primary: ${activeThemeColors.primary} !important;
        --bs-primary-rgb: ${hexToRgb(activeThemeColors.primary)} !important;
        --bs-success: ${activeThemeColors.primary} !important;
        --bs-success-rgb: ${hexToRgb(activeThemeColors.primary)} !important;
      }

      .btn-primary,
      .btn-success {
        --bs-btn-bg: ${activeThemeColors.primary} !important;
        --bs-btn-border-color: ${activeThemeColors.primary} !important;
        --bs-btn-hover-bg: ${activeThemeColors.primaryHover} !important;
        --bs-btn-hover-border-color: ${activeThemeColors.primaryHover} !important;
        --bs-btn-active-bg: ${activeThemeColors.primaryHover} !important;
        --bs-btn-active-border-color: ${activeThemeColors.primaryHover} !important;
      }

      .btn-outline-primary {
        --bs-btn-color: ${activeThemeColors.primary} !important;
        --bs-btn-border-color: ${activeThemeColors.primary} !important;
        --bs-btn-hover-bg: ${activeThemeColors.primary} !important;
        --bs-btn-hover-border-color: ${activeThemeColors.primary} !important;
      }

      .text-success,
      .text-primary {
        color: ${activeThemeColors.primary} !important;
      }

      .bg-success,
      .bg-primary {
        background-color: ${activeThemeColors.primary} !important;
      }
    `;
    const styleEl = document.createElement("style");
    styleEl.id = "dynamic-theme-style";
    styleEl.innerHTML = css;
    if (document.head) {
      document.head.appendChild(styleEl);
    } else {
      document.addEventListener("DOMContentLoaded", () => {
        document.head.appendChild(styleEl);
      });
    }
  }
}

function hexToRgb(hex) {
  const normalized = String(hex || "").replace("#", "").trim();
  if (!/^[0-9a-f]{6}$/i.test(normalized)) return "0, 170, 91";
  const value = parseInt(normalized, 16);
  return `${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}`;
}

function applyDynamicBranding() {
  const cfg = window.CONFIG;
  if (!cfg) return;

  // 1. Update Document Title
  if (cfg.storeName) {
    document.title = `${cfg.storeName} — Premium Apps`;
  }

  // 2. Direct Header Brand Element Updates
  const brandTitleEl = document.querySelector('.header-title');
  if (brandTitleEl && cfg.storeName) {
    let name = cfg.storeName.trim();
    let parts = name.split(/\s+/).filter(Boolean);
    if (parts.length === 1) {
      parts = name.split(/(?<=[a-z])(?=[A-Z])/).filter(Boolean);
    }
    if (parts.length >= 2) {
      const last = parts.pop();
      brandTitleEl.innerHTML = `${parts.join(' ')} <em>${last}</em>`;
    } else {
      brandTitleEl.innerHTML = `${name} <em>Store</em>`;
    }
  }

  const brandRightEl = document.querySelector('.header-right-text');
  if (brandRightEl && cfg.storeName) {
    const year = new Date().getFullYear();
    brandRightEl.textContent = `${cfg.storeName} · Premium Apps · ${year}`;
  }

  const brandSubEl = document.querySelector('.header-subtitle');
  if (brandSubEl && cfg.storeName) {
    brandSubEl.innerHTML = `⊹ &nbsp;♡ྀི &nbsp;<b>${cfg.storeName}</b>⠀𓉳 &nbsp;❤️︎ &nbsp;⊹ ⎯⎯⎯ &nbsp;🎀🪞 laman terpercaya dengan aplikasi premium berkualitas 🕯️🌸 ⊹ ⊹ menyajikan pelayanan bintang lima ✿ ⊹ ⁺ 𝜗ৎ &nbsp;𓌔𓌔𓌔 &nbsp;˖˚ welcome to ethereal page! ♡⠀𝜗ৎ⠀⊹`;
  }

  // 3. Safe Text Nodes Traversal & Replacement
  const searchRegName = /Putra Btt Store|Rain Store|HuraaFashion|Huraa Fashion|𝑹𝒂𝒊𝒏 𝑺𝒕𝒐𝒓𝒆|Rainztore|Peony Store/gi;
  const searchRegShort = /\bPBS\b/g;
  const searchRegWa = /6282340915319|6283865477000/g;
  const searchRegTele = /AutoOrderPBS_bot/gi;
  const searchRegWeb = /putrabttstore\.web\.id/gi;
  const searchRegEmail = /admin@putrabttstore\.web\.id/gi;

  function walkTextNodes(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      let val = node.nodeValue;
      if (val) {
        let changed = false;
        if (val.match(searchRegName)) {
          val = val.replace(searchRegName, cfg.storeName);
          changed = true;
        }
        if (val.match(searchRegShort)) {
          val = val.replace(searchRegShort, cfg.shortStoreName);
          changed = true;
        }
        if (val.match(searchRegWa)) {
          val = val.replace(searchRegWa, cfg.whatsappNumber);
          changed = true;
        }
        if (val.match(searchRegTele)) {
          val = val.replace(searchRegTele, cfg.telegramUsername);
          changed = true;
        }
        if (val.match(searchRegWeb)) {
          val = val.replace(searchRegWeb, (cfg.websiteUrl || '').replace(/^https?:\/\//i, ''));
          changed = true;
        }
        if (val.match(searchRegEmail)) {
          val = val.replace(searchRegEmail, cfg.emailAdmin || '');
          changed = true;
        }
        if (changed) {
          node.nodeValue = val;
        }
      }
    } else if (node.nodeName !== 'SCRIPT' && node.nodeName !== 'STYLE') {
      // Also check placeholder and alt attributes
      if (node.getAttribute) {
        const ph = node.getAttribute('placeholder');
        if (ph && ph.match(searchRegName)) {
          node.setAttribute('placeholder', ph.replace(searchRegName, cfg.storeName));
        }
        const alt = node.getAttribute('alt');
        if (alt && alt.match(searchRegName)) {
          node.setAttribute('alt', alt.replace(searchRegName, cfg.storeName));
        }
      }
      for (let i = 0; i < node.childNodes.length; i++) {
        walkTextNodes(node.childNodes[i]);
      }
    }
  }

  if (document.body) {
    walkTextNodes(document.body);
  }

  // 4. Update Anchor Hrefs
  const links = document.querySelectorAll('a[href]');
  links.forEach(link => {
    let href = link.getAttribute('href');
    if (href) {
      if (cfg.whatsappNumber) href = href.replace(/6282340915319/g, cfg.whatsappNumber);
      if (cfg.telegramUsername) href = href.replace(/AutoOrderPBS_bot/g, cfg.telegramUsername);
      if (cfg.websiteUrl) href = href.replace(/putrabttstore\.web\.id/g, cfg.websiteUrl.replace(/^https?:\/\//i, ''));
      if (cfg.emailAdmin) href = href.replace(/admin@putrabttstore\.web\.id/g, cfg.emailAdmin);

      // Handle WhatsApp URL scheme formatting
      if (href.startsWith('https://wa.me/')) {
        try {
          const urlObj = new URL(href);
          const textParam = urlObj.searchParams.get('text');
          if (textParam) {
            urlObj.searchParams.set('text', textParam.replace(/Putra Btt Store|Rain Store|HuraaFashion/gi, cfg.storeName).replace(/\bPBS\b/g, cfg.shortStoreName));
          }
          href = urlObj.toString();
        } catch (e) {
          href = href.replace(/Putra Btt Store|Rain Store|HuraaFashion/gi, cfg.storeName).replace(/\bPBS\b/g, cfg.shortStoreName);
        }
      } else if (href.startsWith('https://t.me/') && cfg.telegramLink) {
        href = cfg.telegramLink;
      } else if (href.includes('putrabttstore.web.id') && cfg.websiteUrl) {
        href = cfg.websiteUrl;
      }

      link.setAttribute('href', href);
    }
  });

  // 5. Update elements with data-copy attributes
  const copyBtns = document.querySelectorAll('[data-copy]');
  copyBtns.forEach(btn => {
    let val = btn.getAttribute('data-copy');
    if (val && cfg.whatsappNumber) {
      val = val.replace(/6282340915319/g, cfg.whatsappNumber);
      btn.setAttribute('data-copy', val);
    }
  });

  // 6. Update QRIS images, T&C & Footer Buttons
  if (cfg.qrisImagePath) {
    const qrisImages = document.querySelectorAll('img[src="qris.png"], img[alt*="QRIS"]');
    qrisImages.forEach(img => {
      img.src = cfg.qrisImagePath;
    });
  }

  const waBtns = document.querySelectorAll('#tncWaBtn, .footer-wa-btn');
  waBtns.forEach(tncWaBtn => {
    if (tncWaBtn && cfg.whatsappNumber) {
      tncWaBtn.href = `https://wa.me/${String(cfg.whatsappNumber).replace(/[^0-9]/g, '')}`;
    }
  });

  const teleBtns = document.querySelectorAll('#tncTeleBtn, .footer-tele-btn');
  teleBtns.forEach(tncTeleBtn => {
    if (tncTeleBtn && (cfg.telegramLink || cfg.telegramUsername)) {
      tncTeleBtn.href = cfg.telegramLink || `https://t.me/${cfg.telegramUsername}`;
    }
  });

  const footerYear = document.getElementById('footerYear');
  if (footerYear) {
    footerYear.textContent = new Date().getFullYear();
  }

  const footerBrand = document.querySelectorAll('.footer-brand-name');
  footerBrand.forEach(el => {
    if (cfg.storeName) el.textContent = cfg.storeName;
  });
}

// Export function globally
window.applyDynamicBranding = applyDynamicBranding;
