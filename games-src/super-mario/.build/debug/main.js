"use strict";
(() => {
  // games-src/super-mario/src/types.ts
  var TILE = 40;
  var WIDTH = 960;
  var HEIGHT = 540;
  var overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  var clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  var approach = (v, t, d) => v < t ? Math.min(t, v + d) : Math.max(t, v - d);

  // games-src/super-mario/src/levels.ts
  var worlds = [
    { name: "\u9752\u98CE\u8349\u539F", subtitle: "\u6BCF\u4E00\u573A\u5192\u9669\uFF0C\u90FD\u4ECE\u7B2C\u4E00\u8DF3\u5F00\u59CB\u3002", theme: "meadow", mark: "\u2740" },
    { name: "\u8424\u77F3\u5730\u5E95", subtitle: "\u8DDF\u968F\u5FAE\u5149\uFF0C\u53D1\u73B0\u85CF\u5728\u5730\u4E0B\u7684\u79D8\u5BC6\u3002", theme: "cave", mark: "\u25C6" },
    { name: "\u4E91\u4E0A\u7FA4\u5C9B", subtitle: "\u518D\u52C7\u6562\u4E00\u70B9\uFF0C\u5929\u7A7A\u4E5F\u4F1A\u4E3A\u4F60\u8BA9\u8DEF\u3002", theme: "sky", mark: "\u2601" },
    { name: "\u4F59\u70EC\u57CE\u5821", subtitle: "\u8D8A\u8FC7\u706B\u7130\uFF0C\u53BB\u8FCE\u63A5\u6545\u4E8B\u7684\u7ED3\u5C3E\u3002", theme: "castle", mark: "\u265C" }
  ];
  function createWorld(index, bonus = false) {
    const meta = worlds[index], w = { ...meta, index, width: (bonus ? 29 : index === 3 ? 132 : 148) * TILE, blocks: [], enemies: [], pickups: [], platforms: [], spawn: { x: 100, y: 400 }, goal: (index === 3 ? 124 : 140) * TILE, checkpoint: 0, checkpointY: 400 };
    const block = (x, y, kind = "brick", content) => {
      const old = w.blocks.find((b) => b.x === x * TILE && b.y === y * TILE && b.w === TILE);
      if (old) {
        old.kind = kind;
        old.content = content;
        return;
      }
      w.blocks.push({ x: x * TILE, y: y * TILE, w: TILE, h: TILE, kind, content, bump: 0, broken: false });
    };
    const ground = (from, to, y = 12) => {
      for (let x = from; x < to; x++) for (let row2 = y; row2 < 14; row2++) block(x, row2, "ground");
    };
    const row = (a, b, y, kind = "brick") => {
      for (let x = a; x <= b; x++) block(x, y, kind);
    };
    const coins = (a, b, y) => {
      for (let x = a; x <= b; x++) w.pickups.push({ x: x * TILE + 11, y: y * TILE + 8, w: 18, h: 24, baseY: y * TILE + 8, kind: "coin", vx: 0, vy: 0, active: true, emerge: 0, id: -1 });
    };
    const medal = (x, y, id) => w.pickups.push({ x: x * TILE + 3, y: y * TILE, w: 34, h: 34, baseY: y * TILE, kind: "medal", vx: 0, vy: 0, active: true, emerge: 0, id });
    const enemy = (x, kind = "goomba", y = 11) => {
      const h = kind === "boss" ? 96 : kind === "turtle" ? 42 : kind === "plant" ? 44 : 30;
      w.enemies.push({ x: x * TILE + 4, y: kind === "plant" ? y * TILE : (y + 1) * TILE - h, w: kind === "boss" ? 100 : 30, h, kind, vx: kind === "boss" ? -55 : kind === "plant" ? 0 : -45, vy: 0, alive: true, grounded: false, phase: x * 0.7, hit: 0, homeX: x * TILE + 4, homeY: y * TILE, hp: kind === "boss" ? 8 : 1 });
    };
    const pipe = (x, height = 2, plant = false) => {
      for (let j = 0; j < height; j++) {
        w.blocks.push({ x: x * TILE, y: (12 - height + j) * TILE, w: 2 * TILE, h: TILE, kind: "pipe", pipeTop: j === 0, bump: 0, broken: false });
      }
      if (plant) enemy(x + 0.6, "plant", 12 - height - 1);
    };
    const stairs = (x, n) => {
      for (let i = 0; i < n; i++) for (let j = 0; j <= i; j++) block(x + i, 11 - j, "stone");
    };
    const platform = (x, y, axis, range, speed = 0.75) => w.platforms.push({ x: x * TILE, y: y * TILE, w: 3 * TILE, h: 18, homeX: x * TILE, homeY: y * TILE, axis, range: range * TILE, speed, phase: 0, dx: 0, dy: 0 });
    if (bonus) {
      w.theme = "bonus";
      w.name = "\u91D1\u5E01\u5BC6\u5BA4";
      w.width = 29 * TILE;
      w.goal = 999999;
      w.checkpoint = 0;
      w.spawn = { x: 100, y: 400 };
      ground(0, 29);
      row(0, 28, 2, "stone");
      for (let i = 0; i < 3; i++) row(5 + i * 6, 8 + i * 6, 9 - i, "brick");
      coins(3, 22, 10);
      coins(5, 8, 7);
      coins(11, 14, 6);
      coins(17, 20, 5);
      block(21, 8, "question", "life");
      pipe(25, 2);
      w.exit = { x: 25 * TILE, y: 10 * TILE };
      return w;
    }
    if (index === 0) {
      ground(0, 28);
      ground(31, 55);
      ground(58, 83);
      ground(87, 110);
      ground(113, 148);
      block(8, 9, "question", "coin");
      row(12, 16, 9);
      w.blocks.find((b) => b.x === 14 * TILE && b.y === 9 * TILE).content = "mushroom";
      w.blocks.find((b) => b.x === 14 * TILE && b.y === 9 * TILE).kind = "question";
      block(14, 5, "question", "coin");
      enemy(18);
      pipe(22, 2);
      coins(22, 23, 8);
      coins(27, 31, 8);
      medal(29, 7.5, 0);
      row(34, 37, 9);
      block(36, 9, "question", "flower");
      enemy(39);
      enemy(43);
      pipe(46, 2);
      w.warp = { x: 46 * TILE, y: 10 * TILE };
      coins(47, 49, 7);
      row(51, 53, 9);
      block(52, 9, "question", "star");
      coins(55, 58, 8);
      enemy(62, "turtle");
      w.checkpoint = 65 * TILE;
      pipe(69, 2, true);
      row(73, 77, 9);
      row(76, 79, 6);
      medal(78, 5, 1);
      block(74, 9, "question", "mushroom");
      enemy(80);
      coins(83, 87, 8);
      stairs(92, 3);
      coins(94, 99, 7);
      enemy(101, "turtle");
      row(104, 107, 9);
      block(106, 9, "question", "coin");
      coins(109, 113, 8);
      pipe(118, 3, true);
      medal(119, 7, 2);
      enemy(124);
      enemy(126);
      stairs(129, 5);
    } else if (index === 1) {
      ground(0, 24);
      ground(27, 49);
      ground(52, 78);
      ground(82, 103);
      ground(107, 148);
      row(0, 19, 2, "stone");
      row(32, 47, 2, "stone");
      row(57, 78, 2, "stone");
      row(89, 102, 2, "stone");
      row(117, 130, 2, "stone");
      block(8, 9, "question", "mushroom");
      row(12, 18, 8);
      coins(12, 18, 6);
      enemy(16);
      enemy(21, "turtle");
      coins(23, 27, 8);
      row(30, 35, 9);
      block(32, 9, "question", "flower");
      row(35, 38, 6);
      medal(37, 5, 0);
      enemy(39);
      pipe(43, 2, true);
      platform(48, 10, "y", 2, 0.85);
      coins(49, 52, 7);
      enemy(57, "turtle");
      row(61, 66, 9);
      block(64, 9, "question", "star");
      w.checkpoint = 70 * TILE;
      row(73, 77, 8);
      coins(73, 77, 6);
      medal(79, 7, 1);
      platform(78, 10, "x", 2, 0.9);
      pipe(86, 2);
      w.warp = { x: 86 * TILE, y: 10 * TILE };
      enemy(91);
      enemy(94, "turtle");
      row(96, 100, 9);
      block(98, 9, "question", "mushroom");
      coins(102, 108, 8);
      platform(104, 10, "y", 1.5, 0.8);
      stairs(113, 3);
      row(117, 121, 8);
      medal(120, 6, 2);
      enemy(123, "turtle");
      stairs(129, 5);
    } else if (index === 2) {
      ground(0, 16);
      ground(20, 31, 11);
      ground(35, 47);
      ground(51, 62, 10);
      ground(67, 78, 12);
      ground(82, 94, 11);
      ground(98, 109);
      ground(113, 148);
      block(8, 9, "question", "mushroom");
      coins(13, 20, 7);
      platform(16, 11, "y", 1.5);
      medal(18, 7, 0);
      enemy(25, "turtle", 9);
      row(25, 28, 8);
      block(27, 8, "question", "flower");
      coins(30, 35, 7);
      platform(31, 10, "x", 2, 0.6);
      enemy(41);
      row(43, 46, 9);
      coins(47, 51, 6);
      platform(47, 9, "y", 1.5);
      enemy(57, "turtle", 8);
      block(55, 7, "question", "star");
      medal(59, 6, 1);
      platform(62, 10, "x", 2.5, 0.6);
      coins(62, 67, 7);
      w.checkpoint = 71 * TILE;
      block(73, 9, "question", "mushroom");
      platform(78, 10, "y", 2, 0.75);
      coins(78, 83, 7);
      enemy(88, "turtle", 9);
      row(87, 91, 8);
      coins(93, 98, 7);
      platform(94, 10, "x", 2, 0.7);
      enemy(103);
      row(104, 107, 9);
      block(106, 9, "question", "flower");
      coins(109, 114, 7);
      medal(111, 6, 2);
      platform(109, 9, "y", 1.5);
      pipe(119, 2);
      enemy(123, "turtle");
      stairs(128, 6);
    } else {
      ground(0, 23);
      ground(27, 46);
      ground(50, 69);
      ground(73, 93);
      ground(97, 132);
      row(0, 20, 2, "stone");
      row(30, 44, 2, "stone");
      row(55, 67, 2, "stone");
      row(77, 91, 2, "stone");
      row(97, 131, 1, "stone");
      block(7, 9, "question", "mushroom");
      row(12, 15, 9, "stone");
      enemy(18, "turtle");
      coins(22, 27, 8);
      platform(23, 10, "x", 1);
      row(30, 34, 9, "stone");
      row(34, 37, 6, "stone");
      medal(36, 5, 0);
      block(31, 9, "question", "flower");
      enemy(39, "turtle");
      pipe(42, 2, true);
      platform(46, 10, "y", 1.5);
      coins(46, 50, 7);
      w.checkpoint = 55 * TILE;
      block(57, 9, "question", "mushroom");
      row(61, 65, 9, "stone");
      medal(63, 7, 1);
      enemy(66);
      platform(69, 10, "x", 1.5);
      coins(69, 73, 7);
      pipe(78, 2, true);
      row(82, 85, 9);
      block(84, 9, "question", "star");
      enemy(87, "turtle");
      medal(92, 8, 2);
      platform(93, 10, "y", 1.5);
      coins(92, 98, 7);
      block(101, 9, "question", "flower");
      w.bossGate = 104 * TILE;
      enemy(114, "boss", 9);
      w.goal = 125 * TILE;
    }
    return w;
  }

  // games-src/super-mario/src/audio.ts
  var Sound = class {
    constructor() {
      this.enabled = true;
      this.next = 0;
      this.beat = 0;
    }
    async unlock() {
      if (!this.enabled) return;
      try {
        if (!this.context) {
          this.context = new AudioContext();
          this.master = this.context.createGain();
          this.master.gain.value = 0.3;
          this.master.connect(this.context.destination);
        }
        if (this.context.state === "suspended") await this.context.resume();
      } catch {
      }
    }
    toggle() {
      this.enabled = !this.enabled;
      if (this.master && this.context) this.master.gain.setTargetAtTime(this.enabled ? 0.3 : 0, this.context.currentTime, 0.03);
      if (this.enabled) void this.unlock();
    }
    tone(note, time, duration = 0.12, type = "square", volume = 0.14, slide) {
      if (!this.enabled || !this.context || !this.master) return;
      const osc = this.context.createOscillator(), gain = this.context.createGain(), f = 440 * 2 ** ((note - 69) / 12);
      osc.type = type;
      osc.frequency.setValueAtTime(f, time);
      if (slide) osc.frequency.exponentialRampToValueAtTime(440 * 2 ** ((slide - 69) / 12), time + duration);
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(volume, time + 6e-3);
      gain.gain.exponentialRampToValueAtTime(1e-3, time + duration);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start(time);
      osc.stop(time + duration + 0.02);
    }
    effect(name) {
      if (!this.context || !this.enabled) return;
      const t = this.context.currentTime;
      if (name === "jump") this.tone(56, t, 0.16, "square", 0.15, 80);
      if (name === "coin") {
        this.tone(88, t, 0.07, "square", 0.12);
        this.tone(95, t + 0.055, 0.23, "sine", 0.32);
      }
      if (name === "bump") this.tone(44, t, 0.08, "triangle", 0.45, 30);
      if (name === "break") {
        this.tone(43, t, 0.12, "sawtooth", 0.14, 20);
        this.tone(67, t, 0.09, "triangle", 0.23, 33);
      }
      if (name === "stomp") this.tone(61, t, 0.14, "square", 0.18, 35);
      if (name === "power" || name === "checkpoint" || name === "medal") {
        [60, 64, 67, 72, 76, 79].forEach((n, i) => this.tone(n, t + i * 0.065, 0.14, "square", 0.13));
      }
      if (name === "hurt") {
        this.tone(78, t, 0.2, "sawtooth", 0.2, 35);
      }
      if (name === "die") {
        [72, 75, 72, 68, 65, 60, 48].forEach((n, i) => this.tone(n, t + i * 0.14, 0.18, "triangle", 0.4));
      }
      if (name === "fire") this.tone(66, t, 0.1, "sawtooth", 0.12, 30);
      if (name === "flag" || name === "win") {
        [60, 64, 67, 72, 67, 72, 76, 79, 84].forEach((n, i) => this.tone(n, t + i * 0.12, 0.22, "square", 0.16));
      }
    }
    update(playing, theme, star) {
      if (!this.context || !this.enabled) return;
      const now = this.context.currentTime;
      if (!playing) {
        this.next = now + 0.1;
        return;
      }
      if (this.next < now - 0.2) this.next = now;
      const step = star ? 0.105 : theme === "castle" ? 0.18 : theme === "cave" ? 0.19 : 0.16;
      while (this.next < now + 0.1) {
        const melody = [72, 0, 76, 79, 76, 74, 72, 0, 69, 72, 76, 0, 74, 71, 67, 0, 69, 0, 72, 76, 79, 76, 74, 0, 71, 74, 77, 0, 76, 72, 67, 0];
        const minor = theme === "cave" || theme === "castle", transpose = minor ? -3 : star ? 12 : 0, root = [48, 45, 53, 55][Math.floor(this.beat / 8) % 4] + transpose;
        const n = melody[this.beat % melody.length];
        if (n) this.tone(n + transpose, this.next, step * 0.8, theme === "cave" ? "sine" : "triangle", 0.19);
        if (this.beat % 2 === 0) this.tone(root + (this.beat % 4 === 2 ? 12 : 0), this.next, step * 0.8, "triangle", 0.2);
        if (this.beat % 4 === 1) this.tone(root + 19, this.next, 0.06, "square", 0.035);
        this.next += step;
        this.beat++;
      }
    }
  };

  // games-src/super-mario/src/input.ts
  var keys = { ArrowLeft: "left", KeyA: "left", ArrowRight: "right", KeyD: "right", ArrowDown: "down", KeyS: "down", Space: "jump", KeyZ: "jump", KeyK: "jump", ArrowUp: "jump", KeyW: "jump", ShiftLeft: "run", ShiftRight: "run", KeyJ: "run", KeyX: "fire", Escape: "pause", KeyP: "pause", Enter: "start" };
  var Input = class {
    constructor(gesture, blur) {
      this.gesture = gesture;
      this.blur = blur;
      this.keyboard = /* @__PURE__ */ new Set();
      this.pointers = /* @__PURE__ */ new Map();
      this.edges = /* @__PURE__ */ new Set();
      this.releases = /* @__PURE__ */ new Set();
      window.addEventListener("keydown", (e) => {
        const a = keys[e.code];
        if (!a) return;
        if (e.target instanceof HTMLElement && e.target.closest("button,a,input") && e.code !== "Escape") return;
        e.preventDefault();
        if (e.repeat) return;
        this.gesture();
        if (!this.down(a)) this.edges.add(a);
        this.keyboard.add(e.code);
      });
      window.addEventListener("keyup", (e) => {
        const a = keys[e.code];
        if (!a) return;
        this.keyboard.delete(e.code);
        if (!this.down(a)) this.releases.add(a);
      });
      window.addEventListener("blur", () => {
        this.clear();
        this.blur();
      });
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
          this.clear();
          this.blur();
        }
      });
      for (const button of document.querySelectorAll("[data-key]")) {
        button.addEventListener("pointerdown", (e) => {
          e.preventDefault();
          this.gesture();
          const action2 = button.dataset.key;
          if (!this.down(action2)) this.edges.add(action2);
          this.pointers.set(e.pointerId, { action: action2, button });
          button.classList.add("pressed");
          button.setPointerCapture(e.pointerId);
        });
        const release = (e) => {
          const p = this.pointers.get(e.pointerId);
          if (!p) return;
          this.pointers.delete(e.pointerId);
          if (![...this.pointers.values()].some((v) => v.button === p.button)) p.button.classList.remove("pressed");
          if (!this.down(p.action)) this.releases.add(p.action);
        };
        button.addEventListener("pointerup", release);
        button.addEventListener("pointercancel", release);
        button.addEventListener("lostpointercapture", release);
        button.addEventListener("contextmenu", (e) => e.preventDefault());
      }
    }
    down(action2) {
      return [...this.keyboard].some((k) => keys[k] === action2) || [...this.pointers.values()].some((p) => p.action === action2);
    }
    pressed(action2) {
      return this.edges.has(action2);
    }
    released(action2) {
      return this.releases.has(action2);
    }
    end() {
      this.edges.clear();
      this.releases.clear();
    }
    clear() {
      this.keyboard.clear();
      for (const p of this.pointers.values()) p.button.classList.remove("pressed");
      this.pointers.clear();
      this.end();
    }
  };

  // games-src/super-mario/src/save.ts
  var key = "yumo.super-mario.v1";
  function readSave() {
    const base = { unlocked: 0, best: 0, medals: [0, 0, 0, 0], sound: true, clears: [0, 0, 0, 0] };
    try {
      const s = JSON.parse(localStorage.getItem(key) || "null");
      if (!s || typeof s !== "object") return base;
      if (Number.isInteger(s.unlocked)) base.unlocked = Math.max(0, Math.min(3, s.unlocked));
      if (Number.isFinite(s.best)) base.best = Math.max(0, Math.floor(s.best));
      if (typeof s.sound === "boolean") base.sound = s.sound;
      for (let i = 0; i < 4; i++) {
        if (Number.isInteger(s.medals?.[i])) base.medals[i] = s.medals[i] & 7;
        if (Number.isFinite(s.clears?.[i])) base.clears[i] = Math.max(0, s.clears[i]);
      }
    } catch {
    }
    return base;
  }
  function writeSave(s) {
    try {
      localStorage.setItem(key, JSON.stringify(s));
    } catch {
    }
  }

  // games-src/super-mario/src/game.ts
  var Game = class {
    constructor() {
      this.mode = "title";
      this.world = createWorld(0);
      this.player = this.newPlayer();
      this.sound = new Sound();
      this.save = readSave();
      this.particles = [];
      this.shots = [];
      this.camera = 0;
      this.age = 0;
      this.clock = 300;
      this.score = 0;
      this.coins = 0;
      this.lives = 3;
      this.medals = 0;
      this.checkpoint = false;
      this.shake = 0;
      this.flash = 0;
      this.modeTime = 0;
      this.toastTime = 0;
      this.warpCooldown = 0;
      this.combo = 0;
      this.bossWon = false;
      this.clearBonus = 0;
      this.onScreen = () => {
      };
      this.onToast = () => {
      };
      this.sound.enabled = this.save.sound;
      this.input = new Input(() => void this.sound.unlock(), () => this.pause());
      this.player.x = 700;
      this.player.y = 448;
    }
    newPlayer() {
      return { x: 100, y: 400, w: 24, h: 32, vx: 0, vy: 0, facing: 1, grounded: false, coyote: 0, buffer: 0, power: 0, invincible: 0, star: 0, fireCooldown: 0, walk: 0, dead: 0, duck: false };
    }
    screen(mode) {
      this.mode = mode;
      this.modeTime = 0;
      this.input.clear();
      this.onScreen();
    }
    start(index = 0) {
      this.score = 0;
      this.coins = 0;
      this.lives = 3;
      this.medals = 0;
      this.checkpoint = false;
      this.checkpointSpawn = void 0;
      this.returnWorld = void 0;
      this.player = this.newPlayer();
      this.load(index);
      void this.sound.unlock();
    }
    load(index, retry = false) {
      this.world = createWorld(index);
      this.returnWorld = void 0;
      this.clock = 300;
      this.camera = 0;
      this.shots = [];
      this.particles = [];
      this.combo = 0;
      this.bossWon = false;
      const power = retry ? 0 : this.player.power;
      this.player = this.newPlayer();
      this.player.power = power;
      if (!retry) {
        this.medals = 0;
        this.checkpoint = false;
        this.checkpointSpawn = void 0;
      }
      const spawn = this.checkpointSpawn ?? this.world.spawn;
      this.player.x = spawn.x;
      this.player.y = spawn.y;
      this.camera = clamp(this.player.x - WIDTH * 0.35, 0, this.world.width - WIDTH);
      for (const item of this.world.pickups) if (item.kind === "medal" && this.medals & 1 << item.id) item.active = false;
      this.screen("intro");
    }
    next() {
      if (this.world.index === 3) {
        this.screen("win");
        return;
      }
      this.load(this.world.index + 1);
    }
    pause() {
      if (this.mode === "playing") this.screen("paused");
    }
    resume() {
      if (this.mode === "paused") {
        this.screen("playing");
        document.querySelector("#game")?.focus({ preventScroll: true });
        void this.sound.unlock();
      }
    }
    home() {
      this.returnWorld = void 0;
      this.world = createWorld(0);
      this.camera = 0;
      this.particles = [];
      this.shots = [];
      this.player = this.newPlayer();
      this.screen("title");
    }
    toast(text) {
      this.toastTime = 3;
      this.onToast(text);
    }
    addScore(value, x, y) {
      this.score += value;
      if (x !== void 0 && y !== void 0) this.particles.push({ x, y, vx: 0, vy: -35, life: 1, max: 1, size: 12, color: "#fff7c2", gravity: 0, text: `+${value}` });
    }
    burst(x, y, color, count = 10, power = 1) {
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2, s = (70 + Math.random() * 170) * power;
        this.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 70, life: 0.35 + Math.random() * 0.35, max: 0.7, size: 2 + Math.random() * 5, color, gravity: 600 });
      }
    }
    solidNear(rect, margin = 70) {
      return this.world.blocks.filter((b) => !b.broken && b.x + b.w > rect.x - margin && b.x < rect.x + rect.w + margin && b.y + b.h > rect.y - margin && b.y < rect.y + rect.h + margin);
    }
    coin(x, y) {
      this.coins++;
      this.addScore(100, x, y);
      this.sound.effect("coin");
      this.burst(x, y, "#ffdf66", 6, 0.5);
      if (this.coins % 100 === 0) {
        this.lives++;
        this.toast("100 \u679A\u91D1\u5E01 \xB7 \u989D\u5916\u751F\u547D +1");
        this.sound.effect("power");
      }
    }
    bump(b) {
      if (b.bump > 0) return;
      b.bump = 0.2;
      this.sound.effect("bump");
      for (const e of this.world.enemies) if (e.alive && e.x + e.w > b.x && e.x < b.x + b.w && Math.abs(e.y + e.h - b.y) < 12) this.defeat(e);
      if (b.kind === "question") {
        b.kind = "used";
        const kind = b.content ?? "coin";
        if (kind === "coin") {
          this.coin(b.x + 20, b.y - 15);
          return;
        }
        const itemKind = kind === "mushroom" && this.player.power > 0 ? "flower" : kind;
        this.world.pickups.push({ x: b.x + 5, y: b.y, w: 30, h: 30, baseY: b.y, kind: itemKind, vx: itemKind === "flower" ? 0 : 95, vy: 0, active: true, emerge: 0.45, id: -1 });
        this.sound.effect("power");
      } else if (b.kind === "brick" && this.player.power > 0) {
        b.broken = true;
        this.sound.effect("break");
        this.burst(b.x + 20, b.y + 20, this.world.theme === "meadow" ? "#b87b46" : "#849fa2", 12);
        this.addScore(50);
        this.shake = 0.12;
      }
    }
    hurt() {
      const p = this.player;
      if (p.invincible > 0 || p.star > 0 || this.mode !== "playing") return;
      if (p.power > 0) {
        p.power = 0;
        p.invincible = 2.2;
        p.y += p.h - 32;
        p.h = 32;
        this.shake = 0.25;
        this.flash = 0.14;
        this.sound.effect("hurt");
        this.burst(p.x + 12, p.y, "#fff4c8", 12);
      } else this.die();
    }
    die() {
      if (this.mode !== "playing") return;
      this.player.vy = -510;
      this.player.vx = 0;
      this.screen("dying");
      this.sound.effect("die");
      this.shake = 0.2;
      this.record();
    }
    defeat(e) {
      if (!e.alive) return;
      e.alive = false;
      this.addScore(e.kind === "boss" ? 5e3 : 200, e.x + e.w / 2, e.y);
      this.burst(e.x + e.w / 2, e.y + e.h / 2, e.kind === "goomba" ? "#dbac70" : "#afce79", 12);
      this.sound.effect("stomp");
      if (e.kind === "boss") {
        this.bossWon = true;
        this.shake = 0.65;
        this.sound.effect("win");
        this.toast("\u57CE\u5821\u5B88\u536B\u5DF2\u51FB\u8D25 \xB7 \u53BB\u8FCE\u63A5\u516C\u4E3B\u5427\uFF01");
      }
    }
    hitBoss(e, damage = 1) {
      if (e.hit > 0) return;
      e.hp -= damage;
      e.hit = 0.65;
      this.sound.effect("hurt");
      this.shake = 0.18;
      this.burst(e.x + 50, e.y + 40, "#ffb45f", 8);
      if (e.hp <= 0) this.defeat(e);
    }
    collect(p) {
      p.active = false;
      if (p.kind === "coin") {
        this.coin(p.x + 9, p.y);
        return;
      }
      if (p.kind === "medal") {
        this.medals |= 1 << p.id;
        this.addScore(1e3, p.x, p.y);
        this.sound.effect("medal");
        this.burst(p.x + 15, p.y + 15, "#ffe88a", 24);
        this.toast("\u661F\u7AE0\u5165\u624B\uFF01\u6BCF\u4E2A\u4E16\u754C\u85CF\u7740\u4E09\u679A\u661F\u7AE0\u3002");
        return;
      }
      if (p.kind === "star") {
        this.player.star = 11;
        this.toast("\u661F\u661F\u65E0\u654C\uFF01\u5411\u524D\u51B2\u5427\u3002");
      } else if (p.kind === "life") {
        this.lives++;
        this.toast("\u989D\u5916\u751F\u547D +1");
      } else {
        this.player.power = p.kind === "flower" ? 2 : Math.max(1, this.player.power);
        this.player.invincible = 1;
        this.toast(p.kind === "flower" ? "\u706B\u7130\u5F62\u6001 \xB7 X \u6216\u6309\u4F4F\u51B2\u523A\u952E\u53D1\u5C04\u706B\u7403" : "\u8D85\u7EA7\u5F62\u6001 \xB7 \u53EF\u4EE5\u9876\u788E\u7816\u5757\u4E86");
      }
      this.addScore(1e3, p.x, p.y);
      this.sound.effect("power");
      this.burst(p.x + 15, p.y + 15, "#ffedaf", 18);
    }
    record() {
      this.save.best = Math.max(this.save.best, this.score);
      writeSave(this.save);
    }
    clear() {
      if (this.mode !== "playing") return;
      this.clearBonus = Math.floor(this.clock) * 10;
      this.addScore(this.clearBonus);
      const index = this.world.index;
      this.save.medals[index] |= this.medals;
      this.save.unlocked = Math.max(this.save.unlocked, Math.min(3, index + 1));
      this.save.clears[index]++;
      this.record();
      this.screen("clear");
      this.sound.effect("flag");
      for (let i = 0; i < 5; i++) this.burst(this.player.x + Math.random() * 300 - 80, 80 + Math.random() * 160, ["#fff1a3", "#ec7859", "#b9d97f"][i % 3], 22);
    }
    warp() {
      const p = this.player, w = this.world;
      if (this.warpCooldown > 0 || !p.grounded || !this.input.down("down")) return;
      const target = w.exit ?? w.warp;
      if (!target || Math.abs(p.x + p.w / 2 - target.x - 40) > 30 || Math.abs(p.y + p.h - target.y) > 8) return;
      if (w.exit && this.returnWorld) {
        const ret = this.returnWorld;
        this.world = ret.world;
        p.x = ret.x;
        p.y = ret.y;
        this.returnWorld = void 0;
        this.toast("\u56DE\u5230\u5730\u9762 \xB7 \u5192\u9669\u7EE7\u7EED");
      } else if (w.warp) {
        this.returnWorld = { world: w, x: target.x + TILE * 2 + 12, y: 400 };
        this.world = createWorld(w.index, true);
        p.x = 100;
        p.y = 400;
        this.toast("\u53D1\u73B0\u91D1\u5E01\u5BC6\u5BA4\uFF01\u53F3\u4FA7\u6C34\u7BA1\u53EF\u4EE5\u8FD4\u56DE\u3002");
      }
      p.vx = 0;
      p.vy = 0;
      this.camera = clamp(p.x - 300, 0, this.world.width - WIDTH);
      this.shots = [];
      this.warpCooldown = 1;
      this.sound.effect("power");
      this.flash = 0.18;
    }
    step(dt) {
      this.age += dt;
      this.modeTime += dt;
      this.shake = Math.max(0, this.shake - dt);
      this.flash = Math.max(0, this.flash - dt);
      this.toastTime = Math.max(0, this.toastTime - dt);
      this.sound.update(this.mode === "playing", this.world.theme, this.player.star > 0);
      if (this.input.pressed("pause")) {
        if (this.mode === "playing") this.pause();
        else if (this.mode === "paused") this.resume();
      }
      if (this.mode === "intro" && this.modeTime > 1.5) {
        this.screen("playing");
        if (this.world.index === 0 && !this.checkpoint) this.toast("\u65B9\u5411\u952E\u79FB\u52A8 \xB7 \u7A7A\u683C\u8DF3\u8DC3 \xB7 \u6309\u4F4F Shift \u8DD1\u5F97\u66F4\u5FEB");
      }
      if (this.mode === "dying") {
        this.player.vy += 1200 * dt;
        this.player.y += this.player.vy * dt;
        if (this.modeTime > 1.8) {
          this.lives--;
          if (this.lives > 0) this.load(this.returnWorld?.world.index ?? this.world.index, true);
          else this.screen("gameover");
        }
      }
      if (this.mode === "playing") this.update(dt);
      if (this.mode === "clear") {
        this.player.facing = 1;
        this.player.walk += dt * 100;
        if (this.player.x < this.world.goal + 110) this.player.x += 70 * dt;
      }
      if (this.mode !== "paused") for (const p of this.particles) {
        p.life -= dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += p.gravity * dt;
      }
      this.particles = this.particles.filter((p) => p.life > 0).slice(-300);
      this.input.end();
    }
    update(dt) {
      const p = this.player, w = this.world;
      this.warpCooldown = Math.max(0, this.warpCooldown - dt);
      this.clock -= dt;
      if (this.clock <= 0) {
        this.clock = 0;
        this.die();
        return;
      }
      for (const b of w.blocks) b.bump = Math.max(0, b.bump - dt);
      for (const platform of w.platforms) {
        const x = platform.x, y = platform.y;
        platform.phase += dt * platform.speed;
        if (platform.axis === "x") platform.x = platform.homeX + Math.sin(platform.phase) * platform.range;
        else platform.y = platform.homeY - Math.sin(platform.phase) * platform.range;
        platform.dx = platform.x - x;
        platform.dy = platform.y - y;
      }
      p.invincible = Math.max(0, p.invincible - dt);
      p.star = Math.max(0, p.star - dt);
      p.fireCooldown = Math.max(0, p.fireCooldown - dt);
      const wasGrounded = p.grounded;
      p.coyote = wasGrounded ? 0.11 : Math.max(0, p.coyote - dt);
      p.buffer = this.input.pressed("jump") ? 0.13 : Math.max(0, p.buffer - dt);
      p.duck = p.power > 0 && this.input.down("down") && p.grounded;
      const height = p.power > 0 && !p.duck ? 48 : 32;
      if (height !== p.h) {
        const r = { x: p.x, y: p.y + p.h - height, w: p.w, h: height };
        if (height < p.h || !this.solidNear(r).some((b) => overlap(r, b))) {
          p.y = r.y;
          p.h = height;
        } else p.duck = true;
      }
      const direction = Number(this.input.down("right")) - Number(this.input.down("left")), run = this.input.down("run"), max = run ? 310 : 195;
      if (direction && !p.duck) {
        p.vx = approach(p.vx, direction * max, (wasGrounded ? 1150 : 740) * dt);
        p.facing = direction;
      } else p.vx = approach(p.vx, 0, (wasGrounded ? 1250 : 170) * dt);
      if (p.buffer > 0 && p.coyote > 0 && !p.duck) {
        p.vy = run ? -725 : -670;
        p.grounded = false;
        p.coyote = 0;
        p.buffer = 0;
        this.sound.effect("jump");
        this.burst(p.x + 12, p.y + p.h, "#f2e5bc", 5, 0.25);
      }
      if (this.input.released("jump") && p.vy < -250) p.vy = -250;
      if (p.power === 2 && (this.input.pressed("fire") || run) && p.fireCooldown === 0 && this.shots.filter((s) => !s.hostile).length < 3) {
        this.shots.push({ x: p.x + (p.facing > 0 ? p.w : -10), y: p.y + p.h * 0.45, w: 12, h: 12, vx: p.facing * 440, vy: 150, life: 2.5, hostile: false });
        p.fireCooldown = 0.3;
        this.sound.effect("fire");
      }
      p.vy = Math.min(880, p.vy + 1850 * dt);
      p.walk += Math.abs(p.vx) * dt;
      p.x += p.vx * dt;
      for (const b of this.solidNear(p)) if (overlap(p, b)) {
        if (p.vx > 0) p.x = b.x - p.w;
        else if (p.vx < 0) p.x = b.x + b.w;
        p.vx = 0;
      }
      p.x = clamp(p.x, 0, w.width - p.w);
      const previousBottom = p.y + p.h;
      p.y += p.vy * dt;
      p.grounded = false;
      for (const b of this.solidNear(p)) if (overlap(p, b)) {
        if (p.vy > 0) {
          p.y = b.y - p.h;
          p.grounded = true;
          p.vy = 0;
        } else if (p.vy < 0) {
          p.y = b.y + b.h;
          p.vy = 25;
          this.bump(b);
        }
      }
      for (const platform of w.platforms) if (p.vy >= 0 && p.x + p.w > platform.x && p.x < platform.x + platform.w && previousBottom <= platform.y + Math.abs(platform.dy) + 3 && p.y + p.h >= platform.y) {
        p.y = platform.y - p.h;
        p.vy = 0;
        p.grounded = true;
        p.x += platform.dx;
      }
      if (p.grounded) {
        this.combo = 0;
        if (!wasGrounded && p.vy >= 0) this.burst(p.x + 12, p.y + p.h, "#e5ddb1", 4, 0.2);
      }
      if (p.y > 660) {
        this.die();
        return;
      }
      if (!this.checkpoint && w.checkpoint && p.x > w.checkpoint) {
        this.checkpoint = true;
        this.checkpointSpawn = { x: w.checkpoint + 30, y: w.checkpointY };
        this.addScore(500);
        this.sound.effect("checkpoint");
        this.toast("\u68C0\u67E5\u70B9\u5DF2\u70B9\u4EAE \xB7 \u5931\u8D25\u540E\u4ECE\u8FD9\u91CC\u7EE7\u7EED");
        this.burst(w.checkpoint, 400, "#d0e690", 20);
      }
      this.warp();
      if (this.world !== w) return;
      for (const item of w.pickups) {
        if (!item.active) continue;
        if (item.emerge > 0) {
          item.y -= 70 * dt;
          item.emerge = Math.max(0, item.emerge - dt);
          continue;
        }
        if (item.kind !== "coin" && item.kind !== "medal" && item.kind !== "flower") {
          item.vy = Math.min(700, item.vy + 1200 * dt);
          item.x += item.vx * dt;
          for (const b of this.solidNear(item)) if (overlap(item, b)) {
            item.x = item.vx > 0 ? b.x - item.w : b.x + b.w;
            item.vx *= -1;
          }
          item.y += item.vy * dt;
          for (const b of this.solidNear(item)) if (overlap(item, b) && item.vy > 0) {
            item.y = b.y - item.h;
            item.vy = item.kind === "star" ? -420 : 0;
          }
          if (item.y > 650) item.active = false;
        }
        if (overlap(p, item)) this.collect(item);
      }
      for (const e of w.enemies) {
        if (!e.alive || Math.abs(e.x - p.x) > 1e3) continue;
        this.updateEnemy(e, dt);
        if (!e.alive) continue;
        const hitbox = e.kind === "plant" ? { ...e, y: e.y + 5, h: e.h - 10 } : e;
        if (!overlap(p, hitbox) || this.mode !== "playing") continue;
        if (p.star > 0) {
          if (e.kind === "boss") this.hitBoss(e, 2);
          else this.defeat(e);
          continue;
        }
        if (e.kind === "plant") {
          this.hurt();
          continue;
        }
        if (e.kind === "boss") {
          if (p.vy > 60 && previousBottom < e.y + 24) {
            p.y = e.y - p.h;
            p.vy = this.input.down("jump") ? -560 : -420;
            this.hitBoss(e);
          } else this.hurt();
          continue;
        }
        if (p.vy > 50 && previousBottom <= e.y + 16) {
          p.y = e.y - p.h;
          p.vy = this.input.down("jump") ? -560 : -380;
          this.combo++;
          this.sound.effect("stomp");
          if (e.kind === "turtle") {
            e.kind = "shell";
            e.y += e.h - 22;
            e.h = 22;
            e.vx = 0;
            e.hit = 0.25;
            this.addScore(100, e.x, e.y);
          } else if (e.kind === "shell") {
            e.vx = e.vx === 0 ? p.x < e.x ? 400 : -400 : 0;
            e.hit = 0.25;
          } else this.defeat(e);
        } else if (e.kind === "shell" && e.vx === 0) {
          e.vx = p.x < e.x ? 400 : -400;
          e.hit = 0.3;
          this.sound.effect("stomp");
        } else if (e.hit <= 0) this.hurt();
      }
      this.updateShots(dt);
      const desired = clamp(p.x - WIDTH * 0.37 + p.vx * 0.25, 0, w.width - WIDTH);
      this.camera += (desired - this.camera) * (1 - Math.exp(-6 * dt));
      if (w.theme === "castle" && !this.bossWon && p.x > w.goal - 100) p.x = w.goal - 100;
      if (p.x >= w.goal && (w.theme !== "castle" || this.bossWon)) this.clear();
      if (run && p.grounded && Math.abs(p.vx) > 230 && Math.random() < 0.22) this.burst(p.x + 12, p.y + p.h, "#e3d9a0", 1, 0.2);
    }
    updateEnemy(e, dt) {
      const p = this.player;
      e.phase += dt;
      e.hit = Math.max(0, e.hit - dt);
      if (e.kind === "plant") {
        const cycle = e.phase % 5, near = Math.abs(p.x - e.homeX) < 75;
        e.y = e.homeY + 44 - (near && cycle > 3 ? 0 : Math.max(0, Math.sin(cycle / 5 * Math.PI * 2)) * 65);
        if (e.y > e.homeY + 22) return;
        return;
      }
      if (e.kind === "boss") {
        e.vx = Math.sin(e.phase * 0.9) * 70;
        if (e.grounded && e.phase % 3 < dt) {
          e.vy = -570;
          this.shake = 0.2;
        }
        if (e.phase % 1.5 < dt) {
          this.shots.push({ x: e.x - 12, y: e.y + 35, w: 22, h: 18, vx: -240, vy: (p.y - e.y) * 0.25, life: 4.5, hostile: true });
          this.sound.effect("fire");
        }
      }
      e.vy = Math.min(800, e.vy + 1500 * dt);
      e.x += e.vx * dt;
      for (const b of this.solidNear(e)) if (overlap(e, b)) {
        e.x = e.vx > 0 ? b.x - e.w : b.x + b.w;
        e.vx *= -1;
        break;
      }
      if (e.kind === "turtle" && e.grounded) {
        const front = { x: e.vx > 0 ? e.x + e.w + 3 : e.x - 5, y: e.y + e.h + 3, w: 3, h: 8 };
        if (!this.solidNear(front).some((b) => overlap(front, b))) e.vx *= -1;
      }
      e.y += e.vy * dt;
      e.grounded = false;
      for (const b of this.solidNear(e)) if (overlap(e, b) && e.vy >= 0) {
        e.y = b.y - e.h;
        e.vy = 0;
        e.grounded = true;
      }
      if (e.y > 650) {
        e.alive = false;
        return;
      }
      if (e.kind === "boss") e.x = clamp(e.x, 108 * TILE, 120 * TILE);
      if (e.kind === "shell" && Math.abs(e.vx) > 100) {
        for (const other of this.world.enemies) if (other !== e && other.alive && overlap(e, other)) {
          if (other.kind === "boss") {
            this.hitBoss(other, 2);
            e.alive = false;
          } else this.defeat(other);
        }
      }
    }
    updateShots(dt) {
      for (const s of this.shots) {
        s.life -= dt;
        s.x += s.vx * dt;
        if (!s.hostile) s.vy += 1e3 * dt;
        if (this.solidNear(s).some((b) => overlap(s, b))) {
          s.life = 0;
          this.burst(s.x, s.y, "#ffbe60", 5, 0.4);
          continue;
        }
        s.y += s.vy * dt;
        for (const b of this.solidNear(s)) if (overlap(s, b)) {
          if (!s.hostile && s.vy > 0) {
            s.y = b.y - s.h;
            s.vy = -320;
          } else s.life = 0;
        }
        if (s.hostile) {
          if (overlap(s, this.player)) {
            this.hurt();
            s.life = 0;
          }
        } else for (const e of this.world.enemies) if (e.alive && overlap(s, e)) {
          if (e.kind === "boss") this.hitBoss(e);
          else this.defeat(e);
          s.life = 0;
          break;
        }
        if (Math.random() < 0.6) this.particles.push({ x: s.x + s.w / 2, y: s.y + s.h / 2, vx: 0, vy: 0, life: 0.2, max: 0.2, color: "#ffad4b", size: 4, gravity: 0 });
      }
      this.shots = this.shots.filter((s) => s.life > 0 && s.y < 600);
    }
  };

  // games-src/super-mario/src/sprites.ts
  var palette = {
    R: "#e74732",
    r: "#a92729",
    H: "#ff7250",
    S: "#ffd394",
    s: "#eaa565",
    B: "#254ea1",
    b: "#163569",
    K: "#3b2b31",
    W: "#fff4d2",
    Y: "#ffcf4b",
    y: "#d89127",
    G: "#6ca849",
    g: "#326841",
    L: "#b8d46b",
    T: "#af703f",
    t: "#724528",
    O: "#ef9a51",
    C: "#9bc9b1",
    c: "#568e84",
    P: "#eb8ca1",
    p: "#a73c64",
    D: "#3c5369",
    d: "#273447",
    V: "#9373b2",
    v: "#56466f",
    F: "#ffdf88",
    A: "#f7edd7",
    a: "#c7c6b3"
  };
  var sprites = {
    mario: [
      ".....RRRRR......",
      "....RRRRRRRRR...",
      "....KKKSSKS.....",
      "...KSKSSSKSSS...",
      "...KSKKSSSKSSS..",
      "...KKSSSSKKKK...",
      ".....SSSSSSS....",
      "....RRBRRR......",
      "...RRRBRBRRR....",
      "..RRRRBBBBRRRR..",
      "..SSRBYYBYYRSS..",
      "..SSSBBBBBBSSS..",
      "..SSBBBBBBBBSS..",
      "....BBBBBBBB....",
      "...KKK....KKK...",
      "..KKKK....KKKK.."
    ],
    tall: [
      ".....RRRRR......",
      "....RHRRRRRRR...",
      "....KKKSSKS.....",
      "...KSKSSSKSSS...",
      "...KSKKSSSKSSS..",
      "...KKSSSSKKKK...",
      ".....SSSSSSS....",
      "....RRRRRRR.....",
      "...RRRBRBRRR....",
      "..RRRRBRBRRRR...",
      "..RRRRBRBRRRR...",
      "..RRRRBBBBRRRR..",
      "..SSRBYYBYBRSS..",
      "..SSSBBBBBBSSS..",
      "..SSSBBBBBBSSS..",
      "....BBBBBBBB....",
      "....BBBBBBBB....",
      "....BBB..BBB....",
      "....BBB..BBB....",
      "....BBB..BBB....",
      "....KKK..KKK....",
      "...KKKK..KKKK...",
      "...KKKK..KKKK...",
      "................"
    ],
    goomba: [
      "......TTTT......",
      ".....TOOTT T....".replace(" ", ""),
      "....TOOOOOT T...".replace(" ", ""),
      "...TOOOOOOOOT...",
      "..TOOOOOOOOOOT..",
      ".TTWWKOOOO KWWTT.".replace(" ", ""),
      ".TTWWKOOOO KWWTT.".replace(" ", ""),
      ".TTKKKOOOO KKKTT.".replace(" ", ""),
      ".TTTTTTTTTTTTTT.",
      "..TTT TTTTTTTT..".replace(" ", ""),
      "....SSSSSSSS....",
      "...SSSSSSSSSS...",
      "..KKKSSSSSSKKK..",
      ".KKKKKSSSSKKKKK.",
      ".KKKKK....KKKKK.",
      "..KKK......KKK.."
    ],
    turtle: [
      "......YYYY......",
      ".....YWWKYY.....",
      ".....YWWKYY.....",
      ".....YYYYYYY....",
      ".....YYYYYYYY...",
      "......YYYYYY....",
      ".....GGGGG......",
      "....GLLLLGG.....",
      "...GLLLGLLGG....",
      "..GLLGGGGLLGG...",
      "..GLLGLLGLLGG...",
      "..GGGGGGGGGGG...",
      "..GLLGLLGLLGG...",
      "..GLLGGGGLLGG...",
      "...GLLLGLLGG....",
      "...AGGGGGGGA....",
      "...AAAAAAAAA....",
      "....YYYYYYY.....",
      "...YYY..YYY.....",
      "..YYYY..YYYY...."
    ],
    shell: ["....GGGGGGGG....", "...GLLLLGLLGG...", "..GLLLLLGLLLGG..", ".GLLGGGGGGGLLGG.", ".GLLGLLLGLLGLLG.", ".GGGGLLLGLLGGGG.", ".GLLGGGGGGGLLGG.", "..AGGGGGGGGGGA..", "..AAAAAAAAAAAA..", "...YYYYYYYYYY..."],
    mushroom: [".....RRRRRR.....", "...RRRWWRRRRR...", "..RRRWWWWRRRRR..", ".RWWRRWWRRRWWRR.", ".WWWWRRRRRWWWWR.", "RWWWWRRRRRWWWWRR", "RRWWRRRWWRRWWRRR", "RRRRRRWWWWRRRRRR", "RRRRRRWWWWRRRRRR", ".RRRRRRWWRRRRRR.", "..KKSSSSSSSSKK..", "...SSKSSSSKSS...", "...SSKSSSSKSS...", "...SSSSSSSSSS...", "....SSSSSSSS....", ".....SSSSSS....."],
    flower: [".....RRRRRR.....", "...RRHHHHHHRR...", "..RHHWWWWWWHHR..", ".RHWYYYYYY YWHR.".replace(" ", ""), ".RHWYYKYYKYYWHR.", ".RHWYYKYYKYYWHR.", "..RHWYYYYYWHR...", "...RRWWWWRRR....", ".....RRRRRR.....", ".......GG.......", "..GG...GG...GG..", ".GLLG..GG..GLLG.", ".GLLLG.GG.GLLLG.", "..GLLLGGGGLLLG..", "...GGGGGGGGGG...", "......GGGG......"],
    star: [".......YY.......", "......YWWY......", "......YWWY......", ".....YWWWWY.....", ".YYYYYWWWWYYYYY.", "YWWWWWWWWWWWWWWY", ".YWWWWWWWWWWWWY.", "..YWWWKWWKWWWY..", "...YWWKWWKWWY...", "...YWWWWWWWWY...", "..YWWWWWWWWWWY..", "..YWWWWWWWWWWY..", ".YWWWWYYYYWWWWY.", ".YWWWY....YWWWY.", ".YWWY......YWWY.", "..YY........YY.."],
    plant: [".....RRRRRR.....", "...RRWWRRWWRR...", "..RWWWWRRWWWWR..", "..RWWRRRRRRWWR..", "..RRRWWRRWWRRR..", "..RRWWWWWWWWRR..", "...RWWWWWWWWR...", "....RRRRRRRR....", ".......GG.......", ".......GG.......", "...GG..GG..GG...", "..GLLG.GG.GLLG..", "...GLLGGGGLLG...", "....GGGGGGGG....", ".......GG.......", ".......GG......."],
    princess: ["......Y.Y.Y.....", "......YYYYY.....", ".....OOOOOO.....", "....OOSSSSOO....", "....OSKSSKSO....", "....OSSSSSSO....", ".....OSSSSO.....", "....PPPPPPPP....", "...PSPPPPPSPP...", "...SSPPPPPSSP...", ".....PPPPPP.....", "....PpPPPPpP....", "...PPpPPPPpPP...", "..PPPPpPPpPPPP..", ".PPPPPPppPPPPPP.", "...SS......SS..."]
  };

  // games-src/super-mario/src/art.ts
  var atlas = /* @__PURE__ */ new Map();
  var fill = (c, color, x, y, w, h) => {
    c.fillStyle = color;
    c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  };
  function sprite(c, name, x, y, scale = 2, flip = false, variant = "") {
    const key2 = name + variant;
    if (!atlas.has(key2)) {
      const pixels = sprites[name];
      if (!pixels) return;
      const cv2 = document.createElement("canvas");
      cv2.width = Math.max(...pixels.map((r) => r.length));
      cv2.height = pixels.length;
      const ctx = cv2.getContext("2d");
      for (let y2 = 0; y2 < pixels.length; y2++) for (let x2 = 0; x2 < pixels[y2].length; x2++) {
        const k = pixels[y2][x2];
        if (k === ".") continue;
        let color = palette[k];
        if (!color) continue;
        if (variant === "fire") {
          if (k === "R") color = "#fff1cf";
          if (k === "H") color = "#fff9e8";
          if (k === "r") color = "#ddc69c";
          if (k === "B") color = "#e85031";
          if (k === "b") color = "#9f3034";
        }
        if (variant === "life" && k === "R") color = "#63a95a";
        ctx.fillStyle = color;
        ctx.fillRect(x2, y2, 1, 1);
      }
      atlas.set(key2, cv2);
    }
    const cv = atlas.get(key2);
    c.save();
    c.translate(Math.round(x + (flip ? cv.width * scale : 0)), Math.round(y));
    c.scale(flip ? -scale : scale, scale);
    c.imageSmoothingEnabled = false;
    c.drawImage(cv, 0, 0);
    c.restore();
  }
  function label(c, text, x, y, size = 14, color = "#fff4d1", align = "center") {
    c.font = `700 ${size}px "Segoe UI", "Microsoft YaHei", sans-serif`;
    c.textAlign = align;
    c.fillStyle = "#19393188";
    c.fillText(text, Math.round(x) + 1, Math.round(y) + 2);
    c.fillStyle = color;
    c.fillText(text, Math.round(x), Math.round(y));
  }
  function poly(c, color, points) {
    c.fillStyle = color;
    c.beginPath();
    points.forEach(([x, y], i) => i ? c.lineTo(Math.round(x), Math.round(y)) : c.moveTo(Math.round(x), Math.round(y)));
    c.closePath();
    c.fill();
  }
  var noise = (n) => {
    const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return v - Math.floor(v);
  };
  function cloud(c, x, y, s = 1, opacity = 1) {
    c.save();
    c.globalAlpha = opacity;
    c.translate(Math.round(x), Math.round(y));
    c.scale(s, s);
    fill(c, "#b7d9cc", 6, 22, 94, 13);
    fill(c, "#f9f7df", 0, 14, 98, 15);
    fill(c, "#f9f7df", 14, 5, 66, 15);
    fill(c, "#f9f7df", 27, 0, 31, 10);
    fill(c, "#ffffff99", 29, 2, 27, 3);
    fill(c, "#fdfbe8", -6, 21, 12, 7);
    c.restore();
  }
  function background(c, theme, camera, time) {
    const dark = theme === "cave" || theme === "bonus" || theme === "castle";
    const gradient = c.createLinearGradient(0, 0, 0, 540);
    if (theme === "castle") {
      gradient.addColorStop(0, "#202634");
      gradient.addColorStop(0.8, "#504152");
      gradient.addColorStop(1, "#b45e43");
    } else if (dark) {
      gradient.addColorStop(0, "#182e40");
      gradient.addColorStop(1, "#355d65");
    } else {
      gradient.addColorStop(0, theme === "sky" ? "#83bccc" : "#8dcbce");
      gradient.addColorStop(0.7, "#d0e5c5");
      gradient.addColorStop(1, "#eaf0ca");
    }
    c.fillStyle = gradient;
    c.fillRect(0, 0, WIDTH, HEIGHT);
    if (!dark) {
      c.save();
      const sunX = 790 - camera * 0.035;
      const glow = c.createRadialGradient(sunX, 103, 10, sunX, 103, 110);
      glow.addColorStop(0, "#ffefc588");
      glow.addColorStop(1, "#ffefc500");
      c.fillStyle = glow;
      c.fillRect(sunX - 110, 0, 220, 220);
      fill(c, "#fff0c3", sunX - 24, 74, 48, 48);
      fill(c, "#fff0c3", sunX - 30, 80, 60, 36);
      c.restore();
      for (let i = -1; i < 8; i++) {
        const spacing = 230;
        let x = i * spacing - camera * 0.13 + time * 2;
        x = ((x + 350) % 1800 + 1800) % 1800 - 350;
        cloud(c, x, 70 + noise(i + 10) * 130, 0.55 + noise(i + 90) * 1.05, 0.85);
      }
      for (let layer = 0; layer < 3; layer++) {
        const colors = theme === "sky" ? ["#b3d6d0", "#9fcbb8", "#80b8a0"] : ["#bad7b3", "#98c69a", "#70ae7b"];
        const base = 340 + layer * 47, amp = theme === "sky" ? 35 : 70, points = [[0, 540]];
        for (let x = 0; x <= 976; x += 8) {
          const wx = x + camera * (0.09 + layer * 0.08);
          points.push([x, base - Math.sin(wx / (130 - layer * 20)) * amp - Math.cos(wx / 73) * amp * 0.25]);
        }
        points.push([WIDTH, 540]);
        poly(c, colors[layer], points);
      }
      if (theme === "sky") for (let i = -1; i < 7; i++) cloud(c, i * 240 - camera * 0.2 % 240, 385 + noise(i) * 45, 2, 0.55);
      else for (let i = -1; i < 10; i++) {
        const x = i * 160 - camera * 0.4 % 160, y = 393 + noise(i + 8) * 36;
        fill(c, "#629369", x + 28, y, 9, 70);
        fill(c, "#83b77a", x, y - 12, 70, 32);
        fill(c, "#83b77a", x + 10, y - 30, 50, 22);
        fill(c, "#95c48a", x + 15, y - 28, 40, 6);
      }
    } else if (theme === "castle") {
      const offset = camera * 0.35 % 220;
      for (let i = -1; i < 6; i++) {
        const x = i * 220 - offset;
        fill(c, "#2b2c3c", x, 78, 72, 390);
        fill(c, "#423e4b", x - 7, 74, 86, 15);
        fill(c, "#4c4350", x + 6, 98, 7, 350);
        fill(c, "#141f30", x + 100, 134, 54, 140);
        fill(c, "#141f30", x + 110, 120, 34, 14);
        fill(c, "#b56e4d", x + 103, 180, 48, 88);
        fill(c, "#df9a5b", x + 112, 217, 30, 51);
        fill(c, "#302e3f", x + 122, 130, 7, 150);
        fill(c, "#302e3f", x + 96, 205, 65, 7);
        for (let j = 0; j < 4; j++) fill(c, "#171f3066", x + 18, 138 + j * 69, 44, 3);
      }
      for (let i = 0; i < 32; i++) {
        const x = (i * 67 - camera * 0.12) % 1e3, y = 530 - (time * (12 + noise(i) * 18) + i * 39) % 540;
        fill(c, "#f5ac6580", x, y, 2, 3);
      }
    } else {
      for (let i = -1; i < 18; i++) {
        const x = i * 84 - camera * 0.22 % 84, h = 45 + noise(i + 44) * 90;
        poly(c, "#203b4c", [[x, 0], [x + 70, 0], [x + 50, h], [x + 35, h + 28], [x + 23, h - 10]]);
        poly(c, "#274956", [[x + 5, 540], [x + 25, 350 + noise(i + 11) * 90], [x + 46, 430], [x + 75, 540]]);
      }
      for (let i = 0; i < 32; i++) {
        const x = ((i * 137 - camera * 0.3) % 1020 + 1020) % 1020, y = 70 + noise(i + 92) * 330, a = 0.25 + 0.25 * Math.sin(time * 2 + i);
        c.globalAlpha = a;
        fill(c, "#a3e9d8", x, y, 3, 3);
        c.globalAlpha = 1;
      }
    }
  }
  var tileCache = /* @__PURE__ */ new Map();
  function tile(kind, theme, top, seed) {
    const key2 = `${kind}-${theme}-${top}-${seed % 4}`;
    if (tileCache.has(key2)) return tileCache.get(key2);
    const cv = document.createElement("canvas");
    cv.width = 40;
    cv.height = 40;
    const c = cv.getContext("2d"), dark = theme === "cave" || theme === "bonus", castle2 = theme === "castle";
    if (kind === "ground") {
      fill(c, castle2 ? "#443d49" : dark ? "#365761" : "#b08451", 0, 0, 40, 40);
      fill(c, castle2 ? "#655362" : dark ? "#49737a" : "#c29860", 0, 2, 40, 5);
      for (let i = 0; i < 7; i++) {
        const x = noise(seed * 10 + i) * 36, y = 8 + noise(i * 3 + seed) * 28;
        fill(c, castle2 ? "#302e3c" : dark ? "#264751" : "#906640", x, y, 4, 3);
        if (i % 2 === 0) fill(c, castle2 ? "#7a6170" : dark ? "#6b9894" : "#d9ae75", x + 1, y - 2, 3, 2);
      }
      if (top) {
        fill(c, castle2 ? "#9991a0" : dark ? "#71b6ac" : "#639a4b", 0, 0, 40, 10);
        fill(c, castle2 ? "#b1a6ae" : dark ? "#9dddd0" : "#c5d884", 0, 0, 40, 3);
        fill(c, castle2 ? "#726776" : dark ? "#447e7c" : "#44773b", 0, 10, 40, 4);
        if (!castle2 && !dark) for (let i = 0; i < 5; i++) fill(c, "#639a4b", i * 9, 10, 5, 5 + noise(i + seed) * 4);
      }
    } else if (kind === "brick") {
      const colors = castle2 ? ["#8a6970", "#493b4c", "#b1928b"] : dark ? ["#609397", "#284c5b", "#a2c6b8"] : ["#c78349", "#825338", "#e5b373"];
      fill(c, colors[1], 0, 0, 40, 40);
      for (let row = 0; row < 2; row++) {
        const offset = row ? 0 : -10;
        for (let col = 0; col < 3; col++) {
          fill(c, colors[0], offset + col * 22 + 1, row * 20 + 1, 20, 18);
          fill(c, colors[2], offset + col * 22 + 2, row * 20 + 2, 18, 3);
          fill(c, colors[1], offset + col * 22 + 18, row * 20 + 6, 2, 12);
        }
      }
    } else if (kind === "stone") {
      fill(c, castle2 ? "#5a5160" : dark ? "#466872" : "#ad9268", 0, 0, 40, 40);
      fill(c, castle2 ? "#a4989a" : dark ? "#94b5ae" : "#e1cd98", 1, 1, 38, 5);
      fill(c, castle2 ? "#8a7c86" : dark ? "#77a59f" : "#c4ad7b", 1, 5, 5, 30);
      fill(c, "#20363b55", 35, 5, 5, 35);
      fill(c, "#20363b55", 5, 35, 30, 5);
      fill(c, "#ffffff13", 9, 9, 22, 20);
    } else if (kind === "used") {
      fill(c, dark ? "#56737a" : "#97764e", 0, 0, 40, 40);
      fill(c, dark ? "#739392" : "#b39463", 3, 3, 34, 34);
      fill(c, "#0003", 6, 6, 3, 3);
      fill(c, "#0003", 31, 6, 3, 3);
      fill(c, "#0003", 6, 31, 3, 3);
      fill(c, "#0003", 31, 31, 3, 3);
    }
    tileCache.set(key2, cv);
    return cv;
  }
  function drawBlock(c, b, theme, time, top) {
    if (b.broken) return;
    const x = Math.round(b.x), y = Math.round(b.y - Math.sin(b.bump / 0.2 * Math.PI) * 9);
    if (b.kind === "question") {
      fill(c, "#9d672d", x, y + 3, 40, 37);
      fill(c, "#f0b74e", x + 2, y, 36, 37);
      fill(c, "#ffe693", x + 3, y + 1, 34, 4);
      fill(c, "#cc8b33", x + 35, y + 6, 3, 28);
      const glow = Math.sin(time * 4 + b.x) * 0.1 + 0.9;
      c.globalAlpha = glow;
      fill(c, "#fff2b9", x + 12, y + 8, 15, 4);
      fill(c, "#fff2b9", x + 10, y + 11, 5, 6);
      fill(c, "#fff2b9", x + 23, y + 11, 5, 9);
      fill(c, "#fff2b9", x + 18, y + 19, 9, 4);
      fill(c, "#fff2b9", x + 17, y + 21, 5, 5);
      fill(c, "#fff2b9", x + 17, y + 29, 5, 5);
      c.globalAlpha = 1;
      for (const [dx, dy] of [[4, 5], [32, 5], [4, 30], [32, 30]]) fill(c, "#9d682f", x + dx, y + dy, 3, 3);
    } else if (b.kind === "pipe") {
      const body = c.createLinearGradient(x, 0, x + b.w, 0);
      body.addColorStop(0, "#2f6447");
      body.addColorStop(0.12, "#78ab5d");
      body.addColorStop(0.28, "#b0cf78");
      body.addColorStop(0.39, "#78ad5e");
      body.addColorStop(0.75, "#53864d");
      body.addColorStop(1, "#274e3b");
      c.fillStyle = body;
      c.fillRect(x + 5, y, b.w - 10, b.h);
      fill(c, "#d9e9a8", x + 17, y, 4, b.h);
      fill(c, "#315b40", x + 62, y, 4, b.h);
      if (b.pipeTop) {
        fill(c, "#244f39", x - 3, y - 3, b.w + 6, 24);
        c.fillStyle = body;
        c.fillRect(x - 1, y, b.w + 2, 18);
        fill(c, "#d1e89a", x + 1, y + 1, b.w - 2, 4);
        fill(c, "#416b40", x + 1, y + 16, b.w - 2, 4);
      }
    } else c.drawImage(tile(b.kind, theme, top, Math.floor(b.x / 40)), x, y);
  }
  function coinArt(c, x, y, time, big = false) {
    const w = Math.max(3, Math.abs(Math.cos(time * 4)) * 14), h = big ? 28 : 22;
    fill(c, "#b4802f", x + 10 - w / 2, y + 3, w, h);
    fill(c, "#ffd061", x + 9 - w / 2, y, w, h);
    fill(c, "#fff0a1", x + 9 - w / 2, y + 2, Math.max(2, w * 0.22), h - 4);
    if (w > 8) fill(c, "#ce983a", x + 9, y + 5, 2, h - 10);
  }
  function playerArt(c, p, time) {
    if (p.invincible > 0 && Math.floor(time * 14) % 2) return;
    c.save();
    if (p.star > 0) c.filter = `hue-rotate(${Math.floor(time * 500) % 360}deg) brightness(1.15)`;
    const big = p.power > 0 && !p.duck, name = big ? "tall" : "mario", h = big ? 46 : 32, walking = p.grounded && Math.abs(p.vx) > 15;
    let x = p.x - 4, y = p.y + p.h - h;
    if (walking) y -= Math.floor(p.walk / 10) % 2 * 2;
    if (!p.grounded) {
      c.translate(Math.round(x + 16), Math.round(y + h));
      c.rotate(p.vx * 1e-4);
      c.translate(-Math.round(x + 16), -Math.round(y + h));
    }
    sprite(c, name, x, y, 2, p.facing < 0, p.power === 2 ? "fire" : "");
    if (walking && Math.floor(p.walk / 13) % 3 === 1) {
      fill(c, "#3b2b31", x + 6, y + h - 5, 11, 5);
      fill(c, "#3b2b31", x + 24, y + h - 2, 8, 4);
    }
    if (p.duck) {
      fill(c, "#e74732", x + 7, y + 5, 17, 4);
    }
    c.restore();
  }
  function enemyArt(c, e, time) {
    if (!e.alive) return;
    if (e.hit > 0 && e.kind === "boss" && Math.floor(time * 20) % 2) return;
    const bob = e.grounded ? Math.floor(time * 7 + e.phase) % 2 : 0;
    if (e.kind === "boss") {
      boss(c, e.x, e.y, time);
      return;
    }
    if (e.kind === "plant") {
      sprite(c, "plant", e.x - 7, e.y, 2.5);
      return;
    }
    const name = e.kind === "goomba" ? "goomba" : e.kind === "shell" ? "shell" : "turtle";
    sprite(c, name, e.x - 1, e.y + bob, 2, e.vx > 0);
    if (e.kind === "shell" && e.vx !== 0) {
      c.globalAlpha = 0.3;
      fill(c, "#fff0a3", e.x - (e.vx > 0 ? 15 : -36), e.y + 10, 10, 3);
      c.globalAlpha = 1;
    }
  }
  function boss(c, x, y, time) {
    c.save();
    c.translate(Math.round(x), Math.round(y));
    const bob = Math.sin(time * 3) * 2;
    poly(c, "#324e40", [[20, 40], [34, 18], [65, 14], [91, 32], [99, 65], [83, 83], [27, 80]]);
    poly(c, "#6a9c54", [[30, 37], [40, 22], [65, 18], [86, 33], [92, 64], [79, 74], [30, 74]]);
    for (const [sx, sy] of [[38, 20], [58, 15], [78, 23], [89, 43], [88, 65]]) poly(c, "#f2dab1", [[sx - 5, sy + 8], [sx + 3, sy - 12], [sx + 10, sy + 7]]);
    fill(c, "#cb8c49", 14, 41, 30, 42);
    fill(c, "#f2c678", 12, 45, 25, 32);
    fill(c, "#a4663d", 17, 52, 18, 3);
    fill(c, "#a4663d", 17, 64, 18, 3);
    fill(c, "#e6a85f", -6, 18 + bob, 41, 34);
    fill(c, "#f2c574", -15, 32 + bob, 42, 23);
    fill(c, "#a95738", -15, 45 + bob, 38, 8);
    fill(c, "#fff2c9", -9, 44 + bob, 5, 5);
    fill(c, "#fff2c9", 9, 45 + bob, 5, 5);
    fill(c, "#ed7744", 8, 9 + bob, 26, 12);
    fill(c, "#f8b756", 13, 4 + bob, 12, 6);
    fill(c, "#fff3d2", -1, 24 + bob, 12, 12);
    fill(c, "#372e34", 0, 27 + bob, 4, 8);
    fill(c, "#4e4b35", -4, 20 + bob, 19, 5);
    poly(c, "#e9d7b2", [[22, 18], [24, 1], [36, 18]]);
    fill(c, "#ce9958", -1, 60, 18, 17);
    fill(c, "#2e3540", -2, 69, 21, 8);
    fill(c, "#f2d0a0", -6, 73, 7, 6);
    fill(c, "#c88d4b", 20, 79, 22, 17);
    fill(c, "#eec87e", 10, 89, 34, 9);
    fill(c, "#c88d4b", 69, 78, 21, 18);
    fill(c, "#eec87e", 61, 89, 34, 9);
    poly(c, "#87aa56", [[90, 68], [118, 55], [111, 74], [91, 83]]);
    c.restore();
  }
  function grass(c, x, y, seed, time) {
    fill(c, "#4b843e", x + 5, y - 7, 2, 8);
    fill(c, "#73a850", x + 2, y - 9, 2, 5);
    fill(c, "#73a850", x + 8, y - 11, 2, 7);
    if (noise(seed) > 0.6) {
      const dx = Math.floor(Math.sin(time + seed) * 1.5);
      fill(c, "#679451", x + 20, y - 12, 2, 12);
      fill(c, seed % 2 ? "#fff0a8" : "#efaa9b", x + 16 + dx, y - 16, 10, 6);
      fill(c, "#efc05c", x + 20 + dx, y - 14, 3, 3);
    }
  }
  function flag(c, x, y, active, time, finish = false) {
    fill(c, "#385f4a", x + 1, y, 5, finish ? 300 : 85);
    fill(c, "#e0dcb1", x, y, 2, finish ? 300 : 85);
    fill(c, "#eccb6b", x - 3, y - 6, 10, 10);
    const color = active ? "#e95a40" : "#829775", wave = Math.sin(time * 4) * 3;
    poly(c, color, [[x + 5, y + 5], [x + (finish ? 64 : 40), y + 8 + wave], [x + (finish ? 57 : 35), y + 31 + wave], [x + 5, y + 28]]);
    if (finish) {
      label(c, "M", x + 28, y + 25, 18, "#fff3c3");
    }
  }
  function castle(c, x, y, theme) {
    const stone = theme === "castle" ? "#b99c87" : "#cbb99a", shadow = theme === "castle" ? "#7b6471" : "#9c987e";
    fill(c, shadow, x, y - 135, 130, 135);
    fill(c, stone, x + 7, y - 130, 116, 130);
    fill(c, shadow, x - 9, y - 152, 148, 20);
    for (let i = 0; i < 5; i++) fill(c, stone, x - 9 + i * 33, y - 166, 20, 25);
    for (let row = 0; row < 5; row++) {
      fill(c, shadow, x + 7, y - 115 + row * 24, 116, 2);
      for (let j = 0; j < 4; j++) fill(c, shadow, x + row % 2 * 14 + j * 32, y - 114 + row * 24, 2, 22);
    }
    fill(c, "#34483d", x + 46, y - 58, 39, 58);
    fill(c, "#34483d", x + 51, y - 65, 29, 7);
    fill(c, "#dbc99a", x + 46, y - 64, 5, 64);
    fill(c, "#dbc99a", x + 80, y - 64, 5, 64);
    for (const dx of [19, 96]) {
      fill(c, "#46554b", x + dx, y - 111, 15, 24);
      fill(c, "#273b36", x + dx + 4, y - 111, 4, 24);
    }
  }
  function scenery(c, theme, camera, time) {
    if (theme === "castle") {
      const lava = c.createLinearGradient(0, 483, 0, 540);
      lava.addColorStop(0, "#ffcb63");
      lava.addColorStop(0.15, "#f68b43");
      lava.addColorStop(1, "#a53f43");
      c.fillStyle = lava;
      c.fillRect(0, 491, WIDTH, 49);
      for (let x = -30; x < WIDTH; x += 30) {
        const y = 491 + Math.sin(time * 3 + x * 0.025) * 4;
        fill(c, "#ffd76c", x, y, 20, 5);
        fill(c, "#e86b43", x + 10, 512 + Math.sin(x) * 5, 18, 3);
      }
    } else if (theme === "meadow") {
      c.fillStyle = "#8dc3b6";
      c.fillRect(0, 513, WIDTH, 27);
      for (let x = -10; x < WIDTH; x += 43) fill(c, "#c7e1c2", x + Math.sin(time + x) * 4 - camera * 0.1 % 20, 522, 25, 2);
    }
  }

  // games-src/super-mario/src/render.ts
  var Renderer = class {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d", { alpha: false });
      canvas.width = WIDTH;
      canvas.height = HEIGHT;
    }
    draw(g) {
      const c = this.ctx, t = g.age, w = g.world;
      c.imageSmoothingEnabled = false;
      c.save();
      const title = ["title", "levels", "help", "win"].includes(g.mode);
      background(c, title ? "meadow" : w.theme, title ? 0 : g.camera, t);
      if (title) {
        this.title(t);
        c.restore();
        return;
      }
      if (g.shake > 0 && !matchMedia("(prefers-reduced-motion: reduce)").matches) c.translate((Math.random() - 0.5) * g.shake * 16, (Math.random() - 0.5) * g.shake * 12);
      scenery(c, w.theme, g.camera, t);
      c.translate(-Math.round(g.camera), 0);
      const from = g.camera - 80, to = g.camera + WIDTH + 80;
      for (const b of w.blocks) {
        if (b.broken || b.x < from || b.x > to) continue;
        if (b.kind === "ground" && !w.blocks.some((a) => !a.broken && a.x === b.x && a.y === b.y - TILE)) {
          if (w.theme === "meadow" || w.theme === "sky") grass(c, b.x, b.y, Math.floor(b.x / 40), t);
          if ((w.theme === "cave" || w.theme === "bonus") && Math.floor(b.x / 40) % 5 === 0) {
            fill(c, "#64a8ab", b.x + 8, b.y - 15, 7, 15);
            fill(c, "#95d9cb", b.x + 11, b.y - 22, 3, 22);
            fill(c, "#428a9c", b.x + 18, b.y - 10, 8, 10);
          }
        }
      }
      if (w.theme !== "bonus") {
        if (w.theme !== "castle") {
          castle(c, w.goal + 110, 480, w.theme);
          flag(c, w.goal + 8, 180, g.mode === "clear", t, true);
        } else {
          fill(c, "#212735", w.goal + 8, 353, 62, 127);
          fill(c, "#d2af78", w.goal + 3, 346, 8, 134);
          fill(c, "#d2af78", w.goal + 70, 346, 8, 134);
          fill(c, "#d2af78", w.goal + 3, 342, 75, 8);
          sprite(c, "princess", w.goal + 22, 430, 3);
          if (!g.bossWon) for (let i = 0; i < 6; i++) fill(c, "#aaa4a0", w.goal + 9 + i * 12, 350, 4, 130);
        }
      }
      if (w.checkpoint) flag(c, w.checkpoint, 392, g.checkpoint, t);
      for (const e of w.enemies) if (e.kind === "plant" && e.x > from && e.x < to) enemyArt(c, e, t);
      for (const item of w.pickups) if (item.active && item.emerge > 0) this.item(g, item);
      for (const b of w.blocks) if (b.x + b.w > from && b.x < to) {
        const top = b.kind === "ground" && !w.blocks.some((a) => !a.broken && a.x === b.x && a.y === b.y - TILE);
        drawBlock(c, b, w.theme, t, top);
      }
      for (const platform of w.platforms) {
        fill(c, "#496453", platform.x, platform.y, platform.w, 18);
        fill(c, "#e3d098", platform.x, platform.y, platform.w, 5);
        fill(c, "#a58d62", platform.x + 3, platform.y + 6, platform.w - 6, 8);
        for (let i = 0; i < platform.w; i += 20) fill(c, "#735f4c", platform.x + i, platform.y + 5, 2, 10);
        fill(c, "#8b9a7c77", platform.homeX + platform.w / 2, platform.homeY - 90, 2, 80);
      }
      for (const item of w.pickups) if (item.active && item.emerge <= 0 && item.x > from && item.x < to) this.item(g, item);
      if (w.warp && g.player.x > w.warp.x - 180 && g.player.x < w.warp.x + 180) {
        label(c, "\u2193", w.warp.x + 40, w.warp.y - 17 + Math.sin(t * 3) * 3, 19, "#f7edbb");
      }
      if (w.exit) {
        label(c, "\u2193 \u8FD4\u56DE\u5730\u9762", w.exit.x + 40, w.exit.y - 22 + Math.sin(t * 3) * 3, 13, "#f7edbb");
      }
      for (const e of w.enemies) if (e.kind !== "plant" && e.x > from && e.x < to) enemyArt(c, e, t);
      playerArt(c, g.player, t);
      for (const s of g.shots) {
        const x = s.x + s.w / 2, y = s.y + s.h / 2;
        fill(c, "#da563c", x - 8, y - 8, 16, 16);
        fill(c, "#ffb855", x - 6, y - 6, 12, 12);
        fill(c, "#fff0b0", x - 3, y - 3, 6, 6);
      }
      for (const p of g.particles) {
        c.globalAlpha = Math.min(1, p.life * 3);
        if (p.text) label(c, p.text, p.x, p.y, p.size, p.color);
        else fill(c, p.color, p.x, p.y, p.size, p.size);
      }
      c.globalAlpha = 1;
      c.restore();
      const boss2 = w.enemies.find((e) => e.kind === "boss" && e.alive);
      if (boss2 && Math.abs(boss2.x - g.player.x) < 800) {
        fill(c, "#1b2c38dd", WIDTH / 2 - 135, HEIGHT - 40, 270, 24);
        fill(c, "#675363", WIDTH / 2 - 50, HEIGHT - 32, 174, 8);
        fill(c, "#ea8762", WIDTH / 2 - 50, HEIGHT - 32, 174 * boss2.hp / 8, 8);
        label(c, "\u57CE\u5821\u5B88\u536B", WIDTH / 2 - 90, HEIGHT - 24, 11, "#fff0c2");
      }
      if (g.flash > 0) {
        c.fillStyle = `rgba(255,242,200,${g.flash * 1.4})`;
        c.fillRect(0, 0, WIDTH, HEIGHT);
      }
      const vignette = c.createRadialGradient(480, 250, 230, 480, 270, 650);
      vignette.addColorStop(0, "#163e3000");
      vignette.addColorStop(1, "#163e3029");
      c.fillStyle = vignette;
      c.fillRect(0, 0, WIDTH, HEIGHT);
    }
    item(g, item) {
      const c = this.ctx, t = g.age;
      if (item.kind === "coin") coinArt(c, item.x, item.y + Math.sin(t * 3 + item.x) * 2, t + item.x * 0.04);
      else if (item.kind === "medal") {
        const y = item.y + Math.sin(t * 2.5) * 5;
        c.save();
        c.globalAlpha = 0.12 + 0.08 * Math.sin(t * 3);
        c.fillStyle = "#ffe7a0";
        c.beginPath();
        c.arc(item.x + 17, y + 17, 28, 0, Math.PI * 2);
        c.fill();
        c.restore();
        sprite(c, "star", item.x + 1, y + 1, 2);
        fill(c, "#fff8d2", item.x + 34, y - 4, 3, 3);
      } else sprite(c, item.kind === "life" ? "mushroom" : item.kind, item.x - 1, item.y, 2, false, item.kind === "life" ? "life" : "");
    }
    title(t) {
      const c = this.ctx;
      fill(c, "#559151", 0, 431, WIDTH, 8);
      fill(c, "#c4d78a", 0, 429, WIDTH, 3);
      for (let x = 0; x < WIDTH; x += 40) {
        drawBlock(c, { x, y: 440, w: 40, h: 40, kind: "ground", broken: false, bump: 0 }, "meadow", t, false);
        drawBlock(c, { x, y: 480, w: 40, h: 40, kind: "ground", broken: false, bump: 0 }, "meadow", t, false);
        grass(c, x, 430, x, t);
      }
      fill(c, "#365b3c", 0, 433, WIDTH, 8);
      for (let x = 580; x <= 700; x += 40) drawBlock(c, { x, y: 271, w: 40, h: 40, kind: x === 620 ? "question" : "brick", broken: false, bump: 0 }, "meadow", t, true);
      coinArt(c, 627, 224 + Math.sin(t * 2) * 5, t, true);
      coinArt(c, 670, 224 + Math.sin(t * 2 + 1) * 5, t + 0.2, true);
      drawBlock(c, { x: 782, y: 351, w: 80, h: 40, kind: "pipe", broken: false, bump: 0, pipeTop: true }, "meadow", t, true);
      drawBlock(c, { x: 782, y: 391, w: 80, h: 40, kind: "pipe", broken: false, bump: 0 }, "meadow", t, true);
      const jump = Math.max(0, Math.sin(t * 1.9)) * 66;
      c.save();
      c.translate(643, 427 - jump);
      c.scale(2, 2);
      sprite(c, "tall", -16, -46, 2);
      c.restore();
      sprite(c, "goomba", 887 + Math.sin(t) * 13, 399, 2, true);
      for (let i = 0; i < 7; i++) {
        const x = 510 + noiseLocal(i) * 410, y = 140 + noiseLocal(i + 9) * 260 + Math.sin(t + i) * 9;
        fill(c, "#fff0ba99", x, y, 3, 3);
      }
      label(c, "01 \u2014 \u9752\u98CE\u8349\u539F", 855, 508, 11, "#f2e5b5");
    }
  };
  var noiseLocal = (n) => Math.sin(n * 137 + 24) * 4726 % 1 * 0.5 + 0.5;

  // games-src/super-mario/src/main.ts
  var $ = (id) => document.getElementById(id);
  var game = new Game();
  var renderer = new Renderer($("game"));
  var overlay = $("overlay");
  document.body.classList.toggle("fit-screen", parent === window);
  window.addEventListener("message", (event) => {
    if (event.source !== parent || event.origin !== location.origin || event.data?.type !== "yumo:mario-fullscreen") return;
    document.body.classList.toggle("fit-screen", event.data.active === true);
  });
  var scoreString = (n) => String(n).padStart(6, "0");
  var medals = (bits) => [0, 1, 2].map((i) => `<span class="${bits & 1 << i ? "gold" : ""}">\u2605</span>`).join("");
  var action = (id, fn) => $(id)?.addEventListener("click", () => {
    void game.sound.unlock();
    fn();
  });
  var closePanel = () => {
    game.screen("title");
  };
  function screen() {
    const mode = game.mode, gameplay = !["title", "levels", "help", "win"].includes(mode);
    $("hud").classList.toggle("hidden", !gameplay);
    $("medals").classList.toggle("hidden", !gameplay);
    overlay.classList.toggle("backdrop", ["paused", "clear", "gameover", "levels", "help", "win", "intro"].includes(mode));
    if (mode === "title") {
      overlay.innerHTML = `<section class="title-screen"><div class="title-top"><i>M</i> YUMO ORIGINAL / 04</div><h1>SUPER<br><em>MARIO.</em></h1><h2>\u8D85\u7EA7\u739B\u4E3D \xB7 \u8611\u83C7\u738B\u56FD\u5192\u9669</h2><p>\u9876\u8D77\u4E00\u5757\u7816\uFF0C\u8DC3\u8FC7\u4E00\u7247\u4E91\u3002<br>\u628A\u90A3\u4E9B\u7B80\u5355\u7684\u5FEB\u4E50\uFF0C\u518D\u73A9\u4E00\u904D\u3002</p><div class="title-actions"><button id="start" class="primary">\u5F00\u59CB\u5192\u9669 <span>\u25B6</span></button><button id="worlds" class="secondary">\u4E16\u754C\u5730\u56FE</button><button id="help" class="secondary" aria-label="\u67E5\u770B\u64CD\u4F5C\u8BF4\u660E">?</button></div><div class="title-bottom">4 WORLDS \xB7 12 STAR MEDALS \xB7 ONE BIG ADVENTURE</div><div class="title-stamp">LET\u2019S PLAY<b>1985</b>ONCE AGAIN</div></section>`;
      action("start", () => game.start(0));
      action("worlds", () => game.screen("levels"));
      action("help", () => game.screen("help"));
    } else if (mode === "levels") {
      overlay.innerHTML = `<section class="panel"><span class="eyebrow">CHOOSE YOUR NEXT ADVENTURE</span><h2>\u4E0B\u4E00\u7AD9\uFF0C\u53BB\u54EA\u91CC\uFF1F</h2><p>\u901A\u5173\u89E3\u9501\u4E0B\u4E00\u4E16\u754C\uFF0C\u6536\u96C6\u6BCF\u4E00\u679A\u661F\u7AE0\u3002</p><div class="level-grid">${worlds.map((w, i) => `<button class="level-card" id="level-${i}" ${i > game.save.unlocked ? "disabled" : ""}><b>${i > game.save.unlocked ? "\u25C8" : "0" + (i + 1)} / ${w.mark}</b><small>${w.name}</small><span>${[0, 1, 2].map((j) => game.save.medals[i] & 1 << j ? "\u2605" : "\u2606").join("")}</span></button>`).join("")}</div><p>\u6700\u9AD8\u5F97\u5206 ${scoreString(game.save.best)}</p><button id="back" class="secondary">\u8FD4\u56DE\u6807\u9898</button></section>`;
      worlds.forEach((_, i) => action(`level-${i}`, () => game.start(i)));
      action("back", closePanel);
    } else if (mode === "help") {
      overlay.innerHTML = `<section class="panel"><span class="eyebrow">A SMALL GUIDE TO BIG ADVENTURES</span><h2>\u6BCF\u4E00\u8DF3\uFF0C\u90FD\u6709\u60CA\u559C\u3002</h2><div class="help-grid"><b>\u2190 \u2192 / A D</b><span>\u5DE6\u53F3\u79FB\u52A8\uFF1B\u6309\u4F4F Shift / J \u51B2\u523A\u3002</span><b>\u7A7A\u683C / Z / K</b><span>\u8DF3\u8DC3\u3002\u957F\u6309\u8DF3\u5F97\u66F4\u9AD8\uFF0C\u8E29\u4E2D\u654C\u4EBA\u65F6\u6309\u4F4F\u53EF\u5F39\u5F97\u66F4\u9AD8\u3002</span><b>\u2193 / S</b><span>\u8E72\u4E0B\uFF1B\u7AD9\u5728\u6807\u6709\u7BAD\u5934\u7684\u6C34\u7BA1\u4E0A\u6309\u4E0B\uFF0C\u8FDB\u5165\u9690\u85CF\u623F\u95F4\u3002</span><b>X / \u51B2\u523A\u952E</b><span>\u83B7\u5F97\u706B\u7130\u82B1\u540E\u53D1\u5C04\u706B\u7403\uFF1B\u9F9F\u58F3\u53EF\u4EE5\u8E22\u5411\u654C\u4EBA\u3002</span><b>Esc / P</b><span>\u6682\u505C\u3002\u5207\u5230\u5176\u4ED6\u7A97\u53E3\u65F6\u4E5F\u4F1A\u81EA\u52A8\u6682\u505C\u3002</span><b>\u2605 \u661F\u7AE0</b><span>\u6BCF\u5173\u4E09\u679A\u3002\u91D1\u5E01\u7D2F\u8BA1 100 \u679A\u5956\u52B1\u4E00\u6761\u751F\u547D\uFF0C\u65D7\u5E1C\u70B9\u4EAE\u68C0\u67E5\u70B9\u3002</span></div><p>\u624B\u673A\u652F\u6301\u591A\u6307\u540C\u65F6\u64CD\u4F5C\uFF1B\u6A2A\u5C4F\u6E38\u73A9\u6709\u66F4\u5F00\u9614\u7684\u89C6\u91CE\u3002</p><button id="back" class="primary">\u51C6\u5907\u597D\u4E86</button></section>`;
      action("back", closePanel);
    } else if (mode === "intro") {
      const world = worlds[game.world.index];
      overlay.innerHTML = `<section class="intro-panel"><span class="eyebrow">WORLD 1 \u2014 ${game.world.index + 1}</span><div class="world-mark">${world.mark}</div><h2>${world.name}</h2><p>MARIO \xD7 ${game.lives}${game.checkpoint ? " / CHECKPOINT" : ""}</p></section>`;
    } else if (mode === "paused") {
      overlay.innerHTML = `<section class="panel"><span class="eyebrow">TAKE A LITTLE BREATHER</span><h2>\u4E16\u754C\u5728\u7B49\u4F60\u3002</h2><p>\u6682\u505C\u4E00\u4E0B\uFF0C\u4E0B\u4E00\u8DF3\u4F1A\u66F4\u4ECE\u5BB9\u3002</p><div class="panel-actions"><button id="resume" class="primary">\u7EE7\u7EED\u5192\u9669 \u25B6</button><button id="home" class="secondary">\u8FD4\u56DE\u6807\u9898</button></div></section>`;
      action("resume", () => game.resume());
      action("home", () => game.home());
    } else if (mode === "clear") {
      overlay.innerHTML = `<section class="panel"><span class="eyebrow">WORLD ${game.world.index + 1} / COMPLETE</span><h2>${game.world.index === 3 ? "\u516C\u4E3B\u5F97\u6551\u4E86\uFF01" : "\u6F02\u4EAE\u7684\u4E00\u8DC3\u3002"}</h2><p>${worlds[game.world.index].name} \xB7 \u5DF2\u5B8C\u6210</p><div class="big-medals">${medals(game.medals)}</div><div class="stats"><div><b>${scoreString(game.score)}</b><small>\u5192\u9669\u5F97\u5206</small></div><div><b>+${game.clearBonus}</b><small>\u65F6\u95F4\u5956\u52B1</small></div><div><b>${game.coins}</b><small>\u91D1\u5E01\u6536\u96C6</small></div></div><div class="panel-actions"><button id="next" class="primary">${game.world.index === 3 ? "\u5192\u9669\u7684\u7EC8\u7AE0" : "\u4E0B\u4E00\u4E16\u754C"} \u2192</button><button id="home" class="secondary">\u8FD4\u56DE\u6807\u9898</button></div></section>`;
      action("next", () => game.next());
      action("home", () => game.home());
    } else if (mode === "gameover") {
      overlay.innerHTML = `<section class="panel"><span class="eyebrow">EVERY HERO TRIES AGAIN</span><h2>\u518D\u6765\u4E00\u6B21\uFF0C\u5C31\u5DEE\u4E00\u70B9\u3002</h2><p>\u8FD9\u6BB5\u5192\u9669\u7684\u5F97\u5206\u662F ${scoreString(game.score)}\u3002<br>\u5DF2\u89E3\u9501\u7684\u4E16\u754C\u548C\u901A\u5173\u661F\u7AE0\u4F1A\u4E00\u76F4\u4E3A\u4F60\u4FDD\u7559\u3002</p><div class="panel-actions"><button id="retry" class="primary">\u91CD\u65B0\u6311\u6218 \u21BB</button><button id="home" class="secondary">\u8FD4\u56DE\u6807\u9898</button></div></section>`;
      action("retry", () => game.start(game.world.index));
      action("home", () => game.home());
    } else if (mode === "win") {
      const count = game.save.medals.reduce((sum, bits) => sum + [0, 1, 2].filter((i) => bits & 1 << i).length, 0);
      overlay.innerHTML = `<section class="panel"><span class="eyebrow">THANK YOU FOR PLAYING</span><h2>\u5192\u9669\u4F1A\u7ED3\u675F\uFF0C<br>\u5FEB\u4E50\u4E0D\u4F1A\u3002</h2><p>\u4F60\u8D8A\u8FC7\u8349\u539F\u3001\u7A7F\u8FC7\u5730\u5E95\u3001\u8E0F\u4E0A\u4E91\u7AEF\uFF0C<br>\u7EC8\u4E8E\u8BA9\u8611\u83C7\u738B\u56FD\u8FCE\u6765\u4E86\u65B0\u7684\u6E05\u6668\u3002</p><div class="stats"><div><b>${scoreString(game.score)}</b><small>\u672C\u6B21\u5F97\u5206</small></div><div><b>${count} / 12</b><small>\u7D2F\u8BA1\u661F\u7AE0</small></div></div><p>\u4EE5\u72EC\u7ACB\u4EE3\u7801\u4E0E\u50CF\u7D20\u7ED8\u753B\uFF0C\u81F4\u656C Nintendo\u300A\u8D85\u7EA7\u9A6C\u529B\u6B27\u5144\u5F1F\u300B\u3002<br>\u975E\u5B98\u65B9\u540C\u4EBA\u4F5C\u54C1 \xB7 Yumo Play Department</p><div class="panel-actions"><button id="worlds" class="primary">\u6536\u96C6\u5269\u4F59\u661F\u7AE0</button><button id="home" class="secondary">\u8FD4\u56DE\u6807\u9898</button></div></section>`;
      action("worlds", () => game.screen("levels"));
      action("home", () => game.home());
    } else overlay.innerHTML = "";
  }
  game.onScreen = screen;
  game.onToast = (text) => {
    $("toast").textContent = text;
    $("toast").classList.add("show");
  };
  action("pause", () => game.mode === "paused" ? game.resume() : game.pause());
  function soundLabel() {
    $("sound").textContent = game.sound.enabled ? "\u266B \u58F0\u97F3\u5F00\u542F" : "\u266A \u58F0\u97F3\u5173\u95ED";
    $("sound").setAttribute("aria-pressed", String(game.sound.enabled));
  }
  action("sound", () => {
    game.sound.toggle();
    game.save.sound = game.sound.enabled;
    writeSave(game.save);
    soundLabel();
  });
  soundLabel();
  screen();
  var last = performance.now();
  var accumulator = 0;
  var lastHud = "";
  var lastMode = game.mode;
  function frame(now) {
    accumulator += Math.min(0.1, (now - last) / 1e3);
    last = now;
    while (accumulator >= 1 / 60) {
      game.step(1 / 60);
      accumulator -= 1 / 60;
    }
    renderer.draw(game);
    const hudKey = [game.score, game.coins, game.lives, game.world.index, Math.ceil(game.clock), game.medals, game.world.theme].join(":");
    if (hudKey !== lastHud) {
      $("score").textContent = scoreString(game.score);
      $("coins").textContent = String(game.coins).padStart(2, "0");
      $("hearts").textContent = `\u2665 \xD7${game.lives}`;
      $("world-name").textContent = game.world.name;
      $("world").textContent = `WORLD 1\u2014${game.world.index + 1}`;
      $("timer").textContent = String(Math.ceil(game.clock)).padStart(3, "0");
      for (const [i, el] of [...$("medals").children].entries()) el.classList.toggle("found", !!(game.medals & 1 << i));
      lastHud = hudKey;
    }
    if (game.toastTime === 0) $("toast").classList.remove("show");
    if (lastMode !== game.mode) {
      lastMode = game.mode;
      if (game.mode === "playing") $("game").focus({ preventScroll: true });
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  var lastHeight = 0;
  new ResizeObserver(() => {
    const height = Math.ceil($("cabinet").getBoundingClientRect().height);
    if (height !== lastHeight) {
      lastHeight = height;
      if (parent !== window) parent.postMessage({ type: "yumo:mario-height", height }, location.origin === "null" ? "*" : location.origin);
    }
  }).observe($("cabinet"));
  if (new URLSearchParams(location.search).has("debug")) Object.assign(window, { __mario: game, __renderer: renderer });
})();
//# sourceMappingURL=main.js.map
