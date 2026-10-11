/*
 * Graviminer: gravity-controlled mining game.
 * Plain Canvas 2D, no dependencies. Fixed 60 Hz simulation; redraws only when the world changes.
 */
(() => {
  "use strict";

  // ---------- configuration ----------
  const W = 800;
  const H = 800;
  const SIM_HZ = 60;
  const STEP_MS = 1000 / SIM_HZ;
  const MAX_CATCHUP_STEPS = 5;

  const START_X = 100;
  const START_Y = 155;
  const SHIP_R = 25;
  const SHIP_SIZE = 50;
  const ORE_R = 10;
  const ORE_SIZE = 30;
  const ROD_WIDTH = 4;

  const MAX_FUEL = 100;
  const MAX_HEALTH = 100;
  const FUEL_BURN = 1.5;
  const FUEL_REGEN = 0.5;
  const HEALTH_REGEN = 0.05;
  const PULL = 0.04;
  const BOOST = 0.5;
  const DRAG = 0.98;
  const IMPACT_FLIP = -1.1;
  const HIT_DAMAGE_BASE = 1;
  const HIT_DAMAGE_PER_SPEED = 2.5;
  const HIT_DAMAGE_CAP = 50;

  const INTRO_SECONDS = 5;
  const GAME_SECONDS = 60;
  const OUTRO_SECONDS = 5;

  // Trail ghosts: alpha = e^(-i^2), same decay as the original sketch.
  const TRAIL_ALPHA = [1, Math.exp(-1), Math.exp(-4)];

  const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
  const COLOR = {
    rod: "#e5e7eb",
    rodHit: "#f87171",
    text: "#e7e9ee",
    muted: "#7b8391",
    health: "#f87171",
    fuel: "#67e8f9",
    ore: "#a78bfa",
    track: "rgba(255,255,255,0.07)",
    card: "rgba(12,14,18,0.92)",
    line: "#262b35",
  };

  const GAUGE_W = 100;
  const LEVEL_IDS = [1, 2, 3, 4, 5, 6, 7, 8];

  // ---------- level layouts: line segments [x1, y1, x2, y2] ----------
  const diamond = (cx, cy, r) => [
    [cx, cy - r, cx + r, cy],
    [cx + r, cy, cx, cy + r],
    [cx, cy + r, cx - r, cy],
    [cx - r, cy, cx, cy - r],
  ];

  const BORDER = [
    [0, 50, 0, H],
    [W, 50, W, H],
    [0, 50, W, 50],
    [0, H, W, H],
  ];

  const LEVEL_RODS = {
    1: [],
    2: [[W / 2, H / 2 + 50, W, H / 3]],
    3: [
      [W / 2 + 20, H / 2 - 50, W, H / 3 - 50],
      [0, H / 2 + 60, W / 2 + 22, 2 * H / 3 + 60],
    ],
    4: diamond(400, 400, 100),
    5: [
      ...diamond(400, 250, 50),
      ...diamond(400, 650, 50),
      ...diamond(600, 450, 50),
      ...diamond(200, 450, 50),
    ],
    6: [
      ...diamond(200, 650, 50),
      [400, 800, 500, 600],
      ...diamond(600, 250, 50),
      [400, 50, 300, 250],
    ],
    7: [
      ...diamond(600, 250, 50),
      [400, 300, 400, 500],
      [200, 500, 200, 700],
      [100, 600, 300, 600],
      [100, 200, 200, 300],
      [550, 550, 650, 650],
    ],
    8: [
      [300, 300, 500, 500],
      [500, 300, 300, 500],
      [0, 200, 200, 200],
      [100, 150, 100, 250],
      [600, 200, 800, 200],
      [700, 150, 700, 250],
      [0, 600, 200, 600],
      [600, 600, 800, 600],
      ...diamond(400, 600, 50),
    ],
  };

  // ---------- state ----------
  const state = {
    screen: "LOGIN", // LOGIN | INIT | HOME | INTRO | GAME | OUTRO
    level: 1,
    frames: 0,
    timer: 0,
    ship: null,
    rods: [],
    ore: null,
    oreCount: 0,
  };
  const pointer = { x: 0, y: 0, down: false };
  const keys = { boost: false };

  // ---------- DOM ----------
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const menu = document.getElementById("menu");
  const screens = {
    login: document.getElementById("screen-login"),
    username: document.getElementById("screen-username"),
    home: document.getElementById("screen-home"),
  };
  const usernameForm = document.getElementById("usernameForm");
  const usernameInput = document.getElementById("usernameInput");
  const usernameMsg = document.getElementById("usernameMsg");
  const levelGrid = document.getElementById("levels");

  // ---------- assets ----------
  const shipImg = new Image();
  shipImg.src = "assets/spaceship.png";
  const oreImg = new Image();
  oreImg.src = "assets/amethyst.png";
  const imgReady = (img) => img.complete && img.naturalWidth > 0;

  // ---------- music (one track at a time) ----------
  const music = (() => {
    const tracks = {
      part1: new Audio("assets/organica-part1.mp3"),
      part2: new Audio("assets/organica-part2.mp3"),
      part3: new Audio("assets/organica-part3.mp3"),
      part4: new Audio("assets/organica-part4.mp3"),
    };
    for (const a of Object.values(tracks)) a.preload = "auto";
    let current = null;
    return {
      play(name, loop) {
        if (current) {
          current.pause();
          current.currentTime = 0;
        }
        current = tracks[name];
        current.loop = loop;
        current.currentTime = 0;
        current.play().catch(() => {});
      },
    };
  })();

  // ---------- helpers ----------
  const isWorld = (s) => s === "INTRO" || s === "GAME" || s === "OUTRO";

  function levelRods(level) {
    return [...BORDER, ...(LEVEL_RODS[level] || [])].map(([x1, y1, x2, y2]) => ({
      x1, y1, x2, y2, hit: false,
    }));
  }

  function levelLabel() {
    return state.level === 1 ? "Tutorial" : `Level ${state.level}`;
  }

  function createShip(x, y) {
    return {
      x, y, vx: 0, vy: 0,
      fuel: MAX_FUEL,
      health: MAX_HEALTH,
      tx: new Float64Array(3).fill(x), // recent positions, newest first
      ty: new Float64Array(3).fill(y),
    };
  }

  // Same geometry as the original: distance from the projected point to the centre,
  // plus a bounding-box check padded by the radius.
  function segmentHitsCircle(cx, cy, r, x1, y1, x2, y2) {
    const abx = x2 - x1;
    const aby = y2 - y1;
    const t = ((cx - x1) * abx + (cy - y1) * aby) / (abx * abx + aby * aby);
    const px = x1 + abx * t;
    const py = y1 + aby * t;
    const dx = px - cx;
    const dy = py - cy;
    if (dx * dx + dy * dy > r * r) return false;
    return (
      px <= Math.max(x1, x2) + r &&
      px >= Math.min(x1, x2) - r &&
      py <= Math.max(y1, y2) + r &&
      py >= Math.min(y1, y2) - r
    );
  }

  function circlesHit(x1, y1, r1, x2, y2, r2) {
    const dx = x1 - x2;
    const dy = y1 - y2;
    const sum = r1 + r2;
    return dx * dx + dy * dy <= sum * sum;
  }

  // ---------- simulation ----------
  function stepShip(ship, boosting) {
    const dx = pointer.x - ship.x;
    const dy = pointer.y - ship.y;

    let force = PULL;
    if (boosting && ship.fuel > 0) {
      force = BOOST;
      ship.fuel -= FUEL_BURN;
    }
    const k = force / (dx * dx + dy * dy + 0.001);
    ship.vx += dx * Math.abs(dx) * k;
    ship.vy += dy * Math.abs(dy) * k;

    ship.tx[2] = ship.tx[1]; ship.tx[1] = ship.tx[0]; ship.tx[0] = ship.x;
    ship.ty[2] = ship.ty[1]; ship.ty[1] = ship.ty[0]; ship.ty[0] = ship.y;

    ship.x += ship.vx;
    ship.y += ship.vy;
    ship.vx *= DRAG;
    ship.vy *= DRAG;
  }

  function collideRods(ship) {
    for (const rod of state.rods) {
      if (segmentHitsCircle(ship.x, ship.y, SHIP_R, rod.x1, rod.y1, rod.x2, rod.y2)) {
        rod.hit = true;
        const speed = Math.sqrt(ship.vx * ship.vx + ship.vy * ship.vy);
        ship.health -= Math.min(HIT_DAMAGE_BASE + speed * HIT_DAMAGE_PER_SPEED, HIT_DAMAGE_CAP);
        ship.vx *= IMPACT_FLIP;
        ship.vy *= IMPACT_FLIP;
      } else {
        rod.hit = false;
      }
    }
  }

  function spawnOre() {
    let x = 400;
    let y = 400;
    for (let attempt = 0; attempt < 500; attempt++) {
      x = Math.ceil(10 + Math.random() * 780);
      y = 35 + Math.ceil(Math.random() * 775);
      if (!state.rods.some((r) => segmentHitsCircle(x, y, ORE_R, r.x1, r.y1, r.x2, r.y2))) {
        break;
      }
    }
    return { x, y };
  }

  function advanceClock() {
    state.frames++;
    state.timer = Math.ceil(state.frames / SIM_HZ);
  }

  function tick() {
    const s = state;
    if (s.screen === "GAME") {
      const ship = s.ship;
      stepShip(ship, keys.boost);
      collideRods(ship);
      if (!s.ore) s.ore = spawnOre();
      if (circlesHit(ship.x, ship.y, SHIP_R, s.ore.x, s.ore.y, ORE_R)) {
        s.ore = null;
        s.oreCount++;
      }
      if (ship.fuel < MAX_FUEL && !pointer.down) ship.fuel += FUEL_REGEN;
      if (ship.health < MAX_HEALTH) ship.health += HEALTH_REGEN;
      advanceClock();
      if (ship.health <= 0 || s.timer > GAME_SECONDS) enter("OUTRO");
    } else if (s.screen === "INTRO") {
      advanceClock();
      if (s.timer > INTRO_SECONDS) enter("GAME");
    } else if (s.screen === "OUTRO") {
      advanceClock();
      if (s.timer > OUTRO_SECONDS) enter("HOME");
    }
  }

  // ---------- rendering ----------
  function drawRods() {
    ctx.lineCap = "round";
    ctx.lineWidth = ROD_WIDTH;

    ctx.strokeStyle = COLOR.rod;
    ctx.beginPath();
    for (const r of state.rods) {
      if (!r.hit) { ctx.moveTo(r.x1, r.y1); ctx.lineTo(r.x2, r.y2); }
    }
    ctx.stroke();

    ctx.strokeStyle = COLOR.rodHit;
    ctx.beginPath();
    for (const r of state.rods) {
      if (r.hit) { ctx.moveTo(r.x1, r.y1); ctx.lineTo(r.x2, r.y2); }
    }
    ctx.stroke();
  }

  function drawOre(o) {
    if (imgReady(oreImg)) {
      ctx.drawImage(oreImg, o.x - ORE_SIZE / 2, o.y - ORE_SIZE / 2, ORE_SIZE, ORE_SIZE);
    } else {
      ctx.fillStyle = COLOR.ore;
      ctx.beginPath();
      ctx.arc(o.x, o.y, ORE_R, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawShip(ship) {
    if (!imgReady(shipImg)) return;
    const half = SHIP_SIZE / 2;
    ctx.drawImage(shipImg, ship.x - half, ship.y - half, SHIP_SIZE, SHIP_SIZE);
    for (let i = 0; i < TRAIL_ALPHA.length; i++) {
      ctx.globalAlpha = TRAIL_ALPHA[i];
      ctx.drawImage(shipImg, ship.tx[i] - half, ship.ty[i] - half, SHIP_SIZE, SHIP_SIZE);
    }
    ctx.globalAlpha = 1;
  }

  function drawGauge(label, y, fraction, color) {
    const x = W - 20 - GAUGE_W;
    ctx.textAlign = "right";
    ctx.font = `500 11px ${FONT}`;
    ctx.fillStyle = COLOR.muted;
    ctx.fillText(label, x - 10, y + 2);
    ctx.textAlign = "left";

    ctx.fillStyle = COLOR.track;
    ctx.fillRect(x, y, GAUGE_W, 4);
    ctx.fillStyle = color;
    ctx.fillRect(x, y, GAUGE_W * Math.min(1, Math.max(0, fraction)), 4);
  }

  function drawHUD() {
    const ship = state.ship;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";

    if (imgReady(oreImg)) ctx.drawImage(oreImg, 14, 12, 18, 18);
    ctx.fillStyle = COLOR.text;
    ctx.font = `600 16px ${FONT}`;
    ctx.fillText(String(state.oreCount), 40, 21);

    ctx.fillStyle = COLOR.muted;
    ctx.font = `500 13px ${FONT}`;
    ctx.fillText(`${Math.max(0, GAME_SECONDS - state.timer)}s`, 14, 46);

    drawGauge("HP", 18, Math.max(0, ship.health) / MAX_HEALTH, COLOR.health);
    drawGauge("FUEL", 30, Math.max(0, ship.fuel) / MAX_FUEL, COLOR.fuel);
  }

  function drawCard(w, h) {
    const x = (W - w) / 2;
    const y = (H - h) / 2;
    ctx.fillStyle = COLOR.card;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = COLOR.line;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    return { cx: W / 2, cy: H / 2 };
  }

  function drawIntroCard() {
    const { cx, cy } = drawCard(260, 150);
    ctx.fillStyle = COLOR.muted;
    ctx.font = `600 12px ${FONT}`;
    ctx.fillText(levelLabel().toUpperCase(), cx, cy - 36);
    ctx.fillStyle = COLOR.text;
    ctx.font = `600 56px ${FONT}`;
    ctx.fillText(String(INTRO_SECONDS + 1 - state.timer), cx, cy + 12);
  }

  function drawOutroCard() {
    const { cx, cy } = drawCard(600, 170);
    const lost = state.ship.health <= 0;
    ctx.fillStyle = lost ? COLOR.health : COLOR.text;
    ctx.font = `500 15px ${FONT}`;
    const msg = lost
      ? "You lost all ores, better luck next time"
      : `You collected ${state.oreCount} ores, you will be compensated accordingly`;
    ctx.fillText(msg, cx, cy - 22);
    ctx.fillStyle = COLOR.muted;
    ctx.font = `600 28px ${FONT}`;
    ctx.fillText(String(OUTRO_SECONDS + 1 - state.timer), cx, cy + 34);
  }

  function render() {
    ctx.clearRect(0, 0, W, H);
    const s = state.screen;
    if (!isWorld(s)) return;
    drawRods();
    if (state.ore) drawOre(state.ore);
    drawShip(state.ship);
    if (s === "GAME") drawHUD();
    else if (s === "INTRO") drawIntroCard();
    else drawOutroCard();
  }

  // ---------- canvas sizing (HiDPI, logical 800x800) ----------
  function fitCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const px = Math.round(W * dpr);
    if (canvas.width !== px) {
      canvas.width = px;
      canvas.height = px;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    dirty = true;
  }

  // ---------- menus ----------
  function showMenu(which) {
    menu.hidden = which === null;
    for (const [key, el] of Object.entries(screens)) el.hidden = key !== which;
  }

  function refreshPanels() {
    updateHallOfFame();
    updateLeaderBoard(state.level);
  }

  function prefillUsername() {
    getCurrentUser((user) => {
      if (user && user.displayName && usernameInput.value === "") {
        usernameInput.value = user.displayName;
      }
    });
  }

  let msgTimer = 0;
  function flashUsernameError() {
    usernameMsg.textContent = "Username cannot be blank…";
    clearTimeout(msgTimer);
    msgTimer = setTimeout(() => {
      usernameMsg.textContent = "Enter your username";
    }, 2000);
  }

  function buildLevelButtons() {
    for (const id of LEVEL_IDS) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn";
      btn.textContent = id === 1 ? "Tutorial" : `Level ${id}`;
      btn.addEventListener("click", () => {
        state.level = id;
        enter("INTRO");
      });
      levelGrid.append(btn);
    }
  }

  function bindMenu() {
    document.getElementById("loginBtn").addEventListener("click", () => {
      googleSignIn(() => enter("INIT"));
    });
    usernameForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = usernameInput.value;
      if (name === "") {
        flashUsernameError();
        return;
      }
      setUsernameForCurrentUser(name, () => enter("HOME"));
    });
    document.getElementById("signoutBtn").addEventListener("click", () => {
      googleSignOut(() => enter("LOGIN"));
    });
    buildLevelButtons();
  }

  // ---------- state transitions ----------
  function startLevel() {
    const x = state.level === 8 ? 400 : START_X;
    state.ship = createShip(x, START_Y);
    state.rods = levelRods(state.level);
    state.ore = null;
    state.oreCount = 0;
  }

  function enter(screen) {
    state.screen = screen;
    state.frames = 0;
    state.timer = 0;
    dirty = true;
    switch (screen) {
      case "LOGIN":
        showMenu("login");
        refreshPanels();
        break;
      case "INIT":
        showMenu("username");
        music.play("part1", true);
        prefillUsername();
        refreshPanels();
        break;
      case "HOME":
        showMenu("home");
        music.play("part1", true);
        refreshPanels();
        break;
      case "INTRO":
        showMenu(null);
        startLevel();
        music.play("part3", false);
        updateLeaderBoard(state.level);
        break;
      case "GAME":
        showMenu(null);
        music.play("part2", true);
        break;
      case "OUTRO":
        showMenu(null);
        music.play("part4", false);
        if (state.ship.health > 0) addGameScore(state.level, state.oreCount);
        break;
    }
  }

  // ---------- input ----------
  function bindInput() {
    window.addEventListener(
      "pointermove",
      (e) => {
        const r = canvas.getBoundingClientRect();
        if (r.width === 0) return;
        pointer.x = (e.clientX - r.left) * (W / r.width);
        pointer.y = (e.clientY - r.top) * (H / r.height);
      },
      { passive: true }
    );
    window.addEventListener("pointerdown", () => { pointer.down = true; });
    const release = () => { pointer.down = false; };
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);

    window.addEventListener("keydown", (e) => {
      if (e.code !== "Space") return;
      if (state.screen === "GAME") e.preventDefault();
      keys.boost = true;
    });
    window.addEventListener("keyup", (e) => {
      if (e.code === "Space") keys.boost = false;
    });
    window.addEventListener("blur", () => {
      keys.boost = false;
      release();
    });
  }

  // ---------- main loop: fixed-step update, render only when needed ----------
  let lastTime = null;
  let accumulator = 0;
  let dirty = true;

  function frame(now) {
    if (lastTime === null) lastTime = now;
    accumulator += Math.min(now - lastTime, 250);
    lastTime = now;

    let steps = 0;
    while (accumulator >= STEP_MS && steps < MAX_CATCHUP_STEPS) {
      tick();
      accumulator -= STEP_MS;
      steps++;
    }
    if (steps === MAX_CATCHUP_STEPS) accumulator = 0;

    if (dirty || (steps > 0 && isWorld(state.screen))) {
      render();
      dirty = false;
    }
    requestAnimationFrame(frame);
  }

  function init() {
    bindMenu();
    bindInput();
    fitCanvas();
    window.addEventListener("resize", fitCanvas);
    enter("LOGIN");
    requestAnimationFrame(frame);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
