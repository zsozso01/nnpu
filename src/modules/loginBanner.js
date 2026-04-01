const utils = require("../utils");

const badgeId = "nnpu-login-active-badge";
const footerFlagAttr = "data-nnpu-version";
const outageCardId = "nnpu-login-outage-card";
const autoRefreshKey = "nnpu-outage-autorefresh";

// ─── School name resolver ─────────────────────────────────────────────────────

const SCHOOL_MAP = [
  { pattern: /\bbme\b/i,       name: "BME" },
  { pattern: /corvinus/i,      name: "Corvinus" },
  { pattern: /szte\b/i,        name: "SZTE" },
  { pattern: /\bpte\b/i,       name: "PTE" },
  { pattern: /\belte\b/i,      name: "ELTE" },
  { pattern: /\bde\b/i,        name: "DE" },
  { pattern: /\bme\b/i,        name: "ME" },
  { pattern: /\boe\b/i,        name: "ÓE" },
  { pattern: /\bsoe\b/i,       name: "SoE" },
  { pattern: /\bnke\b/i,       name: "NKE" },
  { pattern: /\bke\b/i,        name: "KE" },
  { pattern: /\bszie\b/i,      name: "SZIE" },
  { pattern: /\bbgf\b/i,       name: "BGF" },
  { pattern: /\bbge\b/i,       name: "BGE" },
  { pattern: /\bszfe\b/i,      name: "SZFE" },
  { pattern: /obuda|óbuda/i,   name: "ÓE" },
  { pattern: /miskolc/i,       name: "ME" },
  { pattern: /debrecen/i,      name: "DE" },
  { pattern: /pecs|pécs/i,     name: "PTE" },
];

function resolveSchoolName() {
  const host = window.location.hostname;
  for (const entry of SCHOOL_MAP) {
    if (entry.pattern.test(host)) {
      return entry.name;
    }
  }
  // Capitalise the leftmost meaningful subdomain part as a fallback
  const parts = host.replace(/\.neptun\..*$/, "").split(".");
  const candidate = parts[0] || parts[parts.length - 1] || "az egyetem";
  return candidate.toUpperCase();
}

// ─── Styles ──────────────────────────────────────────────────────────────────

function isAngularLoginPage() {
  return /:\/\/.*neptun.*\/hallgatoi\/login/i.test(window.location.href);
}

function injectStyles() {
  utils.injectCss(`
    #${badgeId} {
      display: inline-flex;
      align-items: center;
      margin-top: 10px;
      padding: 4px 10px;
      border-radius: 999px;
      font-family: LatoWeb, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.1px;
      color: #ffffff;
      background: linear-gradient(135deg, #16a34a, #0f766e);
      box-shadow: 0 2px 8px rgba(22, 163, 74, 0.35);
      white-space: nowrap;
    }

    #${outageCardId} {
      width: min(92vw, 600px);
      padding: 20px 22px;
      border-radius: 18px;
      background: linear-gradient(145deg, rgba(255,255,255,0.97), rgba(242,243,251,0.95));
      border: 1px solid rgba(9,67,217,0.12);
      box-shadow: 0 20px 50px rgba(33,48,85,0.16);
      font-family: LatoWeb, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
      color: #213055;
    }

    #${outageCardId} .nnpu-outage-pill {
      display: inline-flex;
      align-items: center;
      padding: 5px 10px;
      border-radius: 999px;
      background: linear-gradient(135deg, #16a34a, #0f766e);
      color: #fff;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.1px;
      margin-bottom: 12px;
    }

    #${outageCardId} h2 {
      margin: 0 0 8px;
      font-size: 22px;
      font-weight: 900;
      line-height: 1.15;
    }

    #${outageCardId} .nnpu-outage-sub {
      margin: 0 0 14px;
      font-size: 14px;
      line-height: 1.5;
      color: #425173;
    }

    #${outageCardId} .nnpu-outage-actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 10px;
      margin-bottom: 18px;
    }

    #${outageCardId} .nnpu-btn {
      height: 40px;
      padding: 0 16px;
      border: 0;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      white-space: nowrap;
      transition: opacity 0.15s;
    }
    #${outageCardId} .nnpu-btn:hover { opacity: 0.85; }

    #${outageCardId} .nnpu-btn-primary {
      background: #0943d9;
      color: #fff;
    }

    #${outageCardId} .nnpu-btn-toggle {
      background: #eef3ff;
      color: #213055;
    }
    #${outageCardId} .nnpu-btn-toggle.active {
      background: #16a34a;
      color: #fff;
    }

    #${outageCardId} .nnpu-refresh-countdown {
      font-size: 13px;
      color: #6a7892;
    }

    /* ── Snake minigame ── */
    #${outageCardId} .nnpu-game-wrap {
      margin-top: 2px;
      border-top: 1px solid rgba(9,67,217,0.08);
      padding-top: 14px;
    }

    #${outageCardId} .nnpu-game-label {
      font-size: 12px;
      font-weight: 700;
      color: #8892aa;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    #${outageCardId} #nnpu-snake-canvas {
      display: block;
      width: 100%;
      max-width: 300px;
      border-radius: 10px;
      border: 1px solid rgba(9,67,217,0.12);
      background: #f2f3fb;
      cursor: pointer;
      image-rendering: pixelated;
    }

    #${outageCardId} .nnpu-game-hint {
      margin-top: 6px;
      font-size: 12px;
      color: #8892aa;
    }

    #loading-placeholder-index.nnpu-outage-mode {
      gap: 24px;
      padding: 24px;
      background:
        radial-gradient(circle at top left, rgba(9,67,217,0.08), transparent 34%),
        radial-gradient(circle at bottom right, rgba(15,118,110,0.08), transparent 34%),
        #ffffff;
    }
  `);
}

// ─── Utilities ───────────────────────────────────────────────────────────────

function isPlaceholderOnlyState() {
  const placeholder = document.getElementById("loading-placeholder-index");
  const appRoot = document.querySelector("app-root");
  if (!placeholder || !appRoot) return false;
  return appRoot.children.length === 0;
}

// ─── Auto-refresh logic ───────────────────────────────────────────────────────

let refreshTimer = null;
let refreshCountdown = 0;
const REFRESH_INTERVAL = 10; // seconds

async function getAutoRefresh() {
  try {
    return (await GM.getValue(autoRefreshKey)) === "1";
  } catch (e) {
    return false;
  }
}

async function setAutoRefresh(enabled) {
  try {
    await GM.setValue(autoRefreshKey, enabled ? "1" : "0");
  } catch (e) {}
}

function clearAutoRefresh(countdownEl) {
  if (refreshTimer !== null) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
  refreshCountdown = 0;
  if (countdownEl) countdownEl.textContent = "";
}

function startAutoRefresh(countdownEl) {
  clearAutoRefresh(countdownEl);
  refreshCountdown = REFRESH_INTERVAL;
  if (countdownEl) countdownEl.textContent = `(${refreshCountdown}s)`;
  refreshTimer = setInterval(() => {
    refreshCountdown -= 1;
    if (countdownEl) countdownEl.textContent = `(${refreshCountdown}s)`;
    if (refreshCountdown <= 0) {
      window.location.reload();
    }
  }, 1000);
}

// ─── Snake minigame ───────────────────────────────────────────────────────────

function mountSnakeGame(container) {
  const COLS = 20;
  const ROWS = 14;
  const CELL = 14;
  const W = COLS * CELL;
  const H = ROWS * CELL;

  const canvas = document.createElement("canvas");
  canvas.id = "nnpu-snake-canvas";
  canvas.width = W;
  canvas.height = H;
  canvas.title = "Kattints a játékhoz!";
  container.appendChild(canvas);

  const hint = document.createElement("p");
  hint.className = "nnpu-game-hint";
  hint.textContent = "Kattints vagy nyomj Space-t az indításhoz · nyilak / WASD";
  container.appendChild(hint);

  const ctx = canvas.getContext("2d");
  const COLOR_BG = "#f2f3fb";
  const COLOR_SNAKE = "#0943d9";
  const COLOR_HEAD = "#16a34a";
  const COLOR_FOOD = "#e74c3c";
  const COLOR_TEXT = "#213055";

  let snake, dir, nextDir, food, score, running, animFrame;

  function rnd(max) { return Math.floor(Math.random() * max); }
  function randFood() {
    let pos;
    do { pos = { x: rnd(COLS), y: rnd(ROWS) }; }
    while (snake.some(s => s.x === pos.x && s.y === pos.y));
    return pos;
  }

  function init() {
    snake = [{ x: 10, y: 7 }, { x: 9, y: 7 }, { x: 8, y: 7 }];
    dir = { x: 1, y: 0 };
    nextDir = { x: 1, y: 0 };
    food = randFood();
    score = 0;
    running = true;
    hint.textContent = "Nyilak / WASD az irányításhoz";
    loop();
  }

  function draw() {
    ctx.fillStyle = COLOR_BG;
    ctx.fillRect(0, 0, W, H);
    // food
    ctx.fillStyle = COLOR_FOOD;
    ctx.beginPath();
    ctx.arc(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, CELL / 2 - 1, 0, Math.PI * 2);
    ctx.fill();
    // snake
    snake.forEach((seg, i) => {
      ctx.fillStyle = i === 0 ? COLOR_HEAD : COLOR_SNAKE;
      const r = i === 0 ? 4 : 2;
      const x = seg.x * CELL + 1;
      const y = seg.y * CELL + 1;
      const s = CELL - 2;
      ctx.beginPath();
      ctx.roundRect(x, y, s, s, r);
      ctx.fill();
    });
    // score
    ctx.fillStyle = COLOR_TEXT;
    ctx.font = "bold 11px LatoWeb, sans-serif";
    ctx.fillText(`${score} pont`, 6, 14);
  }

  function drawOver(msg) {
    ctx.fillStyle = "rgba(33,48,85,0.62)";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 16px LatoWeb, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(msg, W / 2, H / 2 - 8);
    ctx.font = "12px LatoWeb, sans-serif";
    ctx.fillText("Kattints az újrakezdéshez", W / 2, H / 2 + 14);
    ctx.textAlign = "left";
  }

  function step() {
    dir = nextDir;
    const head = { x: (snake[0].x + dir.x + COLS) % COLS, y: (snake[0].y + dir.y + ROWS) % ROWS };
    if (snake.some(s => s.x === head.x && s.y === head.y)) {
      running = false;
      draw();
      drawOver(`Vége! ${score} pont`);
      hint.textContent = "Kattints az újrakezdéshez";
      return;
    }
    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
      score += 1;
      food = randFood();
    } else {
      snake.pop();
    }
    draw();
  }

  let lastTime = 0;
  const SPEED = 140; // ms per step

  function loop(ts) {
    if (!running) return;
    animFrame = requestAnimationFrame(loop);
    if (!ts || ts - lastTime >= SPEED) {
      lastTime = ts || 0;
      step();
    }
  }

  function handleKey(e) {
    if (!running) return;
    const map = {
      ArrowUp: { x: 0, y: -1 }, w: { x: 0, y: -1 },
      ArrowDown: { x: 0, y: 1 }, s: { x: 0, y: 1 },
      ArrowLeft: { x: -1, y: 0 }, a: { x: -1, y: 0 },
      ArrowRight: { x: 1, y: 0 }, d: { x: 1, y: 0 },
    };
    const nd = map[e.key];
    if (!nd) return;
    if (nd.x === -dir.x && nd.y === -dir.y) return;
    nextDir = nd;
    e.preventDefault();
  }

  // Draw idle state
  ctx.fillStyle = COLOR_BG;
  ctx.fillRect(0, 0, W, H);
  drawOver("🐍 Kattints az indításhoz");

  canvas.addEventListener("click", () => {
    if (animFrame) cancelAnimationFrame(animFrame);
    init();
  });
  canvas.addEventListener("keydown", handleKey);
  document.addEventListener("keydown", e => {
    if (e.key === " " && !running) {
      if (animFrame) cancelAnimationFrame(animFrame);
      init();
    } else {
      handleKey(e);
    }
  });
  canvas.setAttribute("tabindex", "0");
}

// ─── Outage card ──────────────────────────────────────────────────────────────

async function showOutageCard() {
  const placeholder = document.getElementById("loading-placeholder-index");
  if (!placeholder || document.getElementById(outageCardId) || !isPlaceholderOnlyState()) {
    return;
  }

  // Mark as outage mode
  placeholder.classList.add("nnpu-outage-mode");

  const school = resolveSchoolName();
  const isAutoRefreshOn = await getAutoRefresh();

  const card = document.createElement("section");
  card.id = outageCardId;

  // ── Header ──
  const pill = document.createElement("div");
  pill.className = "nnpu-outage-pill";
  pill.textContent = `⚡ NNPU v${GM.info.script.version} Aktív`;
  card.appendChild(pill);

  const heading = document.createElement("h2");
  heading.textContent = "A login oldal most legalább stílusosan áll. 🥔";
  card.appendChild(heading);

  const sub = document.createElement("p");
  sub.className = "nnpu-outage-sub";
  sub.textContent =
    `Úgy tűnik, a ${school} szerverei épp valami fontosabb dologgal foglalkoznak ` +
    `– például léteznek. Az Angular bundle-ök nem álltak fel. ¯\\_(ツ)_/¯`;
  card.appendChild(sub);

  // ── Actions row ──
  const actionsRow = document.createElement("div");
  actionsRow.className = "nnpu-outage-actions";

  // Retry button
  const retryBtn = document.createElement("button");
  retryBtn.className = "nnpu-btn nnpu-btn-primary";
  retryBtn.textContent = "🔄 Újrapróbálás";
  retryBtn.addEventListener("click", () => window.location.reload());
  actionsRow.appendChild(retryBtn);

  // Auto-refresh toggle
  const toggleBtn = document.createElement("button");
  toggleBtn.className = "nnpu-btn nnpu-btn-toggle" + (isAutoRefreshOn ? " active" : "");
  toggleBtn.textContent = isAutoRefreshOn ? "⏱ Auto-frissítés: BE" : "⏱ Auto-frissítés: KI";
  actionsRow.appendChild(toggleBtn);

  // Countdown label
  const countdownEl = document.createElement("span");
  countdownEl.className = "nnpu-refresh-countdown";
  actionsRow.appendChild(countdownEl);

  card.appendChild(actionsRow);

  // ── Toggle handler ──
  let autoOn = isAutoRefreshOn;

  function applyAutoRefreshState() {
    if (autoOn) {
      toggleBtn.classList.add("active");
      toggleBtn.textContent = "⏱ Auto-frissítés: BE";
      startAutoRefresh(countdownEl);
    } else {
      toggleBtn.classList.remove("active");
      toggleBtn.textContent = "⏱ Auto-frissítés: KI";
      clearAutoRefresh(countdownEl);
    }
  }

  toggleBtn.addEventListener("click", async () => {
    autoOn = !autoOn;
    await setAutoRefresh(autoOn);
    applyAutoRefreshState();
  });

  if (autoOn) {
    startAutoRefresh(countdownEl);
  }

  // ── Mini-game ──
  const gameWrap = document.createElement("div");
  gameWrap.className = "nnpu-game-wrap";

  const gameLabel = document.createElement("div");
  gameLabel.className = "nnpu-game-label";
  gameLabel.textContent = "🐍 Míg vársz – kígyó";
  gameWrap.appendChild(gameLabel);

  mountSnakeGame(gameWrap);
  card.appendChild(gameWrap);

  placeholder.appendChild(card);
}

// ─── Footer version tag ───────────────────────────────────────────────────────

function appendFooterVersion() {
  const footerVersion = document.querySelector(".footer__version");
  if (!footerVersion || footerVersion.getAttribute(footerFlagAttr) === "1") {
    return;
  }
  footerVersion.textContent = `${footerVersion.textContent.trim()} | NNPU v${GM.info.script.version}`;
  footerVersion.setAttribute(footerFlagAttr, "1");
}

// ─── Main flow ────────────────────────────────────────────────────────────────

async function showLoginBanner() {
  if (!isAngularLoginPage()) return;

  injectStyles();

  // Short fuse: 1 second before giving up and showing the outage card
  const caption = await utils.waitForElement("h4.login-right__caption", { timeoutMs: 1000 });
  if (!caption || document.getElementById(badgeId)) {
    // Angular didn't come up in time – show outage card and clear the
    // auto-refresh key when content successfully arrives later.
    showOutageCard();
    appendFooterVersion();
    return;
  }

  // Angular is alive – clear the auto-refresh preference so it won't fire
  // on the next successful load.
  try { await GM.deleteValue(autoRefreshKey); } catch (e) {}

  const badge = document.createElement("span");
  badge.id = badgeId;
  badge.textContent = `⚡ NNPU v${GM.info.script.version} Aktív`;
  caption.insertAdjacentElement("afterend", badge);
  appendFooterVersion();
}

module.exports = {
  shouldActivate: () => isAngularLoginPage() || utils.isLoginPage(),
  runOutsideNeptun: true,
  initialize: () => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", showLoginBanner, { once: true });
      return;
    }
    showLoginBanner();
  },
};
