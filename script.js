let type = "text";

const qrCode = new QRCodeStyling({
  width: 250,
  height: 250,
  data: "Hello",
  dotsOptions: { color: "#000", type: "rounded" },
  backgroundOptions: { color: "#fff" },
  imageOptions: { imageSize: 0.45, margin: 6 },
});

qrCode.append(document.getElementById("qr-preview"));

function setType(t, e) {
  type = t;
  document
    .querySelectorAll(".tab")
    .forEach((el) => el.classList.remove("active"));
  e.target.classList.add("active");
  renderInputs();
}

function renderInputs() {
  const div = document.getElementById("inputs");
  // render inputs with type-specific attributes and error containers
  if (type === "text") {
    div.innerHTML = `
      <div class="input-row">
        <input id="data" type="text" placeholder="Enter text" maxlength="500" required>
        <small class="input-error" id="data-error"></small>
      </div>
    `;
  }

  if (type === "url") {
    div.innerHTML = `
      <div class="input-row">
        <input id="data" type="url" placeholder="https://example.com" required pattern="https?://.+">
        <small class="input-error" id="data-error"></small>
      </div>
    `;
  }

  if (type === "email") {
    div.innerHTML = `
      <div class="input-row">
        <input id="data" type="email" placeholder="example@mail.com" required>
        <small class="input-error" id="data-error"></small>
      </div>
    `;
  }

  if (type === "phone") {
    div.innerHTML = `
      <div class="input-row">
        <input id="data" type="tel" placeholder="+911234567890" required pattern="^\\+?[0-9\s\-]{7,20}$">
        <small class="input-error" id="data-error"></small>
      </div>
    `;
  }

  if (type === "wifi") {
    div.innerHTML = `
      <div class="input-row">
        <input id="ssid" type="text" placeholder="WiFi Name" required maxlength="64">
        <small class="input-error" id="ssid-error"></small>
      </div>
      <div class="input-row">
        <input id="password" type="text" placeholder="Password (leave empty for open)" maxlength="64">
        <small class="input-error" id="password-error"></small>
      </div>
    `;
  }

  // attach input listeners for live validation
  const inputs = div.querySelectorAll("input");
  inputs.forEach((inp) => {
    inp.addEventListener("input", () => {
      validateCurrentInputs();
    });
  });
  // If phone type, prevent letters from being entered (filter input/paste)
  if (type === "phone") {
    const phone = document.getElementById("data");
    if (phone) {
      // prefer numeric/tel input behavior
      phone.setAttribute("inputmode", "tel");
      phone.addEventListener("input", () => {
        const caret = phone.selectionStart;
        // allow only digits, spaces, +, -, parentheses
        const filtered = phone.value.replace(/[^0-9+\-()\s]/g, "");
        if (filtered !== phone.value) {
          phone.value = filtered;
          // restore caret safely
          try {
            phone.setSelectionRange(caret - 1, caret - 1);
          } catch (e) {}
        }
      });
      // sanitize pasted content
      phone.addEventListener("paste", (e) => {
        e.preventDefault();
        const text = (e.clipboardData || window.clipboardData).getData("text");
        const filtered = text.replace(/[^0-9+\-()\s]/g, "");
        const start = phone.selectionStart || 0;
        const end = phone.selectionEnd || 0;
        const newVal =
          phone.value.slice(0, start) + filtered + phone.value.slice(end);
        phone.value = newVal;
        validateCurrentInputs();
      });
    }
  }
}

renderInputs();

async function generateQR() {
  let data = "";

  // ensure inputs are valid before generating
  if (!validateCurrentInputs()) {
    return;
  }

  if (type === "wifi") {
    const ssid = document.getElementById("ssid").value;
    const pass = document.getElementById("password").value;
    data = `WIFI:T:WPA;S:${ssid};P:${pass};;`;
  } else {
    const val = document.getElementById("data").value;
    if (!val) {
      alert("⚠️ Please enter valid input");
      return;
    }

    if (type === "email") data = `mailto:${val}`;
    else if (type === "phone") data = `tel:${val}`;
    else data = val;
  }

  const logoInput = document.getElementById("logo");
  let logoURL = "";

  if (logoInput && logoInput.files.length > 0) {
    // create a styled logo (rounded/circle/square with border & shadow)
    const file = logoInput.files[0];
    const style = document.getElementById("logo-style")?.value || "rounded";
    const borderColor =
      document.getElementById("logo-border-color")?.value || "#ffffff";
    const borderWidth = parseInt(
      document.getElementById("logo-border-width")?.value || "4",
      10,
    );
    try {
      logoURL = await createStyledLogo(file, {
        style,
        borderColor,
        borderWidth,
      });
    } catch (e) {
      // fallback to raw object URL
      logoURL = URL.createObjectURL(file);
    }
  }

  qrCode.update({
    data: data,
    width: document.getElementById("size").value,
    height: document.getElementById("size").value,
    image: logoURL || undefined,
    image: logoURL || undefined,
    imageOptions: {
      crossOrigin: "anonymous",
      margin: 6,
      imageSize: 0.45,
    },
    qrOptions: {
      errorCorrectionLevel: document.getElementById("error")?.value || "M",
    },
    dotsOptions: {
      color: document.getElementById("fg-color").value,
      type: document.getElementById("style").value,
    },
    backgroundOptions: {
      color: document.getElementById("bg-color").value,
    },
    cornersSquareOptions: {
      type: "extra-rounded",
    },
    cornersDotOptions: {
      type: "dot",
    },
  });
  // update status and save button
  showStatus("QR updated");
  enableSaveIfPresent();
}

// createStyledLogo: draw an attractive rounded/circle/square image with border and shadow
function createStyledLogo(file, opts = {}) {
  const { style = "rounded", borderColor = "#fff", borderWidth = 4 } = opts;
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvasSize = 512;
        const canvas = document.createElement("canvas");
        canvas.width = canvasSize;
        canvas.height = canvasSize;
        const ctx = canvas.getContext("2d");

        // draw soft shadow ellipse
        ctx.fillStyle = "rgba(0,0,0,0.25)";
        ctx.beginPath();
        ctx.ellipse(
          canvasSize / 2,
          canvasSize / 2 + 20,
          canvasSize * 0.38,
          canvasSize * 0.18,
          0,
          0,
          Math.PI * 2,
        );
        ctx.fill();

        // prepare clipping path
        const pad = 24 + borderWidth;
        const size = canvasSize - pad * 2;
        const cx = canvasSize / 2;
        const cy = canvasSize / 2;
        ctx.save();
        if (style === "circle") {
          ctx.beginPath();
          ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
        } else if (style === "rounded") {
          const r = Math.max(24, size * 0.12);
          roundRectPath(ctx, pad, pad, size, size, r);
          ctx.clip();
        } else {
          // square
          ctx.beginPath();
          ctx.rect(pad, pad, size, size);
          ctx.clip();
        }

        // draw image fitted to box
        const imgRatio = img.width / img.height;
        let dw = size,
          dh = size,
          dx = pad,
          dy = pad;
        if (imgRatio > 1) {
          // wide
          dh = size;
          dw = size * imgRatio;
          dx = pad - (dw - size) / 2;
        } else {
          // tall
          dw = size;
          dh = size / imgRatio;
          dy = pad - (dh - size) / 2;
        }
        ctx.drawImage(img, dx, dy, dw, dh);
        ctx.restore();

        // draw border
        if (borderWidth > 0) {
          ctx.lineWidth = borderWidth;
          ctx.strokeStyle = borderColor;
          if (style === "circle") {
            ctx.beginPath();
            ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
            ctx.stroke();
          } else if (style === "rounded") {
            const r = Math.max(24, size * 0.12);
            roundRectStroke(ctx, pad, pad, size, size, r);
          } else {
            ctx.strokeRect(pad, pad, size, size);
          }
        }

        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function roundRectStroke(ctx, x, y, w, h, r) {
  roundRectPath(ctx, x, y, w, h, r);
  ctx.stroke();
}

function downloadQR(format = "png") {
  qrCode.download({
    name: "qr-code",
    extension: format,
  });
}

function copyQR() {
  const canvas = document.querySelector("#qr-preview canvas");
  canvas.toBlob((blob) => {
    navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    alert("Copied!");
  });
}

function toggleTheme() {
  const body = document.body;
  body.classList.toggle("light");
  // persist
  if (body.classList.contains("light")) localStorage.setItem("theme", "light");
  else localStorage.removeItem("theme");
  updateThemeToggle();
}

function updateThemeToggle() {
  const btn = document.getElementById("theme-toggle");
  const isLight = document.body.classList.contains("light");
  if (!btn) return;
  btn.textContent = isLight ? "☀️" : "🌙";
  btn.title = isLight ? "Switch to dark theme" : "Switch to light theme";
  btn.setAttribute(
    "aria-label",
    isLight ? "Switch to dark theme" : "Switch to light theme",
  );
}

/* --- Enhanced color picker UX --- */
const fgColorInput = document.getElementById("fg-color");
const bgColorInput = document.getElementById("bg-color");
const fgHexInput = document.getElementById("fg-hex");
const bgHexInput = document.getElementById("bg-hex");
const fgPreview = document.getElementById("fg-preview");
const bgPreview = document.getElementById("bg-preview");
const paletteEl = document.getElementById("color-palette");
const contrastStatus = document.getElementById("contrastStatus");
let activeTarget = "fg"; // last-focused target

const presetColors = [
  "#000000",
  "#ffffff",
  "#1f2937",
  "#111827",
  "#6366f1",
  "#ef4444",
  "#10b981",
  "#f59e0b",
  "#7c3aed",
];

function setPreview(el, color) {
  if (!el) return;
  el.style.background = color;
}

function toHashHex(v) {
  if (!v) return v;
  if (v[0] !== "#") v = "#" + v;
  return v.toUpperCase();
}

function updateContrast() {
  const fg = fgColorInput?.value || "#000000";
  const bg = bgColorInput?.value || "#ffffff";
  const ratio = contrastRatio(fg, bg).toFixed(2);
  const ok = contrastRatio(fg, bg) >= 4.5;
  contrastStatus.textContent = `Contrast: ${ratio} ${ok ? "• Good" : "• Low"}`;
  contrastStatus.style.color = ok ? "#10b981" : "#f59e0b";
}

function contrastRatio(a, b) {
  const L1 = luminance(hexToRgb(a));
  const L2 = luminance(hexToRgb(b));
  const top = Math.max(L1, L2);
  const bot = Math.min(L1, L2);
  return (top + 0.05) / (bot + 0.05);
}

function hexToRgb(hex) {
  hex = hex.replace("#", "");
  if (hex.length === 3)
    hex = hex
      .split("")
      .map((h) => h + h)
      .join("");
  const num = parseInt(hex, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function luminance(rgb) {
  const srgb = [rgb.r / 255, rgb.g / 255, rgb.b / 255].map((c) => {
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

// initialize palette
presetColors.forEach((col) => {
  const b = document.createElement("button");
  b.className = "swatch";
  b.style.background = col;
  b.setAttribute("aria-label", col);
  b.addEventListener("click", () => {
    if (activeTarget === "fg") {
      fgColorInput.value = col;
      fgHexInput.value = toHashHex(col);
      setPreview(fgPreview, col);
    } else {
      bgColorInput.value = col;
      bgHexInput.value = toHashHex(col);
      setPreview(bgPreview, col);
    }
    updateContrast();
    try {
      generateQR();
    } catch {}
  });
  paletteEl.appendChild(b);
});

// sync inputs and previews
function bindColorInputs() {
  if (fgColorInput) {
    fgColorInput.addEventListener("input", () => {
      fgHexInput.value = toHashHex(fgColorInput.value);
      setPreview(fgPreview, fgColorInput.value);
      updateContrast();
      activeTarget = "fg";
      try {
        generateQR();
      } catch {}
    });
    fgColorInput.addEventListener("focus", () => (activeTarget = "fg"));
  }
  if (bgColorInput) {
    bgColorInput.addEventListener("input", () => {
      bgHexInput.value = toHashHex(bgColorInput.value);
      setPreview(bgPreview, bgColorInput.value);
      updateContrast();
      activeTarget = "bg";
      try {
        generateQR();
      } catch {}
    });
    bgColorInput.addEventListener("focus", () => (activeTarget = "bg"));
  }

  if (fgHexInput) {
    fgHexInput.addEventListener("input", () => {
      const v = toHashHex(fgHexInput.value);
      if (/^#[0-9A-F]{6}$/i.test(v)) {
        fgColorInput.value = v;
        setPreview(fgPreview, v);
        updateContrast();
        try {
          generateQR();
        } catch {}
      }
    });
    fgHexInput.addEventListener("focus", () => (activeTarget = "fg"));
  }
  if (bgHexInput) {
    bgHexInput.addEventListener("input", () => {
      const v = toHashHex(bgHexInput.value);
      if (/^#[0-9A-F]{6}$/i.test(v)) {
        bgColorInput.value = v;
        setPreview(bgPreview, v);
        updateContrast();
        try {
          generateQR();
        } catch {}
      }
    });
    bgHexInput.addEventListener("focus", () => (activeTarget = "bg"));
  }
}

// initial values
setPreview(fgPreview, fgColorInput?.value || "#000");
setPreview(bgPreview, bgColorInput?.value || "#fff");
if (fgHexInput) fgHexInput.value = toHashHex(fgColorInput.value);
if (bgHexInput) bgHexInput.value = toHashHex(bgColorInput.value);
bindColorInputs();
updateContrast();

// --- User presets and swap/save actions ---
const swapBtn = document.getElementById("swap-btn");
const saveBtn = document.getElementById("save-btn");
const userPalette = document.getElementById("user-palette");

function swapColors() {
  const fg = fgColorInput.value;
  const bg = bgColorInput.value;
  fgColorInput.value = bg;
  bgColorInput.value = fg;
  fgHexInput.value = toHashHex(fgColorInput.value);
  bgHexInput.value = toHashHex(bgColorInput.value);
  setPreview(fgPreview, fgColorInput.value);
  setPreview(bgPreview, bgColorInput.value);
  updateContrast();
  try {
    generateQR();
  } catch {}
}

function savePreset() {
  const col = activeTarget === "fg" ? fgColorInput.value : bgColorInput.value;
  if (!col) return;
  let up = JSON.parse(localStorage.getItem("userColorPresets") || "[]");
  // avoid duplicates
  if (!up.includes(col)) {
    up.unshift(col);
    up = up.slice(0, 24);
    localStorage.setItem("userColorPresets", JSON.stringify(up));
  }
  renderUserPresets();
}

function renderUserPresets() {
  if (!userPalette) return;
  const up = JSON.parse(localStorage.getItem("userColorPresets") || "[]");
  userPalette.innerHTML = "";
  up.forEach((col, idx) => {
    const b = document.createElement("div");
    b.className = "swatch";
    b.style.background = col;
    b.title = col;
    b.addEventListener("click", () => {
      if (activeTarget === "fg") {
        fgColorInput.value = col;
        fgHexInput.value = toHashHex(col);
        setPreview(fgPreview, col);
      } else {
        bgColorInput.value = col;
        bgHexInput.value = toHashHex(col);
        setPreview(bgPreview, col);
      }
      updateContrast();
      try {
        generateQR();
      } catch {}
    });
    const remove = document.createElement("div");
    remove.className = "remove-overlay";
    remove.textContent = "×";
    remove.title = "Remove preset";
    remove.addEventListener("click", (ev) => {
      ev.stopPropagation();
      up.splice(idx, 1);
      localStorage.setItem("userColorPresets", JSON.stringify(up));
      renderUserPresets();
    });
    b.appendChild(remove);
    userPalette.appendChild(b);
  });
}

if (swapBtn) swapBtn.addEventListener("click", swapColors);
if (saveBtn) saveBtn.addEventListener("click", savePreset);
renderUserPresets();
// initialize theme from storage
if (localStorage.getItem("theme") === "light")
  document.body.classList.add("light");
updateThemeToggle();

// logo preview update when user selects a file
const logoInputEl = document.getElementById("logo");
const logoPreviewEl = document.getElementById("logo-preview");
if (logoInputEl) {
  logoInputEl.addEventListener("change", () => {
    const f = logoInputEl.files && logoInputEl.files[0];
    if (!f) {
      if (logoPreviewEl) logoPreviewEl.style.backgroundImage = "";
      return;
    }
    const url = URL.createObjectURL(f);
    if (logoPreviewEl) logoPreviewEl.style.backgroundImage = `url(${url})`;
  });
}

/* History */
function renderHistory() {
  const div = document.getElementById("history");
  let history = JSON.parse(localStorage.getItem("qrHistory")) || [];

  div.innerHTML = history
    .map((item, index) => {
      const imgSrc = item.img;
      const time = item.time || "Saved earlier";

      if (!imgSrc) return ""; // skip invalid entries

      return `
      <div class="history-item">
        <img src="${imgSrc}" onclick="openPreview('${imgSrc}')" style="cursor:pointer">
        <p>${time}</p>
        <button onclick="editQR(${index})">Edit</button>   <!-- correct index -->
        <button onclick="deleteQR(${index})">Delete</button>
      </div>
    `;
    })
    .join("");
}

function renderHistory() {
  const div = document.getElementById("history");
  let history = JSON.parse(localStorage.getItem("qrHistory")) || [];

  div.innerHTML = history
    .map((item, index) => {
      const imgSrc = item.img;
      const time = item.time || "Saved earlier";

      if (!imgSrc) return ""; // skip invalid

      return `
      <div class="history-item">
        <img src="${imgSrc}" onclick="openPreview('${imgSrc}')" style="cursor:pointer">
        <p>${time}</p>
        <button onclick="editQR(${index})">Edit</button>
        <button onclick="deleteQR(${index})">Delete</button>
      </div>
    `;
    })
    .join("");
}

renderHistory();

function showStatus(msg, timeout = 2500) {
  const s = document.getElementById("status");
  if (s) {
    s.textContent = msg;
    clearTimeout(s._t);
    s._t = setTimeout(() => {
      s.textContent = "";
    }, timeout);
  }
}

function showError(id, msg) {
  const el = document.getElementById(id + "-error");
  if (el) el.textContent = msg;
}

function clearError(id) {
  const el = document.getElementById(id + "-error");
  if (el) el.textContent = "";
}

function validateCurrentInputs() {
  if (type === "wifi") {
    const ssid = document.getElementById("ssid");
    const pass = document.getElementById("password");
    let ok = true;
    if (!ssid) return false;
    if (!ssid.checkValidity()) {
      showError("ssid", "Enter WiFi name (max 64 chars)");
      ok = false;
    } else clearError("ssid");
    if (pass && pass.value && pass.value.length < 8) {
      showError("password", "Password must be at least 8 characters");
      ok = false;
    } else clearError("password");
    return ok;
  } else {
    const data = document.getElementById("data");
    if (!data) return false;
    if (!data.checkValidity()) {
      if (type === "url")
        showError("data", "Enter a valid URL starting with http(s)://");
      else if (type === "email")
        showError("data", "Enter a valid email address");
      else if (type === "phone")
        showError("data", "Enter a valid phone number, digits and optional +");
      else showError("data", "Enter valid text");
      return false;
    }
    clearError("data");
    return true;
  }
  const data = document.getElementById("data");
  if (!data) return false;
  const val = data.value.trim();

  if (type === "text") {
    // disallow obvious URLs, emails and long numeric-only strings in plain text mode
    const looksLikeUrl = /https?:\/\//i.test(val) || /www\./i.test(val);
    const looksLikeEmail = /@.+\./.test(val);
    const digitsOnly = val.replace(/[^0-9]/g, "");
    if (!val) {
      showError("data", "Please enter some text");
      return false;
    }
    if (looksLikeUrl) {
      showError("data", "Text should not contain URLs — switch to URL tab");
      return false;
    }
    if (looksLikeEmail) {
      showError(
        "data",
        "Text should not contain email addresses — switch to Email tab",
      );
      return false;
    }
    if (
      digitsOnly.length >= 7 &&
      digitsOnly.length === val.replace(/\D/g, "").length
    ) {
      showError("data", "Text appears numeric — switch to Phone tab");
      return false;
    }
    clearError("data");
    return true;
  }

  if (type === "url") {
    if (!data.checkValidity()) {
      showError("data", "Enter a valid URL starting with http(s)://");
      return false;
    }
    clearError("data");
    return true;
  }

  if (type === "email") {
    if (!data.checkValidity()) {
      showError("data", "Enter a valid email address");
      return false;
    }
    clearError("data");
    return true;
  }

  if (type === "phone") {
    // allow +, digits, spaces, dashes; require 7-15 digits
    const cleaned = val.replace(/[^0-9]/g, "");
    if (!cleaned || cleaned.length < 7 || cleaned.length > 15) {
      showError("data", "Enter a valid phone number with 7–15 digits");
      return false;
    }
    // enforce pattern if input has plus it should be leading
    if (/\+/.test(val) && !/^\+/.test(val)) {
      showError("data", "Use + only at the start of the phone number");
      return false;
    }
    clearError("data");
    return true;
  }

  // fallback
  if (!data.checkValidity()) {
    showError("data", "Invalid input");
    return false;
  }
  clearError("data");
  return true;
}

// debounce helper
function debounce(fn, wait = 250) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

const debouncedGenerate = debounce(() => {
  try {
    if (validateCurrentInputs()) generateQR();
  } catch {}
}, 300);

document.addEventListener("input", debouncedGenerate);

function previewQR(src) {
  const newTab = window.open();
  newTab.document.body.innerHTML = `<img src="${src}" style="width:300px">`;
}

// keyboard shortcuts
document.addEventListener("keydown", (e) => {
  // Ctrl/Cmd+G to generate
  if ((e.ctrlKey || e.metaKey) && (e.key === "g" || e.key === "G")) {
    e.preventDefault();
    if (validateCurrentInputs()) generateQR();
  }
});

function saveQR() {
  const canvas = document.querySelector("#qr-preview canvas");

  if (!canvas) {
    alert("⚠️ Please generate a QR code first!");
    return;
  }

  const dataURL = canvas.toDataURL("image/png");

  // Get existing history or empty
  let history = JSON.parse(localStorage.getItem("qrHistory")) || [];

  const newItem = {
    img: dataURL,
    time: new Date().toLocaleString(),
  };

  history.unshift(newItem); // Add to front
  history = history.slice(0, 5); // Keep only last 5

  localStorage.setItem("qrHistory", JSON.stringify(history));

  renderHistory();
}

// saveHistory: automatically store the last generated QR into history
function saveHistory() {
  const canvas = document.querySelector("#qr-preview canvas");
  if (!canvas) return;

  const dataURL = canvas.toDataURL("image/png");

  let history = JSON.parse(localStorage.getItem("qrHistory")) || [];

  const newItem = {
    img: dataURL,
    time: new Date().toLocaleString(),
  };

  history.unshift(newItem);
  history = history.slice(0, 5);
  localStorage.setItem("qrHistory", JSON.stringify(history));

  renderHistory();
}

// enable/disable save button appropriately
const saveBtnEl = document.querySelector("button[onclick='saveQR()']");
if (saveBtnEl) saveBtnEl.disabled = true;

function enableSaveIfPresent() {
  const canvas = document.querySelector("#qr-preview canvas");
  if (saveBtnEl) saveBtnEl.disabled = !canvas;
}

function loadQR(src) {
  const preview = document.getElementById("qr-preview");
  preview.innerHTML = `<img src="${src}" style="width:250px">`;
}

function deleteQR(index) {
  let history = JSON.parse(localStorage.getItem("qrHistory")) || [];

  history.splice(index, 1);

  localStorage.setItem("qrHistory", JSON.stringify(history));
  renderHistory();
}

function openPreview(src) {
  const modal = document.getElementById("previewModal");
  document.getElementById("previewImage").src = src;
  modal.style.display = "flex";
}

function closePreview() {
  document.getElementById("previewModal").style.display = "none";
}

function closePreview() {
  document.getElementById("previewModal").style.display = "none";
}

// save button state is managed via enableSaveIfPresent()

// temporary
localStorage.removeItem("qrHistory");

function editQR(index) {
  // Get history from localStorage
  let history = JSON.parse(localStorage.getItem("qrHistory")) || [];
  const item = history[index];

  if (!item || !item.img) {
    alert("QR not found!");
    return;
  }

  // Clear previous QR from preview
  const preview = document.getElementById("qr-preview");
  preview.innerHTML = "";

  // Ask user for new text/URL
  const newText = prompt("Enter new text/URL for this QR:");
  if (!newText) return; // User cancelled

  // Get colors from inputs
  const fgColor = document.getElementById("fg-color")?.value || "#000000";
  const bgColor = document.getElementById("bg-color")?.value || "#ffffff";

  // Generate new QR
  const qr = new QRCodeStyling({
    width: 250,
    height: 250,
    data: newText, // <-- newText is defined here
    dotsOptions: { color: fgColor, type: "rounded" },
    cornersSquareOptions: { type: "extra-rounded" },
    backgroundOptions: { color: bgColor },
    imageOptions: { crossOrigin: "anonymous" },
  });

  qr.append(preview);

  // Save updated QR back into history
  setTimeout(() => {
    const canvas = document.querySelector("#qr-preview canvas");
    if (canvas) {
      item.img = canvas.toDataURL("image/png");
      item.time = new Date().toLocaleString(); // update timestamp
      history[index] = item;
      localStorage.setItem("qrHistory", JSON.stringify(history));
      renderHistory();
      alert("✅ QR updated!");
    }
  }, 100);
}
