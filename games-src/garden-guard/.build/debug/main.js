"use strict";
(() => {
  // games-src/garden-guard/src/audio.ts
  var _ = null;
  var TRACKS = {
    menu: {
      bpm: 96,
      lead: "triangle",
      drums: false,
      // prettier-ignore
      melody: [
        72,
        _,
        76,
        _,
        79,
        _,
        76,
        _,
        77,
        _,
        74,
        _,
        71,
        _,
        _,
        _,
        72,
        _,
        76,
        _,
        79,
        _,
        84,
        _,
        83,
        _,
        79,
        _,
        _,
        _,
        _,
        _,
        81,
        _,
        77,
        _,
        72,
        _,
        77,
        _,
        79,
        _,
        76,
        _,
        72,
        _,
        _,
        _,
        74,
        _,
        77,
        _,
        76,
        _,
        74,
        _,
        72,
        _,
        _,
        _,
        67,
        _,
        71,
        _
      ],
      bass: [48, 43, 48, 43, 41, 48, 43, 48],
      bassPattern: [0, _, _, _, 7, _, 12, _]
    },
    battle: {
      bpm: 124,
      lead: "square",
      drums: true,
      // prettier-ignore
      melody: [
        69,
        _,
        72,
        _,
        76,
        74,
        72,
        _,
        71,
        _,
        67,
        _,
        69,
        _,
        _,
        _,
        69,
        _,
        72,
        _,
        76,
        77,
        79,
        _,
        77,
        76,
        74,
        _,
        76,
        _,
        _,
        _,
        81,
        _,
        79,
        77,
        76,
        _,
        74,
        _,
        72,
        _,
        74,
        76,
        71,
        _,
        67,
        _,
        69,
        72,
        71,
        69,
        68,
        _,
        71,
        _,
        69,
        _,
        _,
        _,
        64,
        _,
        68,
        _
      ],
      bass: [45, 43, 45, 38, 41, 36, 38, 40],
      bassPattern: [0, _, 12, _, 0, _, 7, 12]
    }
  };
  var midi = (m) => 440 * Math.pow(2, (m - 69) / 12);
  var AudioEngine = class {
    constructor() {
      this.musicOn = true;
      this.sfxOn = true;
      this.intense = false;
      this.ctx = null;
      this.master = null;
      this.sfxBus = null;
      this.musicBus = null;
      this.noiseBuf = null;
      this.trackName = null;
      this.wanted = null;
      this.step = 0;
      this.nextTime = 0;
      this.timer = 0;
      this.lastPlay = /* @__PURE__ */ new Map();
    }
    unlock() {
      if (!this.ctx) {
        const Ctor = window.AudioContext ?? window.webkitAudioContext;
        if (!Ctor) return;
        const ctx = new Ctor();
        this.ctx = ctx;
        this.master = ctx.createGain();
        this.master.gain.value = 0.8;
        this.master.connect(ctx.destination);
        this.sfxBus = ctx.createGain();
        this.sfxBus.gain.value = 0.5;
        this.sfxBus.connect(this.master);
        this.musicBus = ctx.createGain();
        this.musicBus.gain.value = this.musicOn ? 0.22 : 0;
        this.musicBus.connect(this.master);
        const len = ctx.sampleRate;
        this.noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
        const d = this.noiseBuf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        this.timer = window.setInterval(() => this.schedule(), 25);
        if (this.wanted) this.music(this.wanted);
      }
      if (this.ctx.state === "suspended") void this.ctx.resume();
    }
    setMusicOn(on) {
      this.musicOn = on;
      if (this.musicBus && this.ctx) this.musicBus.gain.setTargetAtTime(on ? 0.22 : 0, this.ctx.currentTime, 0.1);
    }
    music(name) {
      this.wanted = name;
      if (!this.ctx) return;
      if (name === this.trackName) return;
      this.trackName = name;
      this.step = 0;
      this.nextTime = this.ctx.currentTime + 0.15;
      this.intense = false;
    }
    play(s) {
      if (!this.sfxOn || !this.ctx || this.ctx.state !== "running") return;
      const now = this.ctx.currentTime;
      const minGap = s === "shoot" || s === "hit" || s === "hitSoft" ? 0.035 : s === "groan" ? 1.2 : 0.02;
      if (now - (this.lastPlay.get(s) ?? -1) < minGap) return;
      this.lastPlay.set(s, now);
      const t = now;
      switch (s) {
        case "plant":
          this.noise(t, 0.12, 0.5, "lowpass", 900, 200);
          this.tone(t, 160, 80, 0.12, "sine", 0.5);
          break;
        case "shoot":
          this.tone(t, 520, 220, 0.07, "sine", 0.35);
          this.noise(t, 0.04, 0.18, "highpass", 2e3, 2e3);
          break;
        case "hit":
          this.noise(t, 0.07, 0.35, "bandpass", 1400, 500);
          this.tone(t, 300, 140, 0.06, "triangle", 0.25);
          break;
        case "hitSoft":
          this.noise(t, 0.06, 0.28, "bandpass", 900, 400);
          break;
        case "hitMetal":
          this.tone(t, 1250, 1180, 0.18, "square", 0.1);
          this.tone(t, 1870, 1800, 0.14, "triangle", 0.1);
          this.noise(t, 0.05, 0.2, "highpass", 3e3, 3e3);
          break;
        case "freeze":
          this.tone(t, 1800, 2600, 0.12, "sine", 0.15);
          this.noise(t, 0.08, 0.2, "highpass", 4e3, 6e3);
          break;
        case "fire":
          this.noise(t, 0.25, 0.3, "lowpass", 1600, 400);
          break;
        case "sun":
          this.tone(t, 880, 880, 0.09, "sine", 0.3);
          this.tone(t + 0.07, 1318, 1318, 0.16, "sine", 0.3);
          break;
        case "explode":
          this.noise(t, 0.9, 1, "lowpass", 1800, 60);
          this.tone(t, 120, 30, 0.7, "sine", 0.9);
          break;
        case "chomp":
          this.noise(t, 0.08, 0.3, "lowpass", 700, 300);
          this.tone(t, 110, 70, 0.08, "square", 0.12);
          break;
        case "bite":
          this.noise(t, 0.14, 0.5, "lowpass", 1200, 200);
          this.tone(t, 200, 60, 0.14, "square", 0.25);
          break;
        case "gulp":
          this.tone(t, 300, 90, 0.22, "sine", 0.45);
          break;
        case "groan": {
          const f = 90 + Math.random() * 40;
          this.tone(t, f, f * 0.75, 0.9, "sawtooth", 0.12, 500);
          break;
        }
        case "mower":
          this.tone(t, 70, 90, 1.2, "sawtooth", 0.25, 900);
          this.noise(t, 1.2, 0.2, "bandpass", 600, 800);
          break;
        case "siren":
          for (let i = 0; i < 3; i++) {
            this.tone(t + i * 0.55, 330, 660, 0.5, "sawtooth", 0.18, 1800);
          }
          break;
        case "lose":
          ;
          [392, 370, 349, 262].forEach((f, i) => this.tone(t + i * 0.32, f, f * 0.97, 0.42, "triangle", 0.4));
          break;
        case "win":
          ;
          [523, 659, 784, 1046, 784, 1046].forEach((f, i) => this.tone(t + i * 0.12, f, f, 0.22, "square", 0.18, 3e3));
          break;
        case "reward":
          ;
          [784, 988, 1175, 1568].forEach((f, i) => this.tone(t + i * 0.09, f, f, 0.3, "triangle", 0.3));
          break;
        case "click":
          this.tone(t, 900, 600, 0.05, "triangle", 0.25);
          break;
        case "pick":
          this.tone(t, 600, 900, 0.07, "triangle", 0.25);
          break;
        case "buzz":
          this.tone(t, 140, 120, 0.18, "square", 0.15, 900);
          break;
        case "shovel":
          this.noise(t, 0.18, 0.45, "bandpass", 1200, 300);
          break;
        case "vault":
          this.noise(t, 0.35, 0.25, "bandpass", 600, 2400);
          break;
        case "squash":
          this.tone(t, 160, 40, 0.3, "sine", 0.8);
          this.noise(t, 0.2, 0.5, "lowpass", 800, 100);
          break;
        case "smash":
          this.tone(t, 90, 30, 0.45, "sine", 0.9);
          this.noise(t, 0.35, 0.7, "lowpass", 1200, 80);
          break;
        case "bowl":
          this.tone(t, 260, 180, 0.12, "triangle", 0.4);
          this.noise(t, 0.08, 0.3, "lowpass", 900, 300);
          break;
        case "pop":
          this.tone(t, 300, 700, 0.08, "sine", 0.35);
          break;
        case "lob":
          this.tone(t, 220, 330, 0.12, "triangle", 0.2);
          break;
        case "ready":
          this.tone(t, 523, 523, 0.18, "triangle", 0.3);
          break;
        case "plantGo":
          this.tone(t, 784, 784, 0.12, "square", 0.2, 3e3);
          this.tone(t + 0.1, 1046, 1046, 0.35, "square", 0.2, 3e3);
          break;
      }
    }
    tone(t, f0, f1, dur, type, vol, lowpass = 0, bus) {
      if (!this.ctx) return;
      const out = bus ?? this.sfxBus;
      if (!out) return;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(f0, t);
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
      g.gain.setValueAtTime(1e-4, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 8e-3);
      g.gain.exponentialRampToValueAtTime(1e-4, t + dur);
      let node = osc;
      if (lowpass) {
        const f = this.ctx.createBiquadFilter();
        f.type = "lowpass";
        f.frequency.value = lowpass;
        node.connect(f);
        node = f;
      }
      node.connect(g).connect(out);
      osc.start(t);
      osc.stop(t + dur + 0.05);
    }
    noise(t, dur, vol, type, f0, f1, bus) {
      if (!this.ctx || !this.noiseBuf) return;
      const out = bus ?? this.sfxBus;
      if (!out) return;
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuf;
      const f = this.ctx.createBiquadFilter();
      f.type = type;
      f.frequency.setValueAtTime(f0, t);
      f.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(1e-4, t + dur);
      src.connect(f).connect(g).connect(out);
      src.start(t, Math.random() * 0.4);
      src.stop(t + dur + 0.05);
    }
    schedule() {
      const ctx = this.ctx;
      if (!ctx || !this.trackName || !this.musicBus) return;
      const track = TRACKS[this.trackName];
      const bpm = track.bpm * (this.intense ? 1.12 : 1);
      const eighth = 60 / bpm / 2;
      if (this.nextTime < ctx.currentTime - 0.2) this.nextTime = ctx.currentTime + 0.05;
      while (this.nextTime < ctx.currentTime + 0.12) {
        this.scheduleStep(track, this.step, this.nextTime, eighth);
        this.nextTime += eighth;
        this.step = (this.step + 1) % track.melody.length;
      }
    }
    scheduleStep(track, i, t, eighth) {
      const bus = this.musicBus;
      const note = track.melody[i];
      if (note != null) {
        let len = 1;
        while (len < 4 && track.melody[(i + len) % track.melody.length] == null) len++;
        const dur = Math.min(len, 3) * eighth * 0.95;
        this.tone(t, midi(note), midi(note), dur, track.lead, track.lead === "square" ? 0.16 : 0.32, 2600, bus);
        this.tone(t, midi(note + 12), midi(note + 12), dur * 0.6, "sine", 0.06, 0, bus);
      }
      const bar = Math.floor(i / 8) % track.bass.length;
      const bp = track.bassPattern[i % 8];
      if (bp != null) this.tone(t, midi(track.bass[bar] + bp), midi(track.bass[bar] + bp), eighth * 1.6, "triangle", 0.42, 900, bus);
      if (track.drums) {
        const s = i % 8;
        if (s === 0 || s === 4 || this.intense && s === 6) this.tone(t, 150, 42, 0.16, "sine", 0.7, 0, bus);
        if (s === 2 || s === 6) this.noise(t, 0.12, 0.28, "bandpass", 1800, 900, bus);
        if (s % 2 === 1 || this.intense) this.noise(t, 0.03, this.intense ? 0.12 : 0.08, "highpass", 7e3, 7e3, bus);
      }
    }
  };

  // games-src/garden-guard/src/config.ts
  var VIEW_W = 1200;
  var VIEW_H = 720;
  var ROWS = 5;
  var COLS = 9;
  var CELL_W = 98;
  var CELL_H = 114;
  var LAWN_X = 262;
  var LAWN_Y = 138;
  var LAWN_R = LAWN_X + COLS * CELL_W;
  var LAWN_B = LAWN_Y + ROWS * CELL_H;
  var HOUSE_X = 150;
  var MOWER_X = 214;
  var SPAWN_X = LAWN_R + 78;
  var WORLD_W = 1740;
  var STREET_CAM = WORLD_W - VIEW_W;
  var STEP = 1 / 60;
  var MAX_SLOTS = 8;
  var rowFeet = (row) => LAWN_Y + (row + 1) * CELL_H - 18;
  var colCenter = (col) => LAWN_X + col * CELL_W + CELL_W / 2;
  var colAt = (x) => Math.floor((x - LAWN_X) / CELL_W);
  var rowAt = (y) => Math.floor((y - LAWN_Y) / CELL_H);
  var SAVE_KEY = "garden-guard-save-v1";

  // games-src/garden-guard/src/util.ts
  var TAU = Math.PI * 2;
  var clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  var lerp = (a, b, t) => a + (b - a) * t;
  var rand = (a = 0, b = 1) => a + Math.random() * (b - a);
  var pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  var easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
  var easeInCubic = (t) => t * t * t;
  var easeInOut = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  var easeOutBack = (t) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  };
  function weighted(items, weight) {
    const total = items.reduce((s, it) => s + weight(it), 0);
    let r = Math.random() * total;
    for (const it of items) {
      r -= weight(it);
      if (r <= 0) return it;
    }
    return items[items.length - 1];
  }
  function seeded(seed) {
    let a = seed >>> 0;
    return () => {
      a = a + 1831565813 >>> 0;
      let t = a;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  var tint = "normal";
  var cache = /* @__PURE__ */ new Map();
  var setTint = (t) => {
    tint = t;
  };
  function parse(hex) {
    if (hex.length === 4) return [parseInt(hex[1] + hex[1], 16), parseInt(hex[2] + hex[2], 16), parseInt(hex[3] + hex[3], 16)];
    return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
  }
  var mix = (c, d, t) => [
    c[0] + (d[0] - c[0]) * t,
    c[1] + (d[1] - c[1]) * t,
    c[2] + (d[2] - c[2]) * t
  ];
  function C(hex) {
    if (tint === "normal" || hex[0] !== "#") return hex;
    const key = tint + hex;
    const hit = cache.get(key);
    if (hit) return hit;
    let c = parse(hex);
    switch (tint) {
      case "frost":
        c = mix(c, [110, 185, 255], 0.42);
        break;
      case "flash":
        c = mix(c, [255, 255, 255], 0.45);
        break;
      case "frostflash":
        c = mix(mix(c, [110, 185, 255], 0.42), [255, 255, 255], 0.4);
        break;
      case "ash": {
        const l = 18 + (0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2]) * 0.16;
        c = [l, l, l + 2];
        break;
      }
      case "dim": {
        const l = 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2];
        c = mix([l, l, l], [30, 30, 36], 0.55);
        break;
      }
      case "gold":
        c = mix(c, [255, 214, 90], 0.35);
        break;
    }
    const alpha = hex.length === 9 ? parseInt(hex.slice(7, 9), 16) / 255 : 1;
    const out = `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${alpha.toFixed(3)})`;
    cache.set(key, out);
    return out;
  }
  function circle(ctx, x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
  }
  function ellipse(ctx, x, y, rx, ry, rot = 0) {
    ctx.beginPath();
    ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, TAU);
  }
  function rrect(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }
  function paint(ctx, fill, stroke, lw = 2.5) {
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.lineWidth = lw;
      ctx.strokeStyle = stroke;
      ctx.stroke();
    }
  }
  function radial(ctx, x0, y0, r0, x1, y1, r1, stops) {
    const g = ctx.createRadialGradient(x0, y0, r0, x1, y1, r1);
    for (const [o, c] of stops) g.addColorStop(o, C(c));
    return g;
  }
  function linear(ctx, x0, y0, x1, y1, stops) {
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    for (const [o, c] of stops) g.addColorStop(o, C(c));
    return g;
  }
  var FONT = '"Microsoft YaHei", "PingFang SC", "Hiragino Sans GB", "Noto Sans SC", sans-serif';
  function text(ctx, str, x, y, o = {}) {
    const size = o.size ?? 20;
    ctx.font = `${o.weight ?? 800} ${size}px ${FONT}`;
    ctx.textAlign = o.align ?? "center";
    ctx.textBaseline = o.baseline ?? "middle";
    if (o.shadow) {
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.fillText(str, x + size * 0.06, y + size * 0.08);
    }
    if (o.stroke) {
      ctx.lineJoin = "round";
      ctx.lineWidth = o.lw ?? Math.max(3, size / 6);
      ctx.strokeStyle = o.stroke;
      ctx.strokeText(str, x, y);
    }
    ctx.fillStyle = o.color ?? "#fff";
    ctx.fillText(str, x, y);
  }
  function wrapText(ctx, str, maxW) {
    const lines = [];
    for (const para of str.split("\n")) {
      let cur = "";
      for (const ch of para) {
        if (ctx.measureText(cur + ch).width > maxW && cur) {
          lines.push(cur);
          cur = ch;
        } else cur += ch;
      }
      lines.push(cur);
    }
    return lines;
  }

  // games-src/garden-guard/src/art/background.ts
  var SIDEWALK_X = LAWN_R + 40;
  var CURB_X = SIDEWALK_X + 108;
  var STREET_X = CURB_X + 12;
  function blob(ctx, x, y, r, fill) {
    circle(ctx, x, y, r);
    ctx.fillStyle = fill;
    ctx.fill();
  }
  function sky(ctx, rnd) {
    ctx.fillStyle = linear(ctx, 0, 0, 0, 150, [
      [0, "#a8d7dc"],
      [1, "#edf6e4"]
    ]);
    ctx.fillRect(0, 0, WORLD_W, 150);
    for (let i = 0; i < 9; i++) {
      const cx = rnd() * WORLD_W;
      const cy = 16 + rnd() * 30;
      ctx.fillStyle = "rgba(255,255,255,0.75)";
      for (let k = 0; k < 4; k++) {
        ellipse(ctx, cx + k * 18 - 27, cy + k % 2 * 4, 22, 11);
        ctx.fill();
      }
    }
    for (let x = -20; x < WORLD_W + 40; x += 34 + rnd() * 20) {
      const r = 26 + rnd() * 22;
      blob(ctx, x, 88 - rnd() * 18, r, "#7ca889");
    }
    for (let x = -10; x < WORLD_W + 40; x += 30 + rnd() * 18) {
      const r = 18 + rnd() * 16;
      blob(ctx, x, 104 - rnd() * 10, r, "#638d73");
    }
  }
  function fence(ctx, x0, x1) {
    ctx.fillStyle = "#a8bb91";
    ctx.fillRect(x0, 70, x1 - x0, 8);
    ctx.fillRect(x0, 108, x1 - x0, 8);
    for (let x = x0; x < x1; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x + 2, 128);
      ctx.lineTo(x + 2, 48);
      ctx.lineTo(x + 14, 36);
      ctx.lineTo(x + 26, 48);
      ctx.lineTo(x + 26, 128);
      ctx.closePath();
      paint(ctx, linear(ctx, x + 2, 0, x + 26, 0, [[0, "#faf8df"], [0.6, "#e9e9ca"], [1, "#cbd5b0"]]), "#9eac83", 2);
      ctx.strokeStyle = "rgba(126,92,50,0.4)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + 10, 54);
      ctx.lineTo(x + 10, 120);
      ctx.stroke();
    }
  }
  function hedge(ctx, x0, x1, y, rnd) {
    for (let x = x0; x < x1; x += 22) {
      const r = 18 + rnd() * 10;
      blob(ctx, x, y + rnd() * 6, r, radial(ctx, x - 6, y - 8, 2, x, y, r, [[0, "#9fca89"], [1, "#588b65"]]));
    }
    for (let i = 0; i < (x1 - x0) / 9; i++) {
      blob(ctx, x0 + rnd() * (x1 - x0), y - 6 + rnd() * 16, 2.2, rnd() < 0.5 ? "#c5dea1" : "#4c7556");
    }
  }
  function house(ctx, rnd) {
    const w = 150;
    ctx.fillStyle = linear(ctx, 0, 0, w, 0, [
      [0, "#c9b694"],
      [1, "#efe2c8"]
    ]);
    ctx.fillRect(0, 0, w, VIEW_H);
    ctx.strokeStyle = "rgba(120,96,60,0.35)";
    ctx.lineWidth = 1.5;
    for (let y = 10; y < VIEW_H; y += 16) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    ctx.fillStyle = "#58746c";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(w + 26, 0);
    ctx.lineTo(w + 26, 26);
    ctx.lineTo(0, 54);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#718b7b";
    for (let x = 0; x < w + 26; x += 18) ctx.fillRect(x, 0, 14, 18 - x * 0.06);
    rrect(ctx, 28, 140, 86, 96, 4);
    paint(ctx, "#f5f0e6", "#5c4630", 4);
    ctx.fillStyle = linear(ctx, 0, 146, 0, 230, [
      [0, "#8fd0f0"],
      [1, "#3a6f95"]
    ]);
    ctx.fillRect(34, 146, 74, 84);
    ctx.fillStyle = "#f5f0e6";
    ctx.fillRect(68, 146, 6, 84);
    ctx.fillRect(34, 185, 74, 6);
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.beginPath();
    ctx.moveTo(38, 150);
    ctx.lineTo(58, 150);
    ctx.lineTo(38, 176);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#b8483a";
    ctx.fillRect(22, 236, 98, 10);
    for (let i = 0; i < 6; i++) blob(ctx, 30 + i * 16, 234, 8, i % 2 ? "#ff7b9c" : "#ffd25a");
    rrect(ctx, 34, 330, 80, 170, 6);
    paint(ctx, linear(ctx, 34, 0, 114, 0, [[0, "#7a4a2a"], [1, "#a8693c"]]), "#3e2312", 4);
    rrect(ctx, 46, 346, 56, 54, 4);
    paint(ctx, "#e8d9a8", "#3e2312", 3);
    rrect(ctx, 46, 412, 56, 72, 4);
    paint(ctx, null, "#5c3418", 3);
    circle(ctx, 100, 440, 5);
    paint(ctx, "#e7c04a", "#7a5a14", 1.5);
    for (let i = 0; i < 3; i++) {
      rrect(ctx, 22 - i * 6, 500 + i * 14, 104 + i * 12, 14, 3);
      paint(ctx, "#cfc6b8", "#8a8274", 2);
    }
    ctx.fillStyle = "#8f8a82";
    ctx.fillRect(0, VIEW_H - 40, w, 40);
    for (let i = 0; i < 18; i++) {
      rrect(ctx, i % 6 * 26 - Math.floor(i / 6) % 2 * 12, VIEW_H - 40 + Math.floor(i / 6) * 14, 24, 12, 3);
      paint(ctx, rnd() < 0.5 ? "#a19b92" : "#b3ada3", "#6f6a62", 1);
    }
  }
  function patio(ctx, rnd) {
    const x0 = 150;
    const x1 = LAWN_X;
    ctx.fillStyle = "#d7cdb8";
    ctx.fillRect(x0, LAWN_Y - 8, x1 - x0, LAWN_B - LAWN_Y + 16);
    for (let y = LAWN_Y - 8; y < LAWN_B + 8; y += 38) {
      const off = Math.round((y - LAWN_Y) / 38) % 2 * 28;
      for (let x = x0 - off; x < x1; x += 56) {
        rrect(ctx, x + 2, y + 2, 52, 34, 5);
        const k = rnd();
        paint(ctx, k < 0.33 ? "#e2d9c6" : k < 0.66 ? "#d2c7af" : "#c8bca2", "#9c907a", 1.5);
      }
    }
    ctx.fillStyle = "rgba(0,0,0,0.12)";
    ctx.fillRect(x1 - 8, LAWN_Y - 8, 8, LAWN_B - LAWN_Y + 16);
  }
  function lawn(ctx, rows, rnd) {
    for (let r = 0; r < ROWS; r++) {
      const active = rows.includes(r);
      const y = LAWN_Y + r * CELL_H;
      for (let c = 0; c < COLS; c++) {
        const x = LAWN_X + c * CELL_W;
        if (active) {
          const light = (r + c) % 2 === 0;
          const base2 = r % 2 === 0 ? light ? "#a2c987" : "#94bf7e" : light ? "#9bc585" : "#8db779";
          ctx.fillStyle = base2;
          ctx.fillRect(x, y, CELL_W, CELL_H);
          for (let i = 0; i < 10; i++) {
            const bx = x + rnd() * CELL_W;
            const by = y + 6 + rnd() * (CELL_H - 8);
            ctx.strokeStyle = rnd() < 0.5 ? "rgba(255,255,255,0.13)" : "rgba(20,70,10,0.18)";
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(bx, by);
            ctx.lineTo(bx + (rnd() - 0.5) * 4, by - 5 - rnd() * 4);
            ctx.stroke();
          }
        } else {
          ctx.fillStyle = (r + c) % 2 ? "#c6b393" : "#d1bea0";
          ctx.fillRect(x, y, CELL_W, CELL_H);
          for (let i = 0; i < 16; i++) {
            ellipse(ctx, x + rnd() * CELL_W, y + rnd() * CELL_H, 1.5 + rnd() * 3, 1 + rnd() * 2);
            ctx.fillStyle = rnd() < 0.5 ? "rgba(60,36,14,0.35)" : "rgba(220,190,140,0.3)";
            ctx.fill();
          }
        }
      }
      if (!active) {
        ctx.fillStyle = "rgba(0,0,0,0.12)";
        ctx.fillRect(LAWN_X, y, COLS * CELL_W, 5);
      } else {
        ctx.fillStyle = "rgba(0,0,0,0.07)";
        ctx.fillRect(LAWN_X, y + CELL_H - 4, COLS * CELL_W, 4);
      }
    }
    for (let i = 0; i < 24; i++) {
      const fx = LAWN_X + rnd() * COLS * CELL_W;
      blob(ctx, fx, LAWN_Y - 4 + rnd() * 6, 3.2, rnd() < 0.5 ? "#fff6d0" : "#ffd0e6");
    }
  }
  function street(ctx, rnd) {
    ctx.fillStyle = "#7ca876";
    ctx.fillRect(LAWN_R, LAWN_Y - 10, SIDEWALK_X - LAWN_R, VIEW_H);
    ctx.fillStyle = "#cfcac0";
    ctx.fillRect(SIDEWALK_X, 120, CURB_X - SIDEWALK_X, VIEW_H);
    ctx.strokeStyle = "#a39d92";
    ctx.lineWidth = 2;
    for (let y = 120; y < VIEW_H; y += 64) {
      ctx.beginPath();
      ctx.moveTo(SIDEWALK_X, y);
      ctx.lineTo(CURB_X, y);
      ctx.stroke();
    }
    for (let i = 0; i < 60; i++) blob(ctx, SIDEWALK_X + rnd() * 108, 120 + rnd() * 600, 1.2, "rgba(90,85,78,0.35)");
    ctx.fillStyle = "#e9e5dc";
    ctx.fillRect(CURB_X, 120, 12, VIEW_H);
    ctx.fillStyle = linear(ctx, STREET_X, 0, WORLD_W, 0, [
      [0, "#667c81"],
      [1, "#7a9093"]
    ]);
    ctx.fillRect(STREET_X, 120, WORLD_W - STREET_X, VIEW_H);
    for (let i = 0; i < 900; i++) {
      ctx.fillStyle = rnd() < 0.5 ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.12)";
      ctx.fillRect(STREET_X + rnd() * (WORLD_W - STREET_X), 120 + rnd() * 600, 2, 2);
    }
    const cx = STREET_X + (WORLD_W - STREET_X) * 0.55;
    ctx.fillStyle = "#e8c24a";
    for (let y = 130; y < VIEW_H; y += 70) ctx.fillRect(cx, y, 9, 40);
    ctx.strokeStyle = "rgba(0,0,0,0.25)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(STREET_X + 120, 300);
    ctx.lineTo(STREET_X + 160, 330);
    ctx.lineTo(STREET_X + 150, 380);
    ctx.stroke();
    for (let i = 0; i < 3; i++) {
      const hx = STREET_X + 30 + i * 150;
      ctx.fillStyle = ["#b9a58e", "#9fb0b8", "#c4a4a0"][i];
      ctx.fillRect(hx, 52, 110, 70);
      ctx.fillStyle = ["#6e4632", "#4e5f6e", "#7a3e3e"][i];
      ctx.beginPath();
      ctx.moveTo(hx - 10, 56);
      ctx.lineTo(hx + 55, 14);
      ctx.lineTo(hx + 120, 56);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#ffeaa6";
      ctx.fillRect(hx + 16, 72, 22, 20);
      ctx.fillRect(hx + 72, 72, 22, 20);
    }
    hedge(ctx, STREET_X - 4, WORLD_W + 20, 124, rnd);
  }
  function renderWorld(rows, scale) {
    const cv = document.createElement("canvas");
    cv.width = Math.ceil(WORLD_W * scale);
    cv.height = Math.ceil(VIEW_H * scale);
    const ctx = cv.getContext("2d");
    ctx.scale(scale, scale);
    const rnd = seeded(20240611);
    sky(ctx, rnd);
    fence(ctx, 150, LAWN_R + 36);
    hedge(ctx, 150, LAWN_R + 40, 130, rnd);
    ctx.fillStyle = "#719967";
    ctx.fillRect(150, LAWN_Y - 10, LAWN_R - 150, 12);
    street(ctx, rnd);
    lawn(ctx, rows, rnd);
    ctx.fillStyle = "#709967";
    ctx.fillRect(LAWN_X, LAWN_B, LAWN_R - LAWN_X + 40, VIEW_H - LAWN_B);
    hedge(ctx, 150, LAWN_R + 40, LAWN_B + 16, rnd);
    patio(ctx, rnd);
    house(ctx, rnd);
    return cv;
  }

  // games-src/garden-guard/src/data/levels.ts
  var ALL = [0, 1, 2, 3, 4];
  var base = { mode: "normal", rows: ALL, startSun: 50, skySun: true, firstWave: 18 };
  var LEVELS = [
    {
      ...base,
      id: "1-1",
      name: "\u521D\u6B21\u64AD\u79CD",
      rows: [2],
      waves: 4,
      flags: [4],
      pool: ["basic"],
      startSun: 150,
      diff: 0.8,
      firstWave: 22,
      reward: ["sunflower"],
      tip: "\u70B9\u51FB\u4E0A\u65B9\u7684\u8C4C\u8C46\u5C04\u624B\u5361\u7247\uFF0C\u518D\u70B9\u51FB\u8349\u5730\u79CD\u4E0B\u5B83\u3002\u522B\u5FD8\u4E86\u6536\u96C6\u5929\u4E0A\u843D\u4E0B\u7684\u9633\u5149\uFF01"
    },
    {
      ...base,
      id: "1-2",
      name: "\u9633\u5149\u7ECF\u6D4E",
      rows: [1, 2, 3],
      waves: 6,
      flags: [6],
      pool: ["basic"],
      diff: 0.9,
      reward: ["cherry"],
      tip: "\u5411\u65E5\u8475\u4F1A\u6301\u7EED\u4EA7\u51FA\u9633\u5149\u3002\u5148\u79CD\u5411\u65E5\u8475\uFF0C\u518D\u5E03\u7F6E\u706B\u529B\u3002"
    },
    {
      ...base,
      id: "1-3",
      name: "\u8DEF\u969C\u6765\u88AD",
      waves: 8,
      flags: [8],
      pool: ["basic", "cone"],
      diff: 1,
      reward: ["wallnut"],
      tip: "\u6A31\u6843\u70B8\u5F39\u80FD\u6E05\u7406\u6210\u7FA4\u7684\u50F5\u5C38\uFF0C\u7559\u5230\u5371\u6025\u5173\u5934\u518D\u7528\u3002"
    },
    {
      ...base,
      id: "1-4",
      name: "\u6491\u6746\u8DF3\u8FDC",
      waves: 10,
      flags: [10],
      pool: ["basic", "cone", "pole"],
      diff: 1.05,
      reward: ["potato"],
      tip: "\u6491\u6746\u50F5\u5C38\u4F1A\u8DF3\u8FC7\u4ED6\u9047\u5230\u7684\u7B2C\u4E00\u682A\u690D\u7269\u3002\u7528\u575A\u679C\u5899\u5F53\u8BF1\u9975\uFF01"
    },
    {
      ...base,
      id: "1-5",
      name: "\u575A\u679C\u4FDD\u9F84\u7403",
      mode: "bowling",
      waves: 8,
      flags: [4, 8],
      pool: ["basic", "cone", "pole", "bucket"],
      skySun: false,
      startSun: 0,
      diff: 1.15,
      firstWave: 10,
      reward: ["snowpea"],
      conveyor: [
        { id: "bowlnut", w: 8 },
        { id: "bombnut", w: 1.6 },
        { id: "giantnut", w: 0.7 }
      ],
      tip: "\u628A\u575A\u679C\u653E\u5728\u7EA2\u7EBF\u5DE6\u4FA7\uFF0C\u5B83\u4EEC\u4F1A\u6EDA\u5411\u50F5\u5C38\u5E76\u659C\u5411\u5F39\u5C04\u3002\u8FDE\u7EED\u649E\u51FB\u66F4\u8FC7\u763E\uFF01"
    },
    {
      ...base,
      id: "1-6",
      name: "\u94C1\u6876\u538B\u5883",
      waves: 12,
      flags: [6, 12],
      pool: ["basic", "cone", "pole", "bucket"],
      diff: 1.05,
      reward: ["chomper"],
      tip: "\u5BD2\u51B0\u5C04\u624B\u80FD\u8BA9\u6574\u884C\u50F5\u5C38\u6162\u4E0B\u6765\uFF0C\u4E3A\u706B\u529B\u4E89\u53D6\u65F6\u95F4\u3002"
    },
    {
      ...base,
      id: "1-7",
      name: "\u6668\u62A5\u65F6\u95F4",
      waves: 12,
      flags: [6, 12],
      pool: ["basic", "cone", "pole", "bucket", "paper"],
      diff: 1.12,
      reward: ["repeater", "squash"],
      tip: "\u5927\u5634\u82B1\u53EF\u4EE5\u4E00\u53E3\u541E\u6389\u94C1\u6876\u50F5\u5C38\uFF0C\u4F46\u5480\u56BC\u65F6\u5F88\u8106\u5F31\u3002"
    },
    {
      ...base,
      id: "1-8",
      name: "\u94C1\u95E8\u4E4B\u540E",
      waves: 14,
      flags: [7, 14],
      pool: ["basic", "cone", "pole", "bucket", "paper", "door"],
      diff: 1.2,
      reward: ["spikeweed", "cabbage"],
      tip: "\u94C1\u6805\u95E8\u6321\u5F97\u4F4F\u8C4C\u8C46\uFF0C\u6321\u4E0D\u4F4F\u7206\u70B8\u548C\u7A9D\u74DC\u3002"
    },
    {
      ...base,
      id: "1-9",
      name: "\u51B2\u950B\u9677\u9635",
      waves: 15,
      flags: [5, 10, 15],
      pool: ["basic", "cone", "pole", "bucket", "paper", "door", "football"],
      diff: 1.28,
      reward: ["jalapeno", "torchwood"],
      tip: "\u5377\u5FC3\u83DC\u6295\u624B\u80FD\u8D8A\u8FC7\u94C1\u6805\u95E8\uFF1B\u5730\u523A\u8BA9\u50F5\u5C38\u8FB9\u8D70\u8FB9\u6389\u8840\u3002"
    },
    {
      ...base,
      id: "1-10",
      name: "\u4F20\u9001\u5E26\u72C2\u6B22",
      mode: "conveyor",
      waves: 15,
      flags: [5, 10, 15],
      pool: ["basic", "cone", "pole", "bucket", "paper", "door", "football"],
      skySun: false,
      startSun: 0,
      diff: 1.55,
      firstWave: 14,
      reward: ["tallnut", "threepeater"],
      conveyor: [
        { id: "repeater", w: 3 },
        { id: "peashooter", w: 2 },
        { id: "snowpea", w: 1.6 },
        { id: "wallnut", w: 1.8 },
        { id: "torchwood", w: 0.9 },
        { id: "cherry", w: 0.9 },
        { id: "jalapeno", w: 0.7 },
        { id: "chomper", w: 0.9 },
        { id: "squash", w: 0.9 },
        { id: "spikeweed", w: 0.9 }
      ],
      tip: "\u690D\u7269\u7531\u4F20\u9001\u5E26\u514D\u8D39\u9001\u8FBE\uFF0C\u4E0D\u9700\u8981\u9633\u5149\u3002\u522B\u8BA9\u4F20\u9001\u5E26\u5806\u6EE1\uFF01"
    },
    {
      ...base,
      id: "1-11",
      name: "\u5DE8\u4EBA\u811A\u6B65",
      waves: 18,
      flags: [6, 12, 18],
      pool: ["basic", "cone", "pole", "bucket", "paper", "door", "football", "garg"],
      diff: 1.42,
      reward: [],
      tip: "\u5DE8\u4EBA\u50F5\u5C38\u80FD\u4E00\u51FB\u7838\u70C2\u4EFB\u4F55\u690D\u7269\uFF0C\u7528\u6A31\u6843\u70B8\u5F39\u548C\u706B\u7206\u8FA3\u6912\u96C6\u4E2D\u5904\u7406\u3002"
    },
    {
      ...base,
      id: "1-12",
      name: "\u6700\u7EC8\u5B88\u536B",
      waves: 20,
      flags: [5, 10, 15, 20],
      pool: ["basic", "cone", "pole", "bucket", "paper", "door", "football", "garg"],
      diff: 1.58,
      reward: [],
      tip: "\u6700\u540E\u4E00\u5173\u3002\u623F\u5B50\u5C31\u5728\u8EAB\u540E\uFF0C\u5B88\u4F4F\u5B83\uFF01"
    }
  ];
  var ENDLESS = {
    ...base,
    id: "\u65E0\u5C3D",
    name: "\u65E0\u5C3D\u751F\u5B58",
    mode: "endless",
    waves: Infinity,
    flags: [],
    pool: ["basic", "cone", "pole", "paper", "bucket", "door", "football", "garg"],
    diff: 1.4,
    firstWave: 20,
    reward: [],
    tip: "\u50F5\u5C38\u4F1A\u4E00\u6CE2\u63A5\u4E00\u6CE2\u6C38\u4E0D\u505C\u6B47\uFF0C\u4F60\u80FD\u575A\u6301\u591A\u5C11\u9762\u65D7\u5E1C\uFF1F"
  };
  var BOWLING = {
    ...LEVELS[4],
    id: "\u4FDD\u9F84",
    name: "\u575A\u679C\u4FDD\u9F84\u7403 \xB7 \u6311\u6218",
    waves: 20,
    flags: [5, 10, 15, 20],
    pool: ["basic", "cone", "pole", "bucket", "paper", "door", "football"],
    diff: 1.6,
    reward: [],
    tip: "\u66F4\u957F\u3001\u66F4\u786C\u7684\u4FDD\u9F84\u7403\u6311\u6218\u3002\u770B\u770B\u4F60\u80FD\u6253\u51FA\u591A\u5C11\u8FDE\u51FB\uFF01"
  };

  // games-src/garden-guard/src/data/plants.ts
  var P = (d) => d;
  var PLANTS = {
    peashooter: P({
      id: "peashooter",
      name: "\u8C4C\u8C46\u5C04\u624B",
      cost: 100,
      cooldown: 7.5,
      hp: 300,
      desc: "\u5411\u524D\u65B9\u6301\u7EED\u53D1\u5C04\u8C4C\u8C46\u3002\n\u5B83\u4ECE\u4E0D\u62B1\u6028\uFF0C\u53EA\u662F\u4E00\u9897\u63A5\u4E00\u9897\u5730\u5C04\u3002",
      stats: ["\u4F24\u5BB3\uFF1A\u4E2D\u7B49", "\u5C04\u901F\uFF1A\u6BCF 1.4 \u79D2\u4E00\u53D1"],
      icon: 0.5,
      iconY: 6
    }),
    sunflower: P({
      id: "sunflower",
      name: "\u5411\u65E5\u8475",
      cost: 50,
      cooldown: 7.5,
      hp: 300,
      desc: "\u5B9A\u671F\u4EA7\u51FA\u989D\u5916\u7684\u9633\u5149\u3002\n\u82B1\u56ED\u7ECF\u6D4E\u7684\u6839\u57FA\uFF0C\u5F00\u5C40\u8BF7\u591A\u79CD\u51E0\u682A\u3002",
      stats: ["\u4EA7\u51FA\uFF1A\u6BCF 24 \u79D2 25 \u9633\u5149"],
      icon: 0.5,
      iconY: 6
    }),
    cherry: P({
      id: "cherry",
      name: "\u6A31\u6843\u70B8\u5F39",
      cost: 150,
      cooldown: 50,
      hp: 300,
      desc: "\u79CD\u4E0B\u540E\u7247\u523B\u4FBF\u4F1A\u7206\u70B8\uFF0C\n\u70B8\u6BC1\u5468\u56F4 3\xD73 \u683C\u5185\u7684\u6240\u6709\u50F5\u5C38\u3002",
      stats: ["\u4F24\u5BB3\uFF1A\u5DE8\u5927", "\u8303\u56F4\uFF1A3\xD73", "\u4F7F\u7528\uFF1A\u4E00\u6B21\u6027"],
      icon: 0.55,
      iconY: 2
    }),
    wallnut: P({
      id: "wallnut",
      name: "\u575A\u679C\u5899",
      cost: 50,
      cooldown: 30,
      hp: 4e3,
      desc: "\u575A\u786C\u7684\u5916\u58F3\u80FD\u957F\u65F6\u95F4\u62D6\u4F4F\u50F5\u5C38\u3002\n\u53D7\u635F\u540E\u4F1A\u9732\u51FA\u8D8A\u6765\u8D8A\u62C5\u5FE7\u7684\u8868\u60C5\u3002",
      stats: ["\u8010\u4E45\uFF1A\u9AD8"],
      icon: 0.55,
      iconY: 4
    }),
    potato: P({
      id: "potato",
      name: "\u571F\u8C46\u5730\u96F7",
      cost: 25,
      cooldown: 30,
      hp: 300,
      desc: "\u9700\u8981\u7EA6 15 \u79D2\u94BB\u51FA\u5730\u9762\u5B8C\u6210\u6B66\u88C5\uFF0C\n\u4E4B\u540E\u7B2C\u4E00\u4E2A\u8E29\u4E0A\u6765\u7684\u50F5\u5C38\u4F1A\u88AB\u70B8\u98DE\u3002",
      stats: ["\u4F24\u5BB3\uFF1A\u5DE8\u5927", "\u51C6\u5907\uFF1A15 \u79D2", "\u4F7F\u7528\uFF1A\u4E00\u6B21\u6027"],
      icon: 0.6,
      iconY: -4
    }),
    snowpea: P({
      id: "snowpea",
      name: "\u5BD2\u51B0\u5C04\u624B",
      cost: 175,
      cooldown: 7.5,
      hp: 300,
      desc: "\u53D1\u5C04\u51B0\u51BB\u8C4C\u8C46\uFF0C\n\u547D\u4E2D\u7684\u50F5\u5C38\u79FB\u52A8\u4E0E\u5543\u54AC\u901F\u5EA6\u51CF\u534A\u3002",
      stats: ["\u4F24\u5BB3\uFF1A\u4E2D\u7B49", "\u6548\u679C\uFF1A\u51CF\u901F 10 \u79D2"],
      icon: 0.5,
      iconY: 6
    }),
    chomper: P({
      id: "chomper",
      name: "\u5927\u5634\u82B1",
      cost: 150,
      cooldown: 7.5,
      hp: 300,
      desc: "\u4E00\u53E3\u541E\u4E0B\u9762\u524D\u7684\u50F5\u5C38\uFF0C\n\u4F46\u5480\u56BC\u9700\u8981\u5F88\u4E45\uFF0C\u8FD9\u671F\u95F4\u6BEB\u65E0\u9632\u5907\u3002",
      stats: ["\u4F24\u5BB3\uFF1A\u541E\u566C", "\u5480\u56BC\uFF1A42 \u79D2", "\u65E0\u6CD5\u541E\u4E0B\u5DE8\u4EBA"],
      icon: 0.44,
      iconY: 10
    }),
    repeater: P({
      id: "repeater",
      name: "\u53CC\u53D1\u5C04\u624B",
      cost: 200,
      cooldown: 7.5,
      hp: 300,
      desc: "\u6BCF\u6B21\u8FDE\u7EED\u53D1\u5C04\u4E24\u9897\u8C4C\u8C46\u3002\n\u7709\u5934\u7D27\u9501\uFF0C\u706B\u529B\u7FFB\u500D\u3002",
      stats: ["\u4F24\u5BB3\uFF1A\u4E2D\u7B49 \xD72", "\u5C04\u901F\uFF1A\u6BCF 1.4 \u79D2\u4E24\u53D1"],
      icon: 0.5,
      iconY: 6
    }),
    squash: P({
      id: "squash",
      name: "\u7A9D\u74DC",
      cost: 50,
      cooldown: 30,
      hp: 300,
      desc: "\u50F5\u5C38\u9760\u8FD1\u65F6\u8DF3\u8D77\u6765\u72E0\u72E0\u538B\u6241\u5B83\u3002\n\u6027\u683C\u66B4\u8E81\uFF0C\u4E00\u6B21\u6027\u3002",
      stats: ["\u4F24\u5BB3\uFF1A\u5DE8\u5927", "\u8303\u56F4\uFF1A\u9644\u8FD1\u4E00\u683C", "\u4F7F\u7528\uFF1A\u4E00\u6B21\u6027"],
      icon: 0.5,
      iconY: 4
    }),
    spikeweed: P({
      id: "spikeweed",
      name: "\u5730\u523A",
      cost: 100,
      cooldown: 7.5,
      hp: 300,
      desc: "\u523A\u4F24\u4ECE\u4E0A\u9762\u8D70\u8FC7\u7684\u50F5\u5C38\u3002\n\u50F5\u5C38\u4E0D\u4F1A\u5543\u5B83\uFF0C\u4F46\u5DE8\u4EBA\u80FD\u628A\u5B83\u8E29\u6241\u3002",
      stats: ["\u4F24\u5BB3\uFF1A\u666E\u901A", "\u6BCF\u79D2\u4E00\u6B21", "\u65E0\u6CD5\u88AB\u5543\u98DF"],
      walkable: true,
      icon: 0.62,
      iconY: -8
    }),
    cabbage: P({
      id: "cabbage",
      name: "\u5377\u5FC3\u83DC\u6295\u624B",
      cost: 100,
      cooldown: 7.5,
      hp: 300,
      desc: "\u628A\u5377\u5FC3\u83DC\u629B\u5411\u50F5\u5C38\u3002\n\u629B\u7269\u7EBF\u80FD\u8D8A\u8FC7\u94C1\u6805\u95E8\u76F4\u63A5\u547D\u4E2D\u3002",
      stats: ["\u4F24\u5BB3\uFF1A\u4E2D\u7B49 \xD72", "\u6295\u63B7\uFF1A\u6BCF 3 \u79D2", "\u65E0\u89C6\u94C1\u6805\u95E8"],
      icon: 0.5,
      iconY: 4
    }),
    jalapeno: P({
      id: "jalapeno",
      name: "\u706B\u7206\u8FA3\u6912",
      cost: 125,
      cooldown: 50,
      hp: 300,
      desc: "\u70B9\u71C3\u6574\u6574\u4E00\u884C\uFF0C\n\u628A\u8FD9\u4E00\u884C\u7684\u50F5\u5C38\u7EDF\u7EDF\u70E7\u6210\u7070\u3002",
      stats: ["\u4F24\u5BB3\uFF1A\u5DE8\u5927", "\u8303\u56F4\uFF1A\u6574\u884C", "\u4F7F\u7528\uFF1A\u4E00\u6B21\u6027"],
      icon: 0.5,
      iconY: 6
    }),
    torchwood: P({
      id: "torchwood",
      name: "\u706B\u70AC\u6811\u6869",
      cost: 175,
      cooldown: 7.5,
      hp: 300,
      desc: "\u7A7F\u8FC7\u5B83\u7684\u8C4C\u8C46\u4F1A\u71C3\u70E7\uFF0C\u4F24\u5BB3\u7FFB\u500D\u5E76\u6E85\u5C04\u3002\n\u51B0\u8C4C\u8C46\u7A7F\u8FC7\u4F1A\u88AB\u878D\u5316\u6210\u666E\u901A\u8C4C\u8C46\u3002",
      stats: ["\u6548\u679C\uFF1A\u8C4C\u8C46\u4F24\u5BB3 \xD72", "\u9644\u5E26\u6E85\u5C04"],
      icon: 0.5,
      iconY: 6
    }),
    tallnut: P({
      id: "tallnut",
      name: "\u9AD8\u575A\u679C",
      cost: 125,
      cooldown: 30,
      hp: 8e3,
      desc: "\u6BD4\u575A\u679C\u5899\u66F4\u9AD8\u66F4\u786C\uFF0C\n\u6491\u6746\u50F5\u5C38\u4E5F\u8DF3\u4E0D\u8FC7\u53BB\u3002",
      stats: ["\u8010\u4E45\uFF1A\u6781\u9AD8", "\u963B\u6321\u6491\u6746\u8DF3"],
      icon: 0.4,
      iconY: 12
    }),
    threepeater: P({
      id: "threepeater",
      name: "\u4E09\u7EBF\u5C04\u624B",
      cost: 325,
      cooldown: 7.5,
      hp: 300,
      desc: "\u540C\u65F6\u5411\u4E09\u884C\u53D1\u5C04\u8C4C\u8C46\u3002\n\u4E09\u4E2A\u8111\u888B\uFF0C\u4E00\u4E2A\u76EE\u6807\u3002",
      stats: ["\u4F24\u5BB3\uFF1A\u4E2D\u7B49", "\u5C04\u51FB\uFF1A\u4E09\u884C"],
      icon: 0.44,
      iconY: 12
    }),
    bowlnut: P({
      id: "bowlnut",
      name: "\u4FDD\u9F84\u575A\u679C",
      cost: 0,
      cooldown: 0,
      hp: 4e3,
      desc: "\u6EDA\u51FA\u53BB\u649E\u51FB\u50F5\u5C38\uFF0C\u7136\u540E\u659C\u7740\u5F39\u5411\u76F8\u90BB\u4E00\u884C\u3002\n\u8FDE\u7EED\u649E\u51FB\u8D8A\u591A\u8D8A\u723D\u5FEB\u3002",
      stats: ["\u649E\u51FB\u4F24\u5BB3\uFF1A900", "\u53EF\u8FDE\u7EED\u5F39\u5C04"],
      bowling: true,
      icon: 0.55,
      iconY: 4
    }),
    bombnut: P({
      id: "bombnut",
      name: "\u7206\u70B8\u575A\u679C",
      cost: 0,
      cooldown: 0,
      hp: 4e3,
      desc: "\u649E\u5230\u7B2C\u4E00\u4E2A\u50F5\u5C38\u65F6\u7206\u70B8\uFF0C\n\u5A01\u529B\u7B49\u540C\u6A31\u6843\u70B8\u5F39\u3002",
      stats: ["\u4F24\u5BB3\uFF1A\u5DE8\u5927", "\u8303\u56F4\uFF1A3\xD73"],
      bowling: true,
      icon: 0.55,
      iconY: 4
    }),
    giantnut: P({
      id: "giantnut",
      name: "\u5DE8\u578B\u575A\u679C",
      cost: 0,
      cooldown: 0,
      hp: 4e3,
      desc: "\u4F53\u578B\u5DE8\u5927\uFF0C\u4E00\u8DEF\u78BE\u538B\u6574\u884C\u7684\u50F5\u5C38\uFF0C\n\u4E0D\u4F1A\u5F39\u5F00\u3002",
      stats: ["\u78BE\u538B\u4F24\u5BB3\uFF1A3000", "\u8D2F\u7A7F\u6574\u884C"],
      bowling: true,
      icon: 0.3,
      iconY: 14
    })
  };
  var PLANT_ORDER = [
    "peashooter",
    "sunflower",
    "cherry",
    "wallnut",
    "potato",
    "snowpea",
    "chomper",
    "repeater",
    "squash",
    "spikeweed",
    "cabbage",
    "jalapeno",
    "torchwood",
    "tallnut",
    "threepeater"
  ];
  var ALL_PLANTS = [...PLANT_ORDER];

  // games-src/garden-guard/src/art/plants.ts
  var PEA = { light: "#c4f78a", base: "#5cbf2a", dark: "#24600f", hole: "#143a08" };
  var SNOW = { light: "#e3f7ff", base: "#62b6ee", dark: "#1d5689", hole: "#0f3150" };
  var REPEAT = { light: "#a6e874", base: "#3c9a21", dark: "#1b500d", hole: "#0e2e07" };
  function leaf(ctx, x, y, angle, len, w, light = "#86d957", dark = "#3a8c1f", edge = "#255a12") {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(len * 0.45, -w, len, 0);
    ctx.quadraticCurveTo(len * 0.5, w * 0.9, 0, 0);
    paint(ctx, linear(ctx, 0, -w, 0, w, [[0, light], [1, dark]]), C(edge), 2);
    ctx.beginPath();
    ctx.moveTo(2, 0);
    ctx.quadraticCurveTo(len * 0.5, -w * 0.18, len * 0.88, 0);
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = C(edge);
    ctx.stroke();
    ctx.restore();
  }
  function stem(ctx, pts, dark, light, w = 8) {
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(pts[0], pts[1]);
    ctx.bezierCurveTo(pts[2], pts[3], pts[4], pts[5], pts[6], pts[7]);
    ctx.lineWidth = w;
    ctx.strokeStyle = C(dark);
    ctx.stroke();
    ctx.lineWidth = w - 3.5;
    ctx.strokeStyle = C(light);
    ctx.stroke();
  }
  function eye(ctx, x, y, rx, ry, px, py, pr = 3.2) {
    ellipse(ctx, x, y, rx, ry);
    paint(ctx, C("#ffffff"), C("#1a1a1a"), 1.6);
    circle(ctx, x + px, y + py, pr);
    paint(ctx, C("#141414"));
    circle(ctx, x + px + pr * 0.35, y + py - pr * 0.4, pr * 0.32);
    paint(ctx, "#ffffff");
  }
  function peaHead(ctx, hx, hy, s, pal, recoil, crest, brow = false) {
    ctx.save();
    ctx.translate(hx, hy);
    ctx.scale(s, s);
    if (crest === "leaf") leaf(ctx, -15, -12, -2.5, 22, 7);
    if (crest === "double") {
      leaf(ctx, -15, -10, -2.3, 24, 8);
      leaf(ctx, -16, -2, -2.75, 22, 7);
    }
    if (crest === "ice") {
      for (const [ax, ay, a, l] of [
        [-14, -12, -2.4, 18],
        [-18, -2, -2.9, 15],
        [-8, -18, -1.95, 14]
      ]) {
        ctx.save();
        ctx.translate(ax, ay);
        ctx.rotate(a);
        ctx.beginPath();
        ctx.moveTo(0, -4);
        ctx.lineTo(l, 0);
        ctx.lineTo(0, 4);
        ctx.closePath();
        paint(ctx, linear(ctx, 0, 0, l, 0, [[0, "#bfe8ff"], [1, "#ffffff"]]), C("#3d7fb3"), 1.5);
        ctx.restore();
      }
    }
    const len = 30 - recoil * 8;
    rrect(ctx, 5, -12, len + 2, 22, 10);
    paint(ctx, linear(ctx, 0, -12, 0, 10, [[0, pal.light], [1, pal.base]]), C(pal.dark), 2.5);
    circle(ctx, 0, 0, 21);
    paint(ctx, radial(ctx, -7, -9, 2, 0, 0, 23, [[0, pal.light], [0.65, pal.base], [1, pal.dark]]), C(pal.dark), 2.5);
    ellipse(ctx, 6 + len, -1, 6.5 + recoil * 1.5, 11.5);
    paint(ctx, C(pal.base), C(pal.dark), 2.2);
    ellipse(ctx, 7 + len, -1, 3.6, 7.4);
    paint(ctx, C(pal.hole));
    eye(ctx, 3, -7, 6.5, 8, 2.4, 1, 3.3);
    if (brow) {
      ctx.beginPath();
      ctx.moveTo(-5, -18);
      ctx.lineTo(11, -13);
      ctx.lineWidth = 3.4;
      ctx.lineCap = "round";
      ctx.strokeStyle = C(pal.dark);
      ctx.stroke();
    }
    ctx.restore();
  }
  function shooter(ctx, x, y, v, pal, crest, brow = false) {
    const sway = Math.sin(v.t * 2.3) * 1.6;
    const recoil = clamp((v.anim ?? 0) / 0.2, 0, 1);
    const hx = x + 6 + sway - recoil * 3;
    const hy = y - 60 + Math.cos(v.t * 2.3) * 0.8;
    leaf(ctx, x - 2, y - 3, Math.PI + 0.3, 27, 9);
    leaf(ctx, x + 2, y - 3, -0.3, 27, 9);
    stem(ctx, [x, y - 4, x - 7, y - 22, hx - 12, hy + 30, hx - 4, hy + 12], pal.dark, pal.base);
    peaHead(ctx, hx, hy, 1, pal, recoil, crest, brow);
  }
  function threepeater(ctx, x, y, v) {
    const sway = Math.sin(v.t * 2.1) * 1.5;
    const recoil = clamp((v.anim ?? 0) / 0.2, 0, 1);
    leaf(ctx, x - 2, y - 3, Math.PI + 0.3, 27, 9);
    leaf(ctx, x + 2, y - 3, -0.3, 27, 9);
    const heads = [
      { x: x + 4 + sway, y: y - 92 },
      { x: x - 22 + sway * 0.6, y: y - 56 },
      { x: x + 24 + sway * 0.8, y: y - 50 }
    ];
    stem(ctx, [x, y - 4, x, y - 20, x, y - 30, x, y - 38], PEA.dark, PEA.base, 9);
    for (const h of heads) stem(ctx, [x, y - 36, x, y - 46, h.x - 10, h.y + 22, h.x - 4, h.y + 10], PEA.dark, PEA.base, 7);
    for (const h of heads) peaHead(ctx, h.x - recoil * 2, h.y, 0.72, PEA, recoil, "leaf");
  }
  function sunflower(ctx, x, y, v) {
    const sw = Math.sin(v.t * 1.8);
    const hx = x + sw * 3;
    const hy = y - 66 + Math.abs(sw) * 1.2;
    leaf(ctx, x - 2, y - 4, Math.PI + 0.25, 28, 10);
    leaf(ctx, x + 2, y - 4, -0.25, 28, 10);
    leaf(ctx, x, y - 30, -0.7, 20, 7);
    stem(ctx, [x, y - 4, x - 2, y - 26, hx + 2, hy + 34, hx, hy + 14], "#2e6e17", "#56b02c");
    const glow = clamp(v.anim ?? 0, 0, 1);
    if (glow > 0) {
      circle(ctx, hx, hy, 56);
      paint(ctx, radial(ctx, hx, hy, 10, hx, hy, 56, [[0, "#fff3a0"], [1, "#fff3a000"]]));
    }
    ctx.save();
    ctx.translate(hx, hy);
    ctx.rotate(sw * 0.07);
    for (let i = 0; i < 16; i++) {
      ctx.save();
      ctx.rotate(i / 16 * TAU + v.t * 0.05);
      ellipse(ctx, 0, -27, 7.6, 13.5);
      paint(ctx, linear(ctx, 0, -41, 0, -14, [[0, "#ffef6b"], [1, "#ffb41a"]]), C("#c98300"), 1.6);
      ctx.restore();
    }
    circle(ctx, 0, 0, 20);
    paint(ctx, radial(ctx, -5, -6, 2, 0, 0, 21, [[0, "#d99a4a"], [0.7, "#9b5a1d"], [1, "#7a4312"]]), C("#4f2a0b"), 2.2);
    ctx.fillStyle = C("#7a4312");
    for (let i = 0; i < 9; i++) {
      const a = i * 2.4;
      const r = 6 + i % 3 * 4;
      circle(ctx, Math.cos(a) * r, Math.sin(a) * r + 2, 1.2);
      ctx.fill();
    }
    const blink = Math.sin(v.t * 0.9) > 0.97;
    if (blink) {
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = C("#2a1606");
      ctx.beginPath();
      ctx.moveTo(-10, -4);
      ctx.lineTo(-4, -4);
      ctx.moveTo(4, -4);
      ctx.lineTo(10, -4);
      ctx.stroke();
    } else {
      for (const ex of [-7, 7]) {
        ellipse(ctx, ex, -4, 3.3, 4.8);
        paint(ctx, C("#2a1606"));
        circle(ctx, ex + 1, -6, 1.3);
        paint(ctx, "#ffffff");
      }
    }
    ctx.beginPath();
    ctx.arc(0, 2, 8.5, 0.18 * Math.PI, 0.82 * Math.PI);
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.strokeStyle = C("#2a1606");
    ctx.stroke();
    for (const cx of [-13, 13]) {
      ellipse(ctx, cx, 5, 3.6, 2.2);
      paint(ctx, "rgba(255,110,80,0.45)");
    }
    ctx.restore();
  }
  var NUT = ["#f3c98a", "#c88a44", "#9a5e26", "#5b3311"];
  var NUT_RED = ["#ffb09a", "#e0553a", "#a8291a", "#5a0f08"];
  function nut(ctx, x, cy, rx, ry, v, pal = NUT, rolling = false) {
    const hp = v.hp ?? 1;
    ctx.save();
    ctx.translate(x, cy);
    if (v.rot) ctx.rotate(v.rot);
    ellipse(ctx, 0, 0, rx, ry);
    paint(ctx, radial(ctx, -rx * 0.35, -ry * 0.42, 3, 0, 0, Math.max(rx, ry) * 1.05, [[0, pal[0]], [0.62, pal[1]], [1, pal[2]]]), C(pal[3]), 3);
    ctx.lineWidth = 1.7;
    ctx.strokeStyle = C(pal[2]);
    ctx.beginPath();
    ctx.arc(-rx * 0.5, ry * 0.15, rx * 0.35, 0.3, 1.6);
    ctx.moveTo(rx * 0.55, ry * 0.42);
    ctx.arc(rx * 0.35, ry * 0.42, rx * 0.2, 0, 1.4);
    ctx.moveTo(-rx * 0.2, ry * 0.7);
    ctx.lineTo(rx * 0.05, ry * 0.62);
    ctx.stroke();
    if (hp < 0.67) {
      ctx.lineWidth = 2;
      ctx.strokeStyle = C(pal[3]);
      ctx.beginPath();
      ctx.moveTo(rx * 0.25, -ry * 0.98);
      ctx.lineTo(rx * 0.1, -ry * 0.7);
      ctx.lineTo(rx * 0.32, -ry * 0.5);
      ctx.lineTo(rx * 0.18, -ry * 0.3);
      ctx.stroke();
    }
    if (hp < 0.34) {
      ctx.beginPath();
      ctx.moveTo(-rx * 0.95, -ry * 0.1);
      ctx.lineTo(-rx * 0.6, ry * 0.05);
      ctx.lineTo(-rx * 0.7, ry * 0.3);
      ctx.lineTo(-rx * 0.4, ry * 0.45);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(rx * 0.55, -ry * 0.82);
      ctx.lineTo(rx * 0.95, -ry * 0.3);
      ctx.lineTo(rx * 0.68, -ry * 0.5);
      ctx.closePath();
      paint(ctx, C(pal[3]));
    }
    const ey = -ry * 0.22;
    const look = rolling ? 0 : 2.4;
    if (hp < 0.34) {
      eye(ctx, rx * 0.08, ey, 6, 7.5, look, 2, 3);
      eye(ctx, rx * 0.52, ey, 6, 6.5, look, 2, 3);
      ctx.lineWidth = 2.6;
      ctx.strokeStyle = C(pal[3]);
      ctx.beginPath();
      ctx.moveTo(rx * 0.08 - 7, ey - 13);
      ctx.lineTo(rx * 0.08 + 5, ey - 9);
      ctx.moveTo(rx * 0.52 - 4, ey - 9);
      ctx.lineTo(rx * 0.52 + 7, ey - 13);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(rx * 0.3, ey + 22, 6, 1.15 * Math.PI, 1.85 * Math.PI);
      ctx.stroke();
    } else {
      eye(ctx, rx * 0.08, ey, 6.5, 8.5, look, 0.5, 3.3);
      eye(ctx, rx * 0.52, ey, 6.5, 8.5, look, 0.5, 3.3);
      if (hp < 0.67) {
        ctx.lineWidth = 2.2;
        ctx.strokeStyle = C(pal[3]);
        ctx.beginPath();
        ctx.moveTo(rx * 0.08 - 6, ey - 12);
        ctx.lineTo(rx * 0.08 + 6, ey - 14);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
  function cherry(ctx, x, y, v) {
    const fuse = v.state === "fuse" ? v.stateT ?? 0 : 0;
    const s = 1 + fuse * 0.32;
    const jit = fuse > 0 ? Math.sin(v.t * 70) * fuse * 3 : 0;
    ctx.save();
    ctx.translate(x + jit, y);
    ctx.scale(s, s);
    ctx.lineCap = "round";
    ctx.lineWidth = 3.4;
    ctx.strokeStyle = C("#3d7a1f");
    ctx.beginPath();
    ctx.moveTo(-13, -38);
    ctx.quadraticCurveTo(-8, -66, 3, -76);
    ctx.moveTo(15, -44);
    ctx.quadraticCurveTo(12, -64, 3, -76);
    ctx.stroke();
    leaf(ctx, 3, -76, -0.5, 22, 8);
    const red = fuse > 0.5 ? "#ff2a2a" : "#ff7b7b";
    for (const [cx, cy] of [
      [-14, -24],
      [15, -30]
    ]) {
      circle(ctx, cx, cy, 17.5);
      paint(ctx, radial(ctx, cx - 6, cy - 7, 2, cx, cy, 19, [[0, red], [0.7, "#d01b2b"], [1, "#93101c"]]), C("#5e0610"), 2.5);
      ellipse(ctx, cx - 7, cy - 8, 4, 2.4, -0.6);
      paint(ctx, "rgba(255,255,255,0.75)");
      ctx.lineWidth = 2.6;
      ctx.strokeStyle = C("#3a0208");
      ctx.beginPath();
      ctx.moveTo(cx - 10, cy - 8);
      ctx.lineTo(cx - 2, cy - 4);
      ctx.moveTo(cx + 9, cy - 8);
      ctx.lineTo(cx + 2, cy - 4);
      ctx.stroke();
      circle(ctx, cx - 5, cy, 2.4);
      paint(ctx, C("#1a0204"));
      circle(ctx, cx + 5, cy, 2.4);
      paint(ctx, C("#1a0204"));
      ctx.beginPath();
      ctx.arc(cx, cy + 10, 4.5, 1.15 * Math.PI, 1.85 * Math.PI);
      ctx.stroke();
    }
    ctx.restore();
  }
  function jalapeno(ctx, x, y, v) {
    const fuse = v.state === "fuse" ? v.stateT ?? 0 : 0;
    const sx = 1 + fuse * 0.5;
    const sy = 1 - fuse * 0.15;
    const jit = fuse > 0 ? Math.sin(v.t * 70) * fuse * 3 : Math.sin(v.t * 2) * 1.2;
    ctx.save();
    ctx.translate(x + jit, y);
    ctx.scale(sx, sy);
    ctx.beginPath();
    ctx.moveTo(0, -86);
    ctx.bezierCurveTo(20, -84, 18, -40, 10, -14);
    ctx.quadraticCurveTo(4, 2, -4, -4);
    ctx.bezierCurveTo(-18, -26, -20, -80, 0, -86);
    paint(ctx, linear(ctx, -16, 0, 18, 0, [[0, "#ff6b4f"], [0.45, "#e02719"], [1, "#9e1208"]]), C("#560904"), 2.6);
    ellipse(ctx, -7, -62, 3, 12, 0.1);
    paint(ctx, "rgba(255,255,255,0.45)");
    ctx.lineCap = "round";
    ctx.lineWidth = 4;
    ctx.strokeStyle = C("#3f8a1e");
    ctx.beginPath();
    ctx.moveTo(0, -86);
    ctx.quadraticCurveTo(4, -100, 14, -98);
    ctx.stroke();
    ctx.lineWidth = 2.6;
    ctx.strokeStyle = C("#3a0705");
    ctx.beginPath();
    ctx.moveTo(-9, -60);
    ctx.lineTo(-2, -55);
    ctx.moveTo(11, -60);
    ctx.lineTo(4, -55);
    ctx.stroke();
    circle(ctx, -3, -51, 2.6);
    paint(ctx, C("#1a0202"));
    circle(ctx, 6, -51, 2.6);
    paint(ctx, C("#1a0202"));
    rrect(ctx, -5, -42, 12, 6, 2);
    paint(ctx, C("#3a0705"));
    ctx.restore();
  }
  function potato(ctx, x, y, v) {
    const armed = v.state === "armed";
    if (!armed) {
      ellipse(ctx, x, y - 6, 26, 10);
      paint(ctx, radial(ctx, x - 6, y - 10, 2, x, y - 6, 26, [[0, "#a87445"], [1, "#6b4422"]]), C("#4a2c12"), 2);
      ellipse(ctx, x, y - 12, 13, 6);
      paint(ctx, C("#c8954f"), C("#6b4422"), 1.8);
      const grow = clamp((v.stateT ?? 0) / 15, 0, 1);
      ctx.lineWidth = 2.4;
      ctx.strokeStyle = C("#3f8a1e");
      ctx.beginPath();
      ctx.moveTo(x, y - 16);
      ctx.lineTo(x + 1, y - 22 - grow * 8);
      ctx.stroke();
      circle(ctx, x + 1, y - 24 - grow * 8, 2.5 + grow * 1.5);
      paint(ctx, C(grow > 0.95 ? "#ff4040" : "#8a2020"));
      return;
    }
    const pop = Math.sin(v.t * 3) * 1;
    ellipse(ctx, x, y - 22 + pop, 25, 21);
    paint(ctx, radial(ctx, x - 8, y - 30, 3, x, y - 22, 26, [[0, "#f0c886"], [0.7, "#c8954f"], [1, "#9a6a30"]]), C("#5e3c14"), 2.5);
    ctx.fillStyle = C("#9a6a30");
    for (const [dx, dy] of [
      [-12, -14],
      [10, -10],
      [-4, -32],
      [14, -26]
    ]) {
      circle(ctx, x + dx, y + dy + pop, 1.8);
      ctx.fill();
    }
    eye(ctx, x - 3, y - 26 + pop, 4.5, 5.5, 1.5, 0.5, 2.3);
    eye(ctx, x + 9, y - 26 + pop, 4.5, 5.5, 1.5, 0.5, 2.3);
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = C("#5a5a5a");
    ctx.beginPath();
    ctx.moveTo(x + 1, y - 42 + pop);
    ctx.lineTo(x + 3, y - 55 + pop);
    ctx.stroke();
    const blink = Math.floor(v.t * 3) % 2 === 0;
    if (blink) {
      circle(ctx, x + 3, y - 58 + pop, 11);
      paint(ctx, radial(ctx, x + 3, y - 58 + pop, 1, x + 3, y - 58 + pop, 11, [[0, "#ff4a4aaa"], [1, "#ff4a4a00"]]));
    }
    circle(ctx, x + 3, y - 58 + pop, 4.5);
    paint(ctx, C(blink ? "#ff3a3a" : "#9a1c1c"), C("#3a0a0a"), 1.4);
    ellipse(ctx, x, y - 4, 32, 9);
    paint(ctx, radial(ctx, x, y - 6, 2, x, y - 4, 32, [[0, "#9a6a3e"], [1, "#5e3a1a"]]));
  }
  function chomper(ctx, x, y, v) {
    const st = v.state ?? "ready";
    const sway = Math.sin(v.t * 1.7) * 2;
    leaf(ctx, x - 2, y - 3, Math.PI + 0.35, 30, 10);
    leaf(ctx, x + 2, y - 3, -0.35, 30, 10);
    leaf(ctx, x - 2, y - 6, Math.PI + 0.9, 24, 8);
    const hx = x + 14 + sway;
    const hy = y - 72;
    stem(ctx, [x - 2, y - 4, x - 14, y - 30, hx - 30, hy + 30, hx - 16, hy + 10], "#2e6e17", "#56b02c", 9);
    ctx.save();
    ctx.translate(hx, hy);
    const purple = radial(ctx, -8, -12, 3, 0, 0, 38, [[0, "#e3a3ff"], [0.6, "#a548d6"], [1, "#6a1f99"]]);
    if (st === "chew" || st === "swallow") {
      const chew = st === "chew" ? Math.sin(v.t * 9) * 3 : Math.sin(clamp((v.stateT ?? 0) / 0.6, 0, 1) * Math.PI) * 8;
      ellipse(ctx, 0, 0, 32 + chew * 0.5, 26 - chew * 0.3);
      paint(ctx, purple, C("#3e0f5a"), 2.8);
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = C("#3e0f5a");
      ctx.beginPath();
      ctx.moveTo(-6, 6);
      for (let i = 0; i < 6; i++) ctx.lineTo(-2 + i * 6, i % 2 ? 2 : 8);
      ctx.stroke();
      ellipse(ctx, 6, 14 + chew * 0.4, 16, 6);
      paint(ctx, C("#8d34bd"));
    } else {
      const bite = st === "bite" ? clamp((v.stateT ?? 0) / 0.32, 0, 1) : 0;
      const open = st === "bite" ? 1.25 * (1 - bite * bite) : 0.85 + Math.sin(v.t * 3) * 0.12;
      const pivot = -20;
      ellipse(ctx, 6, 2, 30, 18 * open + 4);
      paint(ctx, C("#5a0e2e"));
      ctx.save();
      ctx.translate(pivot, 0);
      ctx.rotate(-open * 0.5);
      ctx.translate(-pivot, 0);
      ctx.beginPath();
      ctx.ellipse(4, 0, 36, 28, 0, Math.PI, TAU);
      ctx.closePath();
      paint(ctx, purple, C("#3e0f5a"), 2.8);
      ctx.fillStyle = C("#ffffff");
      ctx.strokeStyle = C("#3e0f5a");
      ctx.lineWidth = 1.2;
      for (let i = 0; i < 6; i++) {
        const tx = -18 + i * 9;
        ctx.beginPath();
        ctx.moveTo(tx, 0);
        ctx.lineTo(tx + 4, 9);
        ctx.lineTo(tx + 8, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(-18 + i * 12, -24 + Math.abs(i - 1.5) * 2);
        ctx.lineTo(-14 + i * 12, -33 + Math.abs(i - 1.5) * 2);
        ctx.lineTo(-10 + i * 12, -24 + Math.abs(i - 1.5) * 2);
        ctx.closePath();
        paint(ctx, C("#f2e9ff"), C("#3e0f5a"), 1.2);
      }
      ctx.restore();
      ctx.save();
      ctx.translate(pivot, 0);
      ctx.rotate(open * 0.35);
      ctx.translate(-pivot, 0);
      ctx.beginPath();
      ctx.ellipse(4, 0, 32, 18, 0, 0, Math.PI);
      ctx.closePath();
      paint(ctx, purple, C("#3e0f5a"), 2.8);
      ctx.fillStyle = C("#ffffff");
      for (let i = 0; i < 5; i++) {
        const tx = -14 + i * 9;
        ctx.beginPath();
        ctx.moveTo(tx, 1);
        ctx.lineTo(tx + 4, -7);
        ctx.lineTo(tx + 8, 1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    }
    ctx.restore();
  }
  function squash(ctx, x, y, v) {
    const st = v.state ?? "idle";
    let sy = 1;
    let sx = 1;
    if (st === "aim") {
      sy = 1 - Math.sin(clamp((v.stateT ?? 0) / 0.45, 0, 1) * Math.PI) * 0.12;
      sx = 2 - sy;
    }
    if (st === "done") {
      sy = 0.62;
      sx = 1.25;
    }
    const look = clamp(v.lookX ?? 3, -5, 5);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(sx, sy);
    rrect(ctx, -27, -78, 54, 76, 24);
    paint(ctx, linear(ctx, -27, 0, 27, 0, [[0, "#6bab32"], [0.45, "#a8dc64"], [1, "#4d8a22"]]), C("#2b5a12"), 3);
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = C("#4d8a22");
    ctx.beginPath();
    ctx.moveTo(-12, -74);
    ctx.quadraticCurveTo(-20, -40, -12, -6);
    ctx.moveTo(12, -74);
    ctx.quadraticCurveTo(20, -40, 12, -6);
    ctx.stroke();
    rrect(ctx, -5, -88, 10, 12, 3);
    paint(ctx, C("#7a5a2a"), C("#3e2a10"), 1.6);
    eye(ctx, -9, -52, 7, 7, look, 1, 3.4);
    eye(ctx, 10, -52, 7, 7, look, 1, 3.4);
    ctx.lineCap = "round";
    ctx.lineWidth = 4;
    ctx.strokeStyle = C("#1f3d0c");
    ctx.beginPath();
    ctx.moveTo(-18, -66);
    ctx.lineTo(-3, -59);
    ctx.moveTo(19, -66);
    ctx.lineTo(4, -59);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-9, -32);
    ctx.quadraticCurveTo(0, -38, 9, -32);
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  }
  function spikeweed(ctx, x, y, v) {
    const poke = clamp((v.anim ?? 0) / 0.25, 0, 1) * 5;
    ellipse(ctx, x, y - 6, 40, 10);
    paint(ctx, radial(ctx, x, y - 10, 3, x, y - 6, 40, [[0, "#86b84a"], [1, "#4a7422"]]), C("#2d4a14"), 2);
    for (let i = -3; i <= 3; i++) {
      const sx = x + i * 10.5;
      const h = 12 + (Math.abs(i) % 2 ? 0 : 4) + poke;
      ctx.beginPath();
      ctx.moveTo(sx - 4.5, y - 8);
      ctx.lineTo(sx, y - 8 - h);
      ctx.lineTo(sx + 4.5, y - 8);
      ctx.closePath();
      paint(ctx, linear(ctx, sx - 4, 0, sx + 4, 0, [[0, "#f4f6f8"], [1, "#9aa2aa"]]), C("#5b636b"), 1.3);
    }
    for (const dx of [-30, 30]) {
      ellipse(ctx, x + dx, y - 9, 8, 4, dx > 0 ? -0.4 : 0.4);
      paint(ctx, C("#6c9e36"), C("#2d4a14"), 1.4);
    }
  }
  function flame(ctx, x, y, s, t) {
    const layers = [
      ["#ff3d14", 1],
      ["#ff9a1f", 0.72],
      ["#ffe86a", 0.44]
    ];
    circle(ctx, x, y - 26 * s, 60 * s);
    paint(ctx, radial(ctx, x, y - 26 * s, 4, x, y - 26 * s, 60 * s, [[0, "#ff9a3c66"], [1, "#ff9a3c00"]]));
    layers.forEach(([col, k], i) => {
      const w = 23 * s * k;
      const h = 60 * s * k;
      const tip = Math.sin(t * 9 + i * 1.7) * 6 * s;
      ctx.beginPath();
      ctx.moveTo(x - w, y);
      ctx.bezierCurveTo(x - w * 1.1, y - h * 0.5, x - w * 0.3 + tip, y - h * 0.7, x + tip, y - h - Math.sin(t * 7 + i) * 5 * s);
      ctx.bezierCurveTo(x + w * 0.4 + tip, y - h * 0.6, x + w * 1.1, y - h * 0.45, x + w, y);
      ctx.quadraticCurveTo(x, y + 6 * s * k, x - w, y);
      paint(ctx, C(col));
    });
  }
  function torchwood(ctx, x, y, v) {
    ctx.beginPath();
    ctx.moveTo(x - 30, y - 2);
    ctx.lineTo(x - 24, y - 64);
    ctx.lineTo(x + 24, y - 64);
    ctx.lineTo(x + 30, y - 2);
    ctx.quadraticCurveTo(x, y + 6, x - 30, y - 2);
    paint(ctx, linear(ctx, x - 30, 0, x + 30, 0, [[0, "#6a3812"], [0.4, "#a8662e"], [1, "#5c2f0e"]]), C("#331905"), 2.8);
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = C("#4a2508");
    ctx.beginPath();
    for (const dx of [-16, -4, 10, 20]) {
      ctx.moveTo(x + dx, y - 58);
      ctx.quadraticCurveTo(x + dx + 3, y - 30, x + dx - 1, y - 6);
    }
    ctx.stroke();
    ellipse(ctx, x, y - 64, 24, 8);
    paint(ctx, C("#d49a58"), C("#5c2f0e"), 2);
    ellipse(ctx, x, y - 64, 14, 4.5);
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = C("#8a5424");
    ctx.stroke();
    for (const ex of [-10, 10]) {
      ellipse(ctx, x + ex, y - 40, 6, 7);
      paint(ctx, C("#2a1204"));
      circle(ctx, x + ex + 1.5, y - 40, 2.6);
      paint(ctx, C("#ffb23a"));
    }
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.strokeStyle = C("#2a1204");
    ctx.beginPath();
    ctx.moveTo(x - 17, y - 51);
    ctx.lineTo(x - 5, y - 47);
    ctx.moveTo(x + 17, y - 51);
    ctx.lineTo(x + 5, y - 47);
    ctx.stroke();
    ellipse(ctx, x, y - 24, 9, 5);
    paint(ctx, C("#2a1204"));
    ellipse(ctx, x, y - 23, 5, 2.5);
    paint(ctx, C("#ff7a1a"));
    flame(ctx, x, y - 64, 0.8, v.t);
  }
  function cabbage(ctx, x, y, v) {
    const a = v.anim ?? 0;
    const rest = Math.PI + 0.55;
    let angle = rest;
    if (a > 0) {
      const p = 1 - a / 0.5;
      angle = p < 0.3 ? rest + (-0.45 - rest) * (p / 0.3) : -0.45 + (rest + 0.45) * ((p - 0.3) / 0.7);
    }
    leaf(ctx, x - 4, y - 4, Math.PI + 0.25, 28, 10);
    leaf(ctx, x + 4, y - 4, -0.25, 28, 10);
    const by = y - 28 + Math.sin(v.t * 2) * 1;
    const px = x - 2;
    const py = by - 18;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(angle);
    ctx.lineCap = "round";
    ctx.lineWidth = 6;
    ctx.strokeStyle = C("#2d5e14");
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(34, 0);
    ctx.stroke();
    ctx.lineWidth = 3;
    ctx.strokeStyle = C("#5fae2e");
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(38, 0, 9, 0, Math.PI);
    paint(ctx, C("#6b8e2a"), C("#2d5e14"), 2);
    if (v.loaded !== false) {
      circle(ctx, 38, -5, 8);
      paint(ctx, radial(ctx, 35, -8, 1, 38, -5, 9, [[0, "#e6ffb8"], [1, "#86c94a"]]), C("#3a7a1a"), 1.5);
    }
    ctx.restore();
    circle(ctx, x, by, 24);
    paint(ctx, radial(ctx, x - 8, by - 9, 3, x, by, 25, [[0, "#dcff9e"], [0.6, "#92d651"], [1, "#4f9a26"]]), C("#2d5e14"), 2.6);
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = C("#5fae2e");
    ctx.beginPath();
    ctx.arc(x - 18, by + 4, 16, -0.9, 0.6);
    ctx.moveTo(x + 22, by + 8);
    ctx.arc(x + 18, by + 4, 16, Math.PI - 0.6, Math.PI + 0.9, false);
    ctx.stroke();
    eye(ctx, x - 4, by - 2, 5, 6, 2, 0.5, 2.6);
    eye(ctx, x + 9, by - 2, 5, 6, 2, 0.5, 2.6);
    ctx.beginPath();
    ctx.arc(x + 3, by + 8, 5, 0.2 * Math.PI, 0.8 * Math.PI);
    ctx.lineWidth = 2;
    ctx.strokeStyle = C("#1d3d0a");
    ctx.stroke();
  }
  function drawPlant(ctx, id, x, y, v) {
    switch (id) {
      case "peashooter":
        return shooter(ctx, x, y, v, PEA, "leaf");
      case "snowpea":
        return shooter(ctx, x, y, v, SNOW, "ice");
      case "repeater":
        return shooter(ctx, x, y, v, REPEAT, "double", true);
      case "threepeater":
        return threepeater(ctx, x, y, v);
      case "sunflower":
        return sunflower(ctx, x, y, v);
      case "wallnut":
        return nut(ctx, x, y - 38, 30, 38, v);
      case "tallnut":
        return nut(ctx, x, y - 62, 31, 62, v);
      case "bowlnut":
        return nut(ctx, x, y - 30, 30, 30, v, NUT, true);
      case "bombnut":
        return nut(ctx, x, y - 30, 30, 30, v, NUT_RED, true);
      case "giantnut":
        return nut(ctx, x, y - 60, 60, 60, v, NUT, true);
      case "cherry":
        return cherry(ctx, x, y, v);
      case "jalapeno":
        return jalapeno(ctx, x, y, v);
      case "potato":
        return potato(ctx, x, y, v);
      case "chomper":
        return chomper(ctx, x, y, v);
      case "squash":
        return squash(ctx, x, y, v);
      case "spikeweed":
        return spikeweed(ctx, x, y, v);
      case "torchwood":
        return torchwood(ctx, x, y, v);
      case "cabbage":
        return cabbage(ctx, x, y, v);
    }
  }
  function plantShadow(ctx, x, y, w = 30) {
    ellipse(ctx, x, y, w, w * 0.28);
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.fill();
  }

  // games-src/garden-guard/src/art/zombies.ts
  var BASE = {
    coat: "#7d6850",
    coatDark: "#5a4a38",
    shirt: "#ece7da",
    tie: "#b3262a",
    pants: "#5b4a36",
    pantsDark: "#3e3224",
    skin: "#aac08e",
    skinDark: "#7d9465",
    shoe: "#2b2420",
    scale: 1,
    head: 1
  };
  var OUTFITS = {
    basic: BASE,
    flag: BASE,
    cone: BASE,
    bucket: BASE,
    door: { ...BASE, coat: "#6f6a5c", coatDark: "#4f4b40" },
    paper: { ...BASE, coat: "#8a7a62", coatDark: "#665944", tie: "#3a5a8a", pants: "#4a5768", pantsDark: "#323c49" },
    pole: { ...BASE, coat: "#e6e1d6", coatDark: "#b8b1a3", shirt: "#e6e1d6", tie: null, pants: "#c23b3b", pantsDark: "#8a2525" },
    football: { ...BASE, coat: "#c8242c", coatDark: "#8f1820", shirt: "#c8242c", tie: null, pants: "#d9d4c8", pantsDark: "#a9a397", scale: 1.08 },
    garg: { ...BASE, coat: "#c9b89a", coatDark: "#9c8c70", shirt: "#c9b89a", tie: null, pants: "#55678a", pantsDark: "#3b4a66", skin: "#9fb584", skinDark: "#748a5d", scale: 1.72, head: 0.85 },
    imp: { ...BASE, coat: "#d8cfb8", coatDark: "#aaa08a", shirt: "#d8cfb8", tie: null, pants: "#6b5a44", pantsDark: "#4a3e2e", scale: 0.62, head: 1.3 }
  };
  function limb(ctx, x, y, a1, l1, a2, l2, w, color, edge) {
    const kx = x + Math.sin(a1) * l1;
    const ky = y + Math.cos(a1) * l1;
    const fx = kx + Math.sin(a2) * l2;
    const fy = ky + Math.cos(a2) * l2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(kx, ky);
    ctx.lineTo(fx, fy);
    ctx.lineWidth = w + 3.4;
    ctx.strokeStyle = C(edge);
    ctx.stroke();
    ctx.lineWidth = w;
    ctx.strokeStyle = C(color);
    ctx.stroke();
    return { kx, ky, fx, fy };
  }
  function hand(ctx, p, o, a) {
    circle(ctx, p.x, p.y, 6);
    paint(ctx, C(o.skin), C("#3d4a30"), 1.8);
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.strokeStyle = C(o.skinDark);
    ctx.beginPath();
    for (let i = -1; i <= 1; i++) {
      const fa = a + i * 0.35;
      ctx.moveTo(p.x + Math.sin(fa) * 4, p.y + Math.cos(fa) * 4);
      ctx.lineTo(p.x + Math.sin(fa) * 10, p.y + Math.cos(fa) * 10);
    }
    ctx.stroke();
  }
  function torso(ctx, o, id) {
    ctx.beginPath();
    ctx.moveTo(-19, -100);
    ctx.quadraticCurveTo(-2, -107, 14, -100);
    ctx.lineTo(18, -60);
    ctx.quadraticCurveTo(17, -42, 12, -38);
    ctx.lineTo(-16, -40);
    ctx.quadraticCurveTo(-23, -70, -19, -100);
    paint(ctx, linear(ctx, -20, 0, 18, 0, [[0, o.coat], [0.7, o.coat], [1, o.coatDark]]), C("#2a2219"), 2.6);
    if (id === "pole") {
      ctx.lineWidth = 4;
      ctx.strokeStyle = C("#c23b3b");
      ctx.beginPath();
      ctx.moveTo(-17, -98);
      ctx.lineTo(-14, -42);
      ctx.moveTo(12, -100);
      ctx.lineTo(15, -40);
      ctx.stroke();
      return;
    }
    if (id === "football") {
      ctx.font = `900 18px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = C("#ffffff");
      ctx.fillText("13", -2, -70);
      return;
    }
    if (id === "garg" || id === "imp") {
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = C(o.coatDark);
      ctx.beginPath();
      ctx.moveTo(-8, -60);
      ctx.lineTo(-2, -52);
      ctx.lineTo(4, -60);
      ctx.moveTo(6, -84);
      ctx.lineTo(10, -78);
      ctx.stroke();
      if (id === "garg") {
        rrect(ctx, -17, -64, 32, 26, 4);
        paint(ctx, C(o.pants), C("#2a2219"), 2);
        ctx.lineWidth = 4;
        ctx.strokeStyle = C(o.pants);
        ctx.beginPath();
        ctx.moveTo(-12, -64);
        ctx.lineTo(-14, -98);
        ctx.moveTo(10, -64);
        ctx.lineTo(10, -98);
        ctx.stroke();
      }
      return;
    }
    ctx.beginPath();
    ctx.moveTo(-13, -101);
    ctx.lineTo(3, -103);
    ctx.lineTo(-4, -74);
    ctx.closePath();
    paint(ctx, C(o.shirt), C("#5a5448"), 1.4);
    if (o.tie) {
      ctx.beginPath();
      ctx.moveTo(-7, -100);
      ctx.lineTo(-1, -100);
      ctx.lineTo(2, -84);
      ctx.lineTo(-3, -68);
      ctx.lineTo(-8, -84);
      ctx.closePath();
      paint(ctx, C(o.tie), C("#4a0c0e"), 1.4);
    }
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = C(o.coatDark);
    ctx.beginPath();
    ctx.moveTo(-13, -101);
    ctx.lineTo(-8, -76);
    ctx.moveTo(3, -103);
    ctx.lineTo(-1, -78);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(6, -64);
    ctx.lineTo(13, -60);
    ctx.lineTo(9, -54);
    ctx.closePath();
    paint(ctx, C(o.coatDark));
    for (const by of [-62, -51]) {
      circle(ctx, -12, by, 1.8);
      paint(ctx, C("#2a2219"));
    }
  }
  function headwear(ctx, v, hx, hy) {
    const r = v.armor;
    if (r <= 0) return;
    switch (v.armorKind) {
      case "cone": {
        const tipY = r < 0.66 ? hy - 50 : hy - 64;
        ctx.beginPath();
        ctx.moveTo(hx - 22, hy - 13);
        if (r < 0.66) {
          ctx.lineTo(hx - 8, tipY);
          ctx.lineTo(hx - 3, tipY + 5);
          ctx.lineTo(hx + 3, tipY - 2);
          ctx.lineTo(hx + 8, tipY + 3);
        } else ctx.lineTo(hx - 2, tipY);
        ctx.lineTo(hx + 24, hy - 13);
        ctx.quadraticCurveTo(hx + 1, hy - 6, hx - 22, hy - 13);
        paint(ctx, linear(ctx, hx - 22, 0, hx + 24, 0, [[0, "#ffb062"], [0.5, "#f27a22"], [1, "#c4520f"]]), C("#6e2d07"), 2.4);
        ctx.save();
        ctx.clip();
        ctx.fillStyle = C("#fff4e6");
        ctx.fillRect(hx - 30, hy - 34, 60, 7);
        ctx.fillRect(hx - 30, hy - 48 + (r < 0.66 ? 6 : 0), 60, 5);
        if (r < 0.33) {
          ctx.fillStyle = C("#4a2a14");
          ctx.beginPath();
          ctx.moveTo(hx + 6, hy - 14);
          ctx.lineTo(hx + 12, hy - 34);
          ctx.lineTo(hx + 20, hy - 22);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
        ellipse(ctx, hx + 1, hy - 12, 25, 5);
        paint(ctx, C("#d9600f"), C("#6e2d07"), 2);
        return;
      }
      case "bucket": {
        const dent = r < 0.66;
        ctx.beginPath();
        ctx.moveTo(hx - 23, hy - 6);
        ctx.lineTo(hx - 18, hy - 46);
        ctx.lineTo(hx + 20, hy - (dent ? 42 : 46));
        ctx.lineTo(hx + 25, hy - 6);
        ctx.closePath();
        paint(ctx, linear(ctx, hx - 23, 0, hx + 25, 0, [[0, "#7a838a"], [0.35, "#dfe5ea"], [0.6, "#a8b0b7"], [1, "#6d757c"]]), C("#3b4146"), 2.4);
        ellipse(ctx, hx + 1, hy - 45, 19, 4);
        paint(ctx, C("#c4ccd2"), C("#3b4146"), 1.8);
        rrect(ctx, hx - 25, hy - 11, 52, 7, 2);
        paint(ctx, C("#8f979e"), C("#3b4146"), 1.8);
        if (dent) {
          ellipse(ctx, hx + 9, hy - 30, 6, 4, 0.4);
          paint(ctx, C("#5c646b"));
        }
        if (r < 0.33) {
          ellipse(ctx, hx - 9, hy - 22, 5, 7, -0.3);
          paint(ctx, C("#545b61"));
          ellipse(ctx, hx + 14, hy - 16, 4, 3);
          paint(ctx, C("#545b61"));
        }
        ctx.beginPath();
        ctx.arc(hx + 1, hy - 18, 26, 0.15 * Math.PI, 0.45 * Math.PI);
        ctx.lineWidth = 2;
        ctx.strokeStyle = C("#4b5258");
        ctx.stroke();
        return;
      }
      case "helmet": {
        ctx.beginPath();
        ctx.ellipse(hx + 1, hy - 2, 25, 27, 0, Math.PI, 2 * Math.PI);
        ctx.lineTo(hx + 26, hy + 10);
        ctx.lineTo(hx + 8, hy + 12);
        ctx.lineTo(hx + 6, hy - 2);
        ctx.lineTo(hx - 24, hy - 2);
        ctx.closePath();
        paint(ctx, radial(ctx, hx - 8, hy - 18, 3, hx, hy - 4, 30, [[0, "#ff7676"], [0.6, "#d0232c"], [1, "#86121a"]]), C("#4a070c"), 2.4);
        ctx.lineWidth = 5;
        ctx.strokeStyle = C("#f3f3f3");
        ctx.beginPath();
        ctx.moveTo(hx - 2, hy - 28);
        ctx.quadraticCurveTo(hx + 18, hy - 22, hx + 24, hy - 4);
        ctx.stroke();
        ctx.lineWidth = 2.6;
        ctx.strokeStyle = C("#9aa1a8");
        ctx.beginPath();
        ctx.moveTo(hx - 24, hy - 4);
        ctx.lineTo(hx - 28, hy + 14);
        ctx.lineTo(hx - 10, hy + 18);
        ctx.moveTo(hx - 26, hy + 5);
        ctx.lineTo(hx - 8, hy + 7);
        ctx.stroke();
        if (r < 0.5) {
          ctx.lineWidth = 1.6;
          ctx.strokeStyle = C("#3a0508");
          ctx.beginPath();
          ctx.moveTo(hx + 4, hy - 26);
          ctx.lineTo(hx + 8, hy - 16);
          ctx.lineTo(hx + 2, hy - 10);
          ctx.stroke();
        }
        return;
      }
    }
  }
  function head(ctx, v, o, hx, hy, jaw) {
    const skin = v.angry ? "#c99c86" : o.skin;
    const skinDark = v.angry ? "#a0705c" : o.skinDark;
    rrect(ctx, hx + 2, hy + 12, 11, 14, 3);
    paint(ctx, C(skinDark), C("#3d4a30"), 1.6);
    ellipse(ctx, hx + 17, hy + 1, 5, 7);
    paint(ctx, C(skinDark), C("#3d4a30"), 1.6);
    ellipse(ctx, hx, hy, 20.5, 22.5);
    paint(ctx, radial(ctx, hx - 6, hy - 8, 3, hx, hy, 24, [[0, skin], [0.75, skin], [1, skinDark]]), C("#3d4a30"), 2.4);
    if (!(v.armor > 0 && (v.armorKind === "bucket" || v.armorKind === "helmet" || v.armorKind === "cone"))) {
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = C("#3a3328");
      ctx.beginPath();
      ctx.moveTo(hx + 2, hy - 21);
      ctx.quadraticCurveTo(hx + 4, hy - 30, hx + 12, hy - 31);
      ctx.moveTo(hx + 7, hy - 20);
      ctx.quadraticCurveTo(hx + 12, hy - 27, hx + 18, hy - 24);
      ctx.moveTo(hx - 4, hy - 21);
      ctx.quadraticCurveTo(hx - 6, hy - 28, hx - 2, hy - 33);
      ctx.stroke();
    }
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = C(skinDark);
    ctx.beginPath();
    ctx.arc(hx - 11, hy - 2, 9, 0.2 * Math.PI, 0.8 * Math.PI);
    ctx.stroke();
    circle(ctx, hx - 11, hy - 5, 7.5);
    paint(ctx, C("#f4f1e6"), C("#3d4a30"), 1.6);
    circle(ctx, hx - 13, hy - 4, 2.2);
    paint(ctx, C("#1a1a1a"));
    circle(ctx, hx + 2, hy - 7, 5.2);
    paint(ctx, C("#ebe6d6"), C("#3d4a30"), 1.4);
    circle(ctx, hx + 1, hy - 6, 1.7);
    paint(ctx, C("#1a1a1a"));
    if (v.id === "paper") {
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = C("#222222");
      ctx.beginPath();
      ctx.arc(hx - 11, hy - 5, 9, 0, Math.PI * 2);
      ctx.moveTo(hx + 7.5, hy - 7);
      ctx.arc(hx + 2, hy - 7, 6.5, 0, Math.PI * 2);
      ctx.moveTo(hx - 2, hy - 6);
      ctx.lineTo(hx - 4.5, hy - 6);
      ctx.stroke();
    }
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = C("#3d4a30");
    ctx.beginPath();
    ctx.moveTo(hx - 19, hy - 15);
    ctx.lineTo(hx - 6, hy - 13 + (v.angry ? 4 : 0));
    ctx.stroke();
    const mOpen = 2 + jaw * 5;
    ellipse(ctx, hx - 10, hy + 12 + mOpen * 0.4, 7.5, mOpen);
    paint(ctx, C("#2a1a14"));
    ctx.fillStyle = C("#efe8cc");
    ctx.fillRect(hx - 14, hy + 10, 3, 3);
    ctx.fillRect(hx - 9, hy + 10, 3, 3.5);
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = C("#3d4a30");
    ctx.beginPath();
    ctx.arc(hx - 6, hy + 14 + jaw * 4, 13, 0.55 * Math.PI, 0.95 * Math.PI);
    ctx.stroke();
    if (v.id === "pole") {
      ctx.fillStyle = C("#c23b3b");
      ctx.fillRect(hx - 21, hy - 19, 42, 6);
    }
    if (v.angry) {
      const k = v.t * 2 % 1;
      ctx.globalAlpha *= 1 - k;
      for (const sx of [-6, 8]) {
        circle(ctx, hx + sx, hy - 30 - k * 20, 4 + k * 4);
        paint(ctx, "rgba(255,255,255,0.8)");
      }
      ctx.globalAlpha /= Math.max(0.01, 1 - k);
    }
    headwear(ctx, v, hx, hy);
  }
  function drawZombieHead(ctx, id, x, y, rot, scale = 1) {
    const o = OUTFITS[id];
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.scale(o.scale * o.head * scale, o.scale * o.head * scale);
    head(
      ctx,
      { id, t: 0, phase: 0, state: "walk", stateT: 0, deathT: 0, hasArm: true, hasHead: true, hasPole: false, hasImp: false, armorKind: null, armor: 0, angry: false },
      o,
      0,
      0,
      0.6
    );
    ctx.restore();
  }
  function newspaper(ctx, r, wob) {
    ctx.save();
    ctx.translate(-54, -92);
    ctx.rotate(-0.08 + wob * 0.03);
    ctx.beginPath();
    ctx.moveTo(-20, -28);
    ctx.lineTo(18, -30);
    if (r < 0.5) {
      ctx.lineTo(16, -6);
      ctx.lineTo(6, 2);
      ctx.lineTo(12, 12);
    }
    ctx.lineTo(18, 26);
    ctx.lineTo(-20, 28);
    ctx.closePath();
    paint(ctx, linear(ctx, -20, 0, 18, 0, [[0, "#f2f0e6"], [1, "#d6d3c4"]]), C("#6b6b62"), 1.8);
    ctx.fillStyle = C("#4a4a44");
    ctx.fillRect(-15, -24, 26, 6);
    ctx.fillStyle = C("#9a988c");
    for (let i = 0; i < 6; i++) ctx.fillRect(-15, -13 + i * 6, i % 3 === 2 ? 14 : 26, 2);
    ctx.restore();
  }
  function screenDoor(ctx, r) {
    ctx.save();
    ctx.translate(-48, -84);
    ctx.rotate(r < 0.33 ? -0.06 : 0);
    rrect(ctx, -22, -66, 44, 128, 3);
    paint(ctx, "rgba(200,210,215,0.28)", C("#4c5156"), 6);
    ctx.save();
    rrect(ctx, -19, -63, 38, 122, 2);
    ctx.clip();
    ctx.strokeStyle = C("#8e959b");
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = -66; i < 66; i += 7) {
      ctx.moveTo(-22, i);
      ctx.lineTo(22, i);
    }
    for (let i = -22; i < 22; i += 7) {
      ctx.moveTo(i, -66);
      ctx.lineTo(i, 66);
    }
    ctx.stroke();
    if (r < 0.66) {
      ellipse(ctx, 6, -30, 8, 6);
      paint(ctx, "rgba(30,30,30,0.35)");
    }
    if (r < 0.33) {
      ellipse(ctx, -6, 20, 9, 12);
      paint(ctx, "rgba(30,30,30,0.35)");
    }
    ctx.restore();
    ctx.lineWidth = 4;
    ctx.strokeStyle = C("#4c5156");
    ctx.beginPath();
    ctx.moveTo(-22, 0);
    ctx.lineTo(22, 0);
    ctx.stroke();
    circle(ctx, 15, 4, 3);
    paint(ctx, C("#c9a227"));
    ctx.restore();
  }
  function flag(ctx, hand2, t) {
    ctx.lineCap = "round";
    ctx.lineWidth = 3.4;
    ctx.strokeStyle = C("#5a3a1a");
    ctx.beginPath();
    ctx.moveTo(hand2.x, hand2.y + 16);
    ctx.lineTo(hand2.x + 2, hand2.y - 92);
    ctx.stroke();
    const top = hand2.y - 90;
    const wave = (k) => Math.sin(t * 5 + k) * 3;
    ctx.beginPath();
    ctx.moveTo(hand2.x + 2, top);
    ctx.quadraticCurveTo(hand2.x + 22, top - 4 + wave(0), hand2.x + 44, top + wave(1));
    ctx.lineTo(hand2.x + 38, top + 12 + wave(2));
    ctx.lineTo(hand2.x + 46, top + 22 + wave(2));
    ctx.lineTo(hand2.x + 34, top + 34 + wave(3));
    ctx.quadraticCurveTo(hand2.x + 18, top + 32 + wave(1), hand2.x + 2, top + 36);
    ctx.closePath();
    paint(ctx, linear(ctx, hand2.x, 0, hand2.x + 46, 0, [[0, "#8e1d1d"], [1, "#5a1010"]]), C("#300606"), 1.8);
    const sx = hand2.x + 20;
    const sy = top + 16;
    circle(ctx, sx, sy - 2, 7);
    paint(ctx, C("#f1ead8"));
    ctx.fillRect(sx - 4, sy + 3, 8, 5);
    ctx.fillStyle = C("#5a1010");
    circle(ctx, sx - 2.6, sy - 2, 2);
    ctx.fill();
    circle(ctx, sx + 2.6, sy - 2, 2);
    ctx.fill();
  }
  function imp(ctx, x, y, s, t) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    drawBody(
      ctx,
      { id: "imp", t, phase: t * 3, state: "preview", stateT: 0, deathT: 0, hasArm: true, hasHead: true, hasPole: false, hasImp: false, armorKind: null, armor: 0, angry: false },
      OUTFITS.imp
    );
    ctx.restore();
  }
  function drawBody(ctx, v, o) {
    const st = v.state;
    const running = v.id === "pole" && v.hasPole;
    let legA = 0;
    let backArm = -1.3;
    let backFore = -1.45;
    let frontArm = -1.3;
    let frontFore = -1.5;
    let jaw = 0.15;
    let headDy = 0;
    let lean = -0.06;
    if (st === "walk" || st === "preview" || st === "angry" || st === "fly") {
      const amp = running ? 0.62 : v.id === "imp" ? 0.5 : 0.42;
      legA = Math.sin(v.phase) * amp;
      const sw = Math.sin(v.phase) * 0.12;
      backArm += sw;
      frontArm -= sw;
      headDy = -Math.abs(Math.cos(v.phase)) * 2;
      if (running) lean = -0.22;
      if (st === "preview") {
        legA = Math.sin(v.phase) * 0.08;
        headDy = Math.sin(v.phase) * 1.5;
      }
    } else if (st === "eat") {
      legA = Math.sin(v.phase * 0.25) * 0.05;
      const k = Math.sin(v.phase);
      frontArm = -1.05 + k * 0.35;
      backArm = -1.15 - k * 0.3;
      frontFore = -1.3;
      jaw = (k + 1) / 2;
      headDy = k * 2;
      lean = -0.16;
    } else if (st === "vault") {
      legA = 0.5;
      lean = -0.55;
    } else if (st === "dying" || st === "ash" || st === "squashed" || st === "mowed") {
      frontArm = -0.5;
      backArm = -0.4;
      frontFore = -0.3;
      backFore = -0.3;
    }
    if (v.armorKind === "paper" && v.armor > 0 && st !== "eat") {
      frontArm = -1.2;
      frontFore = -1.9;
      backArm = -1.1;
      backFore = -1.8;
    }
    if (v.armorKind === "door" && v.armor > 0) {
      frontArm = -1;
      frontFore = -1.6;
    }
    if (running) {
      frontArm = -0.9;
      frontFore = -1.8;
      backArm = -0.7;
      backFore = -1.9;
    }
    if (v.id === "flag") {
      backArm = -2.2;
      backFore = -2.9;
    }
    if (v.id === "garg" && st !== "smash" && st !== "dying" && st !== "ash" && st !== "squashed" && st !== "mowed") {
      frontArm = -0.75 + Math.sin(v.phase) * 0.08;
      frontFore = -2.55;
    }
    if (v.id === "garg" && st === "smash") {
      const t = v.stateT;
      frontArm = t < 0.9 ? lerp(-1.3, -3, easeOutCubic(t / 0.9)) : t < 1.05 ? lerp(-3, -0.8, easeInCubic((t - 0.9) / 0.15)) : -0.8;
      frontFore = frontArm - 0.2;
    }
    if (v.id === "garg" && st === "throw") {
      const t = v.stateT;
      backArm = t < 0.9 ? lerp(-1.2, 0.9, t / 0.9) : lerp(0.9, -2.4, clamp((t - 0.9) / 0.2, 0, 1));
      backFore = backArm - 0.3;
    }
    ctx.rotate(lean);
    if (v.id === "garg" && v.hasImp && !(st === "throw" && v.stateT > 0.9)) {
      if (st === "throw") {
        const sx = 10 + Math.sin(backArm) * 40;
        const sy = -96 + Math.cos(backArm) * 40;
        imp(ctx, sx, sy + 30, 0.42, v.t);
      } else imp(ctx, 20, -86, 0.42, v.t);
    }
    const bs = { x: 10, y: -97 };
    const ba = limb(ctx, bs.x, bs.y, backArm, 21, backFore, 19, 9, o.coatDark, "#2a2219");
    hand(ctx, { x: ba.fx, y: ba.fy }, o, backFore);
    if (v.id === "flag") flag(ctx, { x: ba.fx, y: ba.fy }, v.t);
    for (const [hx, a, col] of [
      [6, legA, o.pantsDark],
      [-4, -legA, o.pants]
    ]) {
      const a2 = a * 0.55 + (a < 0 ? 0.32 : 0.12);
      const l = limb(ctx, hx, -50, a, 25, a2, 24, 11, col, "#231b12");
      ellipse(ctx, l.fx - 5, l.fy + 1, 10, 5);
      paint(ctx, C(o.shoe), C("#111111"), 1.6);
    }
    torso(ctx, o, v.id);
    if (v.id === "football") {
      for (const sx of [-14, 10]) {
        ellipse(ctx, sx, -98, 15, 10, sx < 0 ? 0.2 : -0.2);
        paint(ctx, radial(ctx, sx - 4, -102, 2, sx, -98, 16, [[0, "#ff6b6b"], [1, "#9a141c"]]), C("#4a070c"), 2);
      }
    }
    if (v.armorKind === "paper" && v.armor > 0) newspaper(ctx, v.armor, Math.sin(v.phase));
    if (v.hasHead) head(ctx, v, o, -12, -124 * 1 + headDy - (o.head - 1) * 10, jaw);
    else {
      ellipse(ctx, -3, -104, 8, 4);
      paint(ctx, C("#6e2b20"), C("#3d1810"), 1.5);
    }
    const fs = { x: -12, y: -95 };
    if (v.hasArm) {
      const fa = limb(ctx, fs.x, fs.y, frontArm, 21, frontFore, 19, 9.5, o.coat, "#2a2219");
      hand(ctx, { x: fa.fx, y: fa.fy }, o, frontFore);
      if (v.id === "garg") {
        const len = 78;
        ctx.lineCap = "round";
        ctx.lineWidth = 12;
        ctx.strokeStyle = C("#3a2610");
        ctx.beginPath();
        ctx.moveTo(fa.fx - Math.sin(frontFore) * 10, fa.fy - Math.cos(frontFore) * 10);
        ctx.lineTo(fa.fx + Math.sin(frontFore) * len, fa.fy + Math.cos(frontFore) * len);
        ctx.stroke();
        ctx.lineWidth = 8;
        ctx.strokeStyle = C("#8a5a2a");
        ctx.stroke();
      }
      if (running) {
        ctx.lineWidth = 4;
        ctx.strokeStyle = C("#8b5a2b");
        ctx.beginPath();
        ctx.moveTo(fa.fx - 54, fa.fy + 8);
        ctx.lineTo(fa.fx + 62, fa.fy - 8);
        ctx.stroke();
      }
    } else {
      limb(ctx, fs.x, fs.y, frontArm, 8, frontArm, 1, 9.5, o.coat, "#2a2219");
      circle(ctx, fs.x + Math.sin(frontArm) * 9, fs.y + Math.cos(frontArm) * 9, 3.4);
      paint(ctx, C("#6e2b20"));
    }
    if (v.armorKind === "door" && v.armor > 0) screenDoor(ctx, v.armor);
  }
  function drawZombie(ctx, x, y, v, lift = 0) {
    const o = OUTFITS[v.id];
    ctx.save();
    ctx.translate(x, y - lift);
    let alpha = 1;
    if (v.state === "dying") {
      const fall = easeInCubic(clamp(v.deathT / 0.85, 0, 1));
      ctx.rotate(fall * 1.42);
      alpha = clamp(1 - (v.deathT - 1.3) / 0.8, 0, 1);
    } else if (v.state === "ash") {
      alpha = clamp(1 - (v.deathT - 0.8) / 0.7, 0, 1);
    } else if (v.state === "squashed") {
      ctx.scale(1.25, clamp(1 - v.deathT * 5, 0.12, 1));
      alpha = clamp(1 - (v.deathT - 0.9) / 0.4, 0, 1);
    } else if (v.state === "mowed") {
      ctx.rotate(-v.deathT * 7);
      ctx.scale(1 - v.deathT * 0.6, 1 - v.deathT * 0.6);
      alpha = clamp(1 - v.deathT / 0.8, 0, 1);
    } else if (v.state === "vault") {
      const t = clamp(v.stateT / 0.9, 0, 1);
      ctx.rotate(-Math.sin(t * Math.PI) * 0.6);
    } else if (v.state === "fly") {
      ctx.rotate(-v.stateT * 9);
    } else if (v.state === "angry") {
      ctx.translate(Math.sin(v.t * 60) * 1.5, 0);
    }
    ctx.globalAlpha *= alpha;
    ctx.scale(o.scale, o.scale);
    drawBody(ctx, v, o);
    ctx.restore();
    if (v.state === "vault" && v.hasPole) {
      const t = clamp(v.stateT / 0.9, 0, 1);
      const gx = x - 30 + t * 40;
      ctx.lineCap = "round";
      ctx.lineWidth = 4;
      ctx.strokeStyle = C("#8b5a2b");
      ctx.beginPath();
      ctx.moveTo(gx, y);
      ctx.lineTo(x - 10, y - lift - 90);
      ctx.stroke();
    }
  }
  function zombieShadow(ctx, x, y, id, lift = 0) {
    const s = OUTFITS[id].scale;
    const k = clamp(1 - lift / 220, 0.35, 1);
    ellipse(ctx, x - 2, y, 30 * s * k, 8 * s * k);
    ctx.fillStyle = `rgba(0,0,0,${0.24 * k})`;
    ctx.fill();
  }
  var zombieScale = (id) => OUTFITS[id].scale;

  // games-src/garden-guard/src/art/items.ts
  var PACKET_W = 64;
  var PACKET_H = 88;
  function drawSun(ctx, x, y, t, s = 1, alpha = 1) {
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.translate(x, y);
    ctx.scale(s, s);
    circle(ctx, 0, 0, 48);
    paint(ctx, radial(ctx, 0, 0, 6, 0, 0, 48, [[0, "#fff7b0cc"], [0.5, "#ffe36a55"], [1, "#ffd84a00"]]));
    ctx.save();
    ctx.rotate(t * 0.9);
    ctx.beginPath();
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * TAU;
      const a1 = a - 0.13;
      const a2 = a + 0.13;
      ctx.moveTo(Math.cos(a1) * 19, Math.sin(a1) * 19);
      ctx.lineTo(Math.cos(a) * (i % 2 ? 31 : 36), Math.sin(a) * (i % 2 ? 31 : 36));
      ctx.lineTo(Math.cos(a2) * 19, Math.sin(a2) * 19);
    }
    ctx.fillStyle = "#ffd23a";
    ctx.fill();
    ctx.restore();
    circle(ctx, 0, 0, 21);
    paint(ctx, radial(ctx, -6, -7, 2, 0, 0, 22, [[0, "#fffde8"], [0.45, "#ffe25a"], [1, "#f3a414"]]), "#d98a0c", 2);
    circle(ctx, 0, 0, 13);
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }
  function drawPea(ctx, x, y, kind, t) {
    if (kind === "fire") {
      ctx.save();
      ctx.translate(x + 6, y);
      ctx.rotate(-Math.PI / 2);
      flame(ctx, 0, 0, 0.42, t * 1.6);
      ctx.restore();
      circle(ctx, x, y, 10);
      paint(ctx, radial(ctx, x - 3, y - 3, 1, x, y, 11, [[0, "#fff6b0"], [0.5, "#ffb030"], [1, "#e2481a"]]));
      return;
    }
    const snow = kind === "snow";
    if (snow) {
      circle(ctx, x, y, 16);
      paint(ctx, radial(ctx, x, y, 2, x, y, 16, [[0, "#d8f4ff88"], [1, "#d8f4ff00"]]));
    }
    circle(ctx, x, y, 10);
    paint(
      ctx,
      radial(ctx, x - 3.5, y - 3.5, 1, x, y, 11, snow ? [[0, "#ffffff"], [0.5, "#9fd8ff"], [1, "#3d8fd0"]] : [[0, "#e6ffc0"], [0.5, "#7fd648"], [1, "#3c8c1c"]]),
      C(snow ? "#1d5689" : "#24600f"),
      1.6
    );
    if (snow) {
      ctx.strokeStyle = "rgba(255,255,255,0.85)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        const a = t * 4 + i * Math.PI / 3;
        ctx.moveTo(x + Math.cos(a) * 5, y + Math.sin(a) * 5);
        ctx.lineTo(x - Math.cos(a) * 5, y - Math.sin(a) * 5);
      }
      ctx.stroke();
    }
  }
  function drawCabbageBall(ctx, x, y, rot) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    circle(ctx, 0, 0, 13);
    paint(ctx, radial(ctx, -4, -4, 1, 0, 0, 14, [[0, "#e6ffb8"], [0.6, "#92d651"], [1, "#4f9a26"]]), C("#2d5e14"), 2);
    ctx.strokeStyle = C("#5fae2e");
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(-8, 2, 10, -0.9, 0.7);
    ctx.moveTo(14, 2);
    ctx.arc(8, 2, 10, Math.PI - 0.7, Math.PI + 0.9);
    ctx.stroke();
    ctx.restore();
  }
  function drawMower(ctx, x, y, t, running) {
    const shake = running ? Math.sin(t * 60) * 1.2 : 0;
    ctx.save();
    ctx.translate(x, y + shake);
    ellipse(ctx, 0, 2, 38, 8);
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fill();
    ctx.lineCap = "round";
    ctx.lineWidth = 4;
    ctx.strokeStyle = C("#3a3a3a");
    ctx.beginPath();
    ctx.moveTo(-22, -26);
    ctx.lineTo(-44, -66);
    ctx.lineTo(-54, -64);
    ctx.stroke();
    rrect(ctx, -34, -34, 66, 28, 9);
    paint(ctx, linear(ctx, 0, -34, 0, -6, [[0, "#ff6a5a"], [1, "#b8261c"]]), C("#5e0e08"), 2.4);
    rrect(ctx, -18, -50, 30, 20, 6);
    paint(ctx, linear(ctx, 0, -50, 0, -30, [[0, "#f4f4f4"], [1, "#9ea4aa"]]), C("#40464c"), 2);
    rrect(ctx, -10, -56, 12, 7, 2);
    paint(ctx, C("#333"), null);
    ctx.fillStyle = C("#ffd84a");
    ctx.fillRect(14, -26, 12, 5);
    for (const wx of [-22, 20]) {
      circle(ctx, wx, -4, 10);
      paint(ctx, C("#222"), C("#000"), 1.5);
      circle(ctx, wx, -4, 4);
      paint(ctx, C("#c9ced3"));
    }
    if (running) {
      ctx.strokeStyle = "rgba(160,230,110,0.8)";
      ctx.lineWidth = 2;
      for (let i = 0; i < 5; i++) {
        const a = t * 30 + i;
        ctx.beginPath();
        ctx.moveTo(30, -10);
        ctx.lineTo(36 + Math.cos(a) * 10, -14 + Math.sin(a) * 10);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
  var iconCache = /* @__PURE__ */ new Map();
  var ICON_W = 56;
  var ICON_H = 62;
  function packetIcon(id) {
    const hit = iconCache.get(id);
    if (hit) return hit;
    const k = 3;
    const cv = document.createElement("canvas");
    cv.width = ICON_W * k;
    cv.height = ICON_H * k;
    const c = cv.getContext("2d");
    c.scale(k, k);
    const def = PLANTS[id];
    c.translate(ICON_W / 2, ICON_H - 14 + def.iconY);
    c.scale(def.icon, def.icon);
    drawPlant(c, id, 0, 0, { t: 0.4, hp: 1 });
    iconCache.set(id, cv);
    return cv;
  }
  function drawPacket(ctx, x, y, id, o = {}) {
    const s = o.scale ?? 1;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    if (o.hover && !o.off) ctx.translate(0, -3);
    rrect(ctx, 2, 4, PACKET_W, PACKET_H, 8);
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fill();
    rrect(ctx, 0, 0, PACKET_W, PACKET_H, 8);
    paint(ctx, linear(ctx, 0, 0, 0, PACKET_H, [[0, "#fffdec"], [1, "#ebf2d7"]]), "#97af89", 1.5);
    rrect(ctx, 4, 4, ICON_W, ICON_H, 6);
    paint(ctx, linear(ctx, 0, 4, 0, 66, [[0, "#ecf4d9"], [1, "#c4dcac"]]), "#b4c99c", 1);
    ctx.drawImage(packetIcon(id), 4, 4, ICON_W, ICON_H);
    if (o.cost != null) text(ctx, String(o.cost), PACKET_W / 2, PACKET_H - 11, { size: 17, color: "#395f46", weight: 700 });
    if (o.off || o.picked) {
      rrect(ctx, 0, 0, PACKET_W, PACKET_H, 8);
      ctx.fillStyle = o.picked ? "rgba(20,20,20,0.6)" : "rgba(20,20,20,0.42)";
      ctx.fill();
    }
    if (o.cd && o.cd > 0) {
      ctx.save();
      rrect(ctx, 0, 0, PACKET_W, PACKET_H, 8);
      ctx.clip();
      ctx.fillStyle = "rgba(10,10,10,0.5)";
      ctx.fillRect(0, 0, PACKET_W, PACKET_H * o.cd);
      ctx.restore();
    }
    if (o.hover && !o.off) {
      rrect(ctx, -1, -1, PACKET_W + 2, PACKET_H + 2, 9);
      ctx.strokeStyle = "rgba(255,255,220,0.9)";
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    ctx.restore();
  }
  function drawShovel(ctx, x, y, s = 1, rot = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.scale(s, s);
    ctx.lineCap = "round";
    ctx.lineWidth = 7;
    ctx.strokeStyle = "#6b4220";
    ctx.beginPath();
    ctx.moveTo(-20, -20);
    ctx.lineTo(8, 8);
    ctx.stroke();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#a8703a";
    ctx.stroke();
    rrect(ctx, -30, -30, 18, 9, 3);
    paint(ctx, "#3a2a1a");
    ctx.beginPath();
    ctx.moveTo(4, 2);
    ctx.lineTo(22, 4);
    ctx.quadraticCurveTo(32, 18, 26, 30);
    ctx.quadraticCurveTo(14, 34, 4, 22);
    ctx.closePath();
    paint(ctx, linear(ctx, 4, 0, 30, 30, [[0, "#f1f4f7"], [1, "#8c96a0"]]), "#4a525a", 2);
    ctx.restore();
  }
  function drawFlagIcon(ctx, x, y, raised) {
    ctx.strokeStyle = "#5a3a1a";
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(x, y + 8);
    ctx.lineTo(x, y - 18 - (raised ? 6 : 0));
    ctx.stroke();
    const fy = y - 18 - (raised ? 6 : 0);
    ctx.beginPath();
    ctx.moveTo(x, fy);
    ctx.lineTo(x + 16, fy + 4);
    ctx.lineTo(x, fy + 10);
    ctx.closePath();
    paint(ctx, raised ? "#d23434" : "#8e1d1d", "#300606", 1.2);
  }
  function drawProgress(ctx, x, y, w, progress, flags, label) {
    const h = 18;
    text(ctx, label, x - 12, y + h / 2, { size: 16, color: "#fff3c8", stroke: "#3a2408", lw: 4, align: "right" });
    rrect(ctx, x, y, w, h, 9);
    paint(ctx, "#3a2a14", "#1e1408", 2.4);
    const fw = Math.max(0, Math.min(1, progress)) * (w - 6);
    if (fw > 0) {
      rrect(ctx, x + w - 3 - fw, y + 3, fw, h - 6, 6);
      paint(ctx, linear(ctx, 0, y, 0, y + h, [[0, "#b6ef6a"], [1, "#4f9a26"]]));
    }
    for (const f of flags) drawFlagIcon(ctx, x + w - 3 - f * (w - 6), y + h - 2, progress >= f - 1e-3);
    drawZombieHead(ctx, "basic", x + w - 3 - fw, y + h / 2 + 2, -0.1, 0.55);
  }
  function drawTrophy(ctx, x, y, s, t) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    circle(ctx, 0, -40, 90);
    paint(ctx, radial(ctx, 0, -40, 10, 0, -40, 90, [[0, "#fff3b066"], [1, "#fff3b000"]]));
    ctx.save();
    ctx.rotate(t * 0.4);
    ctx.fillStyle = "rgba(255,240,170,0.25)";
    for (let i = 0; i < 10; i++) {
      ctx.rotate(TAU / 10);
      ctx.beginPath();
      ctx.moveTo(0, -40);
      ctx.lineTo(-10, -140);
      ctx.lineTo(10, -140);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    const gold = (x0, x1) => linear(ctx, x0, 0, x1, 0, [[0, "#b8860b"], [0.4, "#ffe680"], [1, "#c8961a"]]);
    ctx.lineWidth = 7;
    ctx.strokeStyle = "#d9a520";
    ctx.beginPath();
    ctx.arc(-36, -66, 16, Math.PI * 0.5, Math.PI * 1.5);
    ctx.moveTo(36, -82);
    ctx.arc(36, -66, 16, -Math.PI * 0.5, Math.PI * 0.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-38, -92);
    ctx.lineTo(38, -92);
    ctx.quadraticCurveTo(36, -36, 0, -30);
    ctx.quadraticCurveTo(-36, -36, -38, -92);
    paint(ctx, gold(-38, 38), "#7a5208", 3);
    ctx.fillRect(-6, -32, 12, 22);
    rrect(ctx, -6, -32, 12, 22, 2);
    paint(ctx, gold(-6, 6), "#7a5208", 2);
    rrect(ctx, -30, -12, 60, 14, 4);
    paint(ctx, gold(-30, 30), "#7a5208", 2.4);
    ctx.font = `900 22px ${FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#8a5a0a";
    ctx.fillText("\u2605", 0, -64);
    ctx.restore();
  }
  function drawSunCounter(ctx, x, y, sun, t, flash) {
    rrect(ctx, x, y, 84, 104, 10);
    paint(ctx, linear(ctx, 0, y, 0, y + 104, [[0, "#8a5a2c"], [1, "#5c3a18"]]), "#2e1c08", 3);
    drawSun(ctx, x + 42, y + 38, t, 0.85);
    rrect(ctx, x + 8, y + 72, 68, 24, 7);
    paint(ctx, flash > 0 ? "#ff9a9a" : "#f5ecd2", "#5c3a18", 2);
    text(ctx, String(sun), x + 42, y + 85, { size: 19, color: flash > 0 ? "#8a0000" : "#2a1d08", weight: 900 });
  }

  // games-src/garden-guard/src/data/zombies.ts
  var Z = (d) => d;
  var ZOMBIES = {
    basic: Z({
      id: "basic",
      name: "\u666E\u901A\u50F5\u5C38",
      hp: 200,
      armor: 0,
      armorKind: null,
      speed: 17,
      eat: 100,
      cost: 1,
      weight: 5,
      from: 0,
      desc: "\u6807\u51C6\u7684\u50F5\u5C38\u3002\n\u811A\u6B65\u62D6\u6C93\uFF0C\u4F46\u4ECE\u4E0D\u505C\u4E0B\u3002",
      toughness: "\u97E7\u6027\uFF1A\u4F4E"
    }),
    flag: Z({
      id: "flag",
      name: "\u65D7\u5E1C\u50F5\u5C38",
      hp: 200,
      armor: 0,
      armorKind: null,
      speed: 24,
      eat: 100,
      cost: 1,
      weight: 0,
      from: 0,
      desc: "\u9AD8\u4E3E\u65D7\u5E1C\uFF0C\u5BA3\u544A\u4E00\u5927\u6CE2\u50F5\u5C38\u7684\u5230\u6765\u3002",
      toughness: "\u97E7\u6027\uFF1A\u4F4E \xB7 \u901F\u5EA6\uFF1A\u8F83\u5FEB"
    }),
    cone: Z({
      id: "cone",
      name: "\u8DEF\u969C\u50F5\u5C38",
      hp: 200,
      armor: 370,
      armorKind: "cone",
      speed: 17,
      eat: 100,
      cost: 2,
      weight: 4,
      from: 0.1,
      desc: "\u5934\u9876\u4EA4\u901A\u8DEF\u969C\uFF0C\n\u6BD4\u666E\u901A\u50F5\u5C38\u8010\u6253\u4E24\u500D\u591A\u3002",
      toughness: "\u97E7\u6027\uFF1A\u4E2D"
    }),
    pole: Z({
      id: "pole",
      name: "\u6491\u6746\u50F5\u5C38",
      hp: 340,
      armor: 0,
      armorKind: null,
      speed: 38,
      eat: 100,
      cost: 2,
      weight: 2.4,
      from: 0.2,
      desc: "\u98DE\u5FEB\u5730\u8DD1\u6765\uFF0C\u6491\u6746\u8DF3\u8FC7\u9047\u5230\u7684\u7B2C\u4E00\u682A\u690D\u7269\u3002\n\u9AD8\u575A\u679C\u80FD\u8BA9\u4ED6\u649E\u4E2A\u6B63\u7740\u3002",
      toughness: "\u97E7\u6027\uFF1A\u4E2D \xB7 \u901F\u5EA6\uFF1A\u5FEB\uFF08\u8DF3\u8DC3\u524D\uFF09"
    }),
    bucket: Z({
      id: "bucket",
      name: "\u94C1\u6876\u50F5\u5C38",
      hp: 200,
      armor: 1100,
      armorKind: "bucket",
      speed: 17,
      eat: 100,
      cost: 4,
      weight: 2,
      from: 0.3,
      desc: "\u94C1\u6876\u8BA9\u4ED6\u5F02\u5E38\u8010\u6253\u3002\n\u8BD5\u8BD5\u5927\u5634\u82B1\uFF0C\u6216\u8005\u5E72\u8106\u70B8\u6389\u3002",
      toughness: "\u97E7\u6027\uFF1A\u9AD8"
    }),
    paper: Z({
      id: "paper",
      name: "\u8BFB\u62A5\u50F5\u5C38",
      hp: 200,
      armor: 150,
      armorKind: "paper",
      speed: 17,
      eat: 100,
      cost: 2,
      weight: 2.4,
      from: 0.2,
      desc: "\u62A5\u7EB8\u88AB\u6253\u70C2\u540E\u4F1A\u52C3\u7136\u5927\u6012\uFF0C\n\u901F\u5EA6\u66B4\u6DA8\u3002",
      toughness: "\u97E7\u6027\uFF1A\u4E2D \xB7 \u5931\u53BB\u62A5\u7EB8\u540E\u901F\u5EA6\uFF1A\u5FEB"
    }),
    door: Z({
      id: "door",
      name: "\u94C1\u6805\u95E8\u50F5\u5C38",
      hp: 200,
      armor: 1100,
      armorKind: "door",
      speed: 17,
      eat: 100,
      cost: 4,
      weight: 1.6,
      from: 0.35,
      desc: "\u94C1\u6805\u95E8\u6321\u4F4F\u6B63\u9762\u7684\u8C4C\u8C46\u3002\n\u629B\u7269\u7EBF\u653B\u51FB\u548C\u5730\u523A\u80FD\u7ED5\u8FC7\u5B83\u3002",
      toughness: "\u97E7\u6027\uFF1A\u9AD8\uFF08\u4EC5\u6B63\u9762\uFF09"
    }),
    football: Z({
      id: "football",
      name: "\u6A44\u6984\u7403\u50F5\u5C38",
      hp: 200,
      armor: 1400,
      armorKind: "helmet",
      speed: 34,
      eat: 100,
      cost: 6,
      weight: 1.3,
      from: 0.45,
      desc: "\u5168\u526F\u62A4\u5177\uFF0C\u6A2A\u51B2\u76F4\u649E\u3002\n\u53C8\u5FEB\u53C8\u786C\uFF0C\u52A1\u5FC5\u4F18\u5148\u5904\u7406\u3002",
      toughness: "\u97E7\u6027\uFF1A\u5F88\u9AD8 \xB7 \u901F\u5EA6\uFF1A\u5FEB"
    }),
    garg: Z({
      id: "garg",
      name: "\u5DE8\u4EBA\u50F5\u5C38",
      hp: 3e3,
      armor: 0,
      armorKind: null,
      speed: 12,
      eat: 0,
      cost: 10,
      weight: 0.8,
      from: 0.6,
      desc: "\u7528\u7535\u7EBF\u6746\u4E00\u51FB\u7838\u70C2\u4EFB\u4F55\u690D\u7269\u3002\n\u8840\u91CF\u51CF\u534A\u65F6\u4F1A\u628A\u80CC\u4E0A\u7684\u5C0F\u9B3C\u6254\u8FDB\u4F60\u7684\u9632\u7EBF\u3002",
      toughness: "\u97E7\u6027\uFF1A\u6781\u9AD8 \xB7 \u7838\u51FB\uFF1A\u79D2\u6740\u690D\u7269"
    }),
    imp: Z({
      id: "imp",
      name: "\u5C0F\u9B3C\u50F5\u5C38",
      hp: 200,
      armor: 0,
      armorKind: null,
      speed: 28,
      eat: 100,
      cost: 1,
      weight: 0,
      from: 1,
      desc: "\u88AB\u5DE8\u4EBA\u6254\u51FA\u6765\u7684\u5C0F\u5BB6\u4F19\uFF0C\n\u843D\u5730\u540E\u98DE\u5FEB\u5730\u51B2\u5411\u4F60\u7684\u623F\u5B50\u3002",
      toughness: "\u97E7\u6027\uFF1A\u4F4E \xB7 \u901F\u5EA6\uFF1A\u5FEB"
    })
  };
  var ZOMBIE_ORDER = ["basic", "flag", "cone", "pole", "paper", "bucket", "door", "football", "garg", "imp"];

  // games-src/garden-guard/src/game/behaviors.ts
  var BLAST_HALF = 1.5 * CELL_W + 14;
  function remove(b, p) {
    p.dead = true;
    if (b.grid[p.row][p.col] === p) b.grid[p.row][p.col] = null;
  }
  function ahead(b, row, x) {
    for (const z of b.zombies) if (z.row === row && b.targetable(z) && z.x > x - 10) return z;
    return null;
  }
  function frontmost(b, row, x) {
    let best = null;
    for (const z of b.zombies) {
      if (z.row !== row || !b.targetable(z) || z.x < x - 10) continue;
      if (!best || z.x < best.x) best = z;
    }
    return best;
  }
  function shoot(b, kind, row, x, y, ty = y) {
    b.shots.push({ kind, row, x, y, ty, dmg: kind === "fire" ? 40 : 20, torch: -1, t: 0, dead: false });
    b.sfx("shoot");
  }
  function updatePlant(b, p, dt, live) {
    p.age += dt;
    p.flash = Math.max(0, p.flash - dt);
    p.anim = Math.max(0, p.anim - dt);
    if (!live) return;
    switch (p.id) {
      case "peashooter":
      case "snowpea":
      case "repeater": {
        const kind = p.id === "snowpea" ? "snow" : "pea";
        p.timer -= dt;
        if (p.timer2 >= 0) {
          p.timer2 -= dt;
          if (p.timer2 < 0) {
            shoot(b, kind, p.row, p.x + 40, p.y - 61);
            p.anim = 0.2;
            p.timer2 = -1;
          }
        }
        if (p.timer <= 0) {
          if (ahead(b, p.row, p.x)) {
            shoot(b, kind, p.row, p.x + 40, p.y - 61);
            p.anim = 0.2;
            p.timer = 1.4 + rand(-0.06, 0.06);
            if (p.id === "repeater") p.timer2 = 0.2;
          } else p.timer = 0.12;
        }
        break;
      }
      case "threepeater": {
        p.timer -= dt;
        if (p.timer > 0) break;
        const lanes = [p.row - 1, p.row, p.row + 1].filter((r) => r >= 0 && r < ROWS && b.level.rows.includes(r));
        if (!lanes.some((r) => ahead(b, r, p.x))) {
          p.timer = 0.12;
          break;
        }
        for (const r of lanes) {
          const head2 = r < p.row ? { x: p.x + 31, y: p.y - 92 } : r > p.row ? { x: p.x + 51, y: p.y - 50 } : { x: p.x + 5, y: p.y - 56 };
          shoot(b, "pea", r, head2.x, head2.y, rowFeet(r) - 58);
        }
        p.anim = 0.2;
        p.timer = 1.4 + rand(-0.06, 0.06);
        break;
      }
      case "sunflower":
        p.timer -= dt;
        if (p.timer < 1) p.anim = Math.max(p.anim, 1 - p.timer);
        if (p.timer <= 0) {
          b.sunflowerSun(p);
          p.timer = 24 + rand(-1, 1);
          p.anim = 1;
        }
        break;
      case "cherry":
        p.stateT += dt;
        if (p.stateT >= 1.1) {
          remove(b, p);
          b.explode(p.x, p.y - 40, p.row, 1, BLAST_HALF);
        }
        break;
      case "jalapeno":
        p.stateT += dt;
        if (p.stateT >= 1) {
          remove(b, p);
          b.burnRow(p.row);
        }
        break;
      case "potato":
        p.stateT += dt;
        if (p.state === "arming" && p.stateT >= 15) {
          p.state = "armed";
          b.dirt(p.x, p.y, 10);
          b.sfx("pop");
        } else if (p.state === "armed") {
          const trig = b.zombies.some((z) => z.row === p.row && b.isAlive(z) && z.lift < 6 && z.state !== "fly" && Math.abs(z.x - 22 * zombieScale(z.id) - p.x) < 40);
          if (trig) {
            remove(b, p);
            for (const z of b.zombies) {
              if (z.row === p.row && b.isAlive(z) && z.lift < 30 && Math.abs(z.x - 10 - p.x) < 82) b.damage(z, 1800, "blast");
            }
            b.burst("boom", p.x, p.y - 20, { size: 100 });
            b.dirt(p.x, p.y, 20);
            b.particles.push(b.particle("text", p.x, p.y - 80, { text: "\u7830\uFF01", life: 1.1, size: 44, color: "#fff2c4" }));
            b.shake = Math.max(b.shake, 0.35);
            b.sfx("explode");
          }
        }
        break;
      case "chomper":
        updateChomper(b, p, dt);
        break;
      case "squash":
        updateSquash(b, p, dt);
        break;
      case "spikeweed": {
        p.timer -= dt;
        if (p.timer > 0) break;
        let hit = false;
        for (const z of b.zombies) {
          if (z.row !== p.row || !b.isAlive(z) || z.state === "fly" || z.lift > 10) continue;
          if (Math.abs(z.x - 14 * zombieScale(z.id) - p.x) > 54) continue;
          b.damage(z, 20, "spike");
          hit = true;
        }
        p.timer = hit ? 1 : 0.1;
        if (hit) p.anim = 0.25;
        break;
      }
      case "cabbage": {
        p.timer -= dt;
        if (p.timer > 0) break;
        const z = frontmost(b, p.row, p.x);
        if (!z) {
          p.timer = 0.2;
          break;
        }
        b.lobs.push({ row: p.row, x0: p.x + 18, y0: p.y - 86, target: z.uid, tx: z.x, ty: z.y - 60, t: 0, dur: 1, dmg: 40, dead: false });
        b.sfx("lob");
        p.anim = 0.5;
        p.timer = 3;
        break;
      }
    }
  }
  function updateChomper(b, p, dt) {
    p.stateT += dt;
    switch (p.state) {
      case "ready": {
        for (const z of b.zombies) {
          if (z.row !== p.row || !b.targetable(z) || z.lift > 10) continue;
          const front = z.x - 24 * zombieScale(z.id);
          if (front >= p.x - 20 && front <= p.x + 112) {
            p.state = "bite";
            p.stateT = 0;
            p.target = z.uid;
            break;
          }
        }
        break;
      }
      case "bite":
        if (p.stateT >= 0.32) {
          const z = b.zombieById(p.target);
          p.stateT = 0;
          if (z && b.targetable(z) && Math.abs(z.x - 24 * zombieScale(z.id) - p.x) < 150) {
            if (z.id === "garg") {
              b.damage(z, 40, "pea");
              p.state = "swallow";
            } else {
              b.kill(z, "chomp");
              p.state = "chew";
              b.sfx("gulp");
            }
            b.sfx("bite");
          } else p.state = "ready";
        }
        break;
      case "chew":
        if (p.stateT >= 42) {
          p.state = "swallow";
          p.stateT = 0;
        }
        break;
      case "swallow":
        if (p.stateT >= 0.6) {
          p.state = "ready";
          p.stateT = 0;
        }
        break;
    }
  }
  function updateSquash(b, p, dt) {
    p.stateT += dt;
    switch (p.state) {
      case "idle": {
        let near = null;
        for (const z of b.zombies) {
          if (z.row !== p.row || !b.targetable(z) || z.lift > 10) continue;
          const dx = z.x - 20 - p.x;
          if (Math.abs(dx) < 320) p.lookX = dx > 0 ? 4 : -4;
          if (dx >= -80 && dx <= 120 && (!near || Math.abs(z.x - p.x) < Math.abs(near.x - p.x))) near = z;
        }
        if (near) {
          p.state = "aim";
          p.stateT = 0;
          p.target = near.uid;
          p.lookX = near.x - 20 > p.x ? 5 : -5;
          b.sfx("pop");
        }
        break;
      }
      case "aim":
        if (p.stateT >= 0.45) {
          const z = b.zombieById(p.target);
          p.state = "jump";
          p.stateT = 0;
          p.fromX = p.x;
          p.toX = z && b.isAlive(z) ? z.x - 16 * zombieScale(z.id) : p.x;
          if (b.grid[p.row][p.col] === p) b.grid[p.row][p.col] = null;
        }
        break;
      case "jump": {
        const z = b.zombieById(p.target);
        if (z && b.isAlive(z) && p.stateT < 0.3) p.toX = z.x - 16 * zombieScale(z.id);
        const k = clamp(p.stateT / 0.5, 0, 1);
        p.x = lerp(p.fromX, p.toX, easeInOut(k));
        if (k >= 1) {
          for (const zz of b.zombies) {
            if (zz.row !== p.row || !b.isAlive(zz) || zz.lift > 30 || zz.state === "fly") continue;
            if (Math.abs(zz.x - 14 * zombieScale(zz.id) - p.x) < 64) b.damage(zz, 1800, "crush");
          }
          b.shake = Math.max(b.shake, 0.4);
          b.sfx("squash");
          b.dirt(p.x, p.y, 14);
          b.burst("shock", p.x, p.y, {});
          p.state = "done";
          p.stateT = 0;
        }
        break;
      }
      case "done":
        if (p.stateT >= 0.8) remove(b, p);
        break;
    }
  }
  function squashLift(p) {
    if (p.state !== "jump") return 0;
    const k = clamp(p.stateT / 0.5, 0, 1);
    return Math.sin(k * Math.PI) * 130 * (1 - k * 0.3);
  }
  function blocker(b, z) {
    const s = zombieScale(z.id);
    const garg = z.id === "garg";
    const front = z.x - (garg ? 64 : 26 * s);
    const reach = z.id === "pole" && z.hasPole ? 56 : 34;
    let best = null;
    for (const p of b.plants) {
      if (p.dead || p.row !== z.row) continue;
      if (p.state === "jump" || p.state === "done") continue;
      if (PLANTS[p.id].walkable && !garg) continue;
      if (front <= p.x + reach && front >= p.x - 40 && (!best || p.x > best.x)) best = p;
    }
    return best;
  }
  function updateZombie(b, z, dt, live) {
    z.flash = Math.max(0, z.flash - dt);
    if (z.slow > 0) z.slow -= dt;
    const mul = z.slow > 0 ? 0.5 : 1;
    switch (z.state) {
      case "dying":
        z.deathT += dt;
        if (z.deathT > 2.1) z.remove = true;
        return;
      case "ash":
        z.deathT += dt;
        if (z.deathT > 1.5) z.remove = true;
        return;
      case "squashed":
        z.deathT += dt;
        if (z.deathT > 1.3) z.remove = true;
        return;
      case "mowed":
        z.deathT += dt;
        z.x += 320 * dt;
        if (z.deathT > 0.8) z.remove = true;
        return;
    }
    if (!live) return;
    z.stateT += dt * (z.state === "smash" ? mul : 1);
    switch (z.state) {
      case "fly": {
        const k = clamp(z.stateT / 0.95, 0, 1);
        z.x = lerp(z.fromX, z.toX, k);
        z.lift = Math.sin(k * Math.PI) * 200;
        if (k >= 1) {
          z.lift = 0;
          z.state = "walk";
          b.dirt(z.x, z.y, 5);
        }
        return;
      }
      case "angry":
        z.phase += dt * 3;
        if (z.stateT >= 1.1) {
          z.state = "walk";
          z.angry = true;
          z.speed = 36 * rand(0.95, 1.05);
        }
        return;
      case "vault": {
        const k = clamp(z.stateT / 0.9, 0, 1);
        z.x = lerp(z.fromX, z.toX, easeInOut(k));
        z.lift = Math.sin(k * Math.PI) * 104;
        if (k >= 1) {
          z.lift = 0;
          z.state = "walk";
          z.hasPole = false;
          z.speed = 17 * rand(0.95, 1.05);
        }
        return;
      }
      case "smash": {
        const prev = z.stateT - dt * mul;
        if (prev < 1 && z.stateT >= 1) {
          const p = b.plantById(z.target);
          if (p) b.killPlant(p, true);
          else b.burst("shock", z.x - 90, z.y, {});
          b.shake = Math.max(b.shake, 0.4);
          b.sfx("smash");
        }
        if (z.stateT >= 1.7) z.state = "walk";
        return;
      }
      case "throw": {
        const prev = z.stateT - dt;
        if (prev < 0.9 && z.stateT >= 0.9) {
          z.hasImp = false;
          const imp2 = b.makeZombie("imp", z.row, z.x - 30);
          imp2.state = "fly";
          imp2.stateT = 0;
          imp2.fromX = z.x - 30;
          imp2.toX = Math.max(LAWN_X + 30, z.x - rand(300, 430));
          imp2.wave = z.wave;
          b.zombies.push(imp2);
          b.sfx("vault");
        }
        if (z.stateT >= 1.5) z.state = "walk";
        return;
      }
      case "eat": {
        z.phase += dt * mul * 7;
        const p = b.plantById(z.target);
        if (!p || p.state === "jump") {
          z.state = "walk";
          return;
        }
        p.hp -= z.def.eat * mul * dt;
        p.flash = 0.06;
        z.biteT -= dt;
        if (z.biteT <= 0) {
          b.sfx("chomp");
          z.biteT = 0.5 / mul;
        }
        if (p.hp <= 0) {
          b.killPlant(p);
          b.sfx("gulp");
          z.state = "walk";
        }
        return;
      }
      case "walk": {
        z.x -= z.speed * mul * dt;
        z.phase += dt * mul * z.speed * 0.105;
        if (z.id === "garg" && z.hasImp && z.hp < z.maxHp / 2 && z.x > LAWN_X + 4 * CELL_W && z.x < LAWN_R) {
          z.state = "throw";
          z.stateT = 0;
          return;
        }
        const p = blocker(b, z);
        if (p) {
          if (z.id === "pole" && z.hasPole) {
            if (p.id === "tallnut") {
              z.hasPole = false;
              z.speed = 17;
              z.state = "eat";
              z.target = p.uid;
              b.sfx("hitSoft");
            } else {
              z.state = "vault";
              z.stateT = 0;
              z.fromX = z.x;
              z.toX = p.x - 70;
              b.sfx("vault");
            }
          } else if (z.id === "garg") {
            z.state = "smash";
            z.stateT = 0;
            z.target = p.uid;
          } else {
            z.state = "eat";
            z.target = p.uid;
            z.biteT = 0.2;
          }
        }
        b.checkHouse(z);
        return;
      }
    }
  }
  var SPLAT = { pea: "#7fd648", snow: "#bfe8ff", fire: "#ffb030" };
  function updateShots(b, dt) {
    for (const s of b.shots) {
      s.t += dt;
      s.x += 430 * dt;
      s.y += (s.ty - s.y) * Math.min(1, dt * 9);
      const col = colAt(s.x);
      if (col >= 0 && col < COLS) {
        const tp = b.grid[s.row][col];
        if (tp && tp.id === "torchwood" && s.torch !== col && Math.abs(s.x - tp.x) < 18) {
          s.torch = col;
          if (s.kind === "pea") {
            s.kind = "fire";
            s.dmg = 40;
            b.sfx("fire");
          } else if (s.kind === "snow") {
            s.kind = "pea";
            s.dmg = 20;
          }
        }
      }
      let hit = null;
      for (const z of b.zombies) {
        if (z.row !== s.row || !b.targetable(z) || z.lift > 60) continue;
        const sc = zombieScale(z.id);
        if (s.x >= z.x - 28 * sc && s.x <= z.x + 30 * sc && (!hit || z.x < hit.x)) hit = z;
      }
      if (hit) {
        b.damage(hit, s.dmg, "pea");
        if (s.kind === "snow" && !(hit.armorKind === "door" && hit.armor > 0)) {
          if (hit.slow <= 0) b.sfx("freeze");
          hit.slow = 10;
        }
        if (s.kind === "fire") {
          hit.slow = 0;
          for (const z of b.zombies) {
            if (z === hit || z.row !== s.row || !b.targetable(z)) continue;
            if (Math.abs(z.x - hit.x) < 72) b.damage(z, 13, "spike");
          }
          b.particles.push(b.particle("fire", s.x + 8, s.y + 18, { life: 0.4, size: 0.5 }));
        }
        b.splat(s.x + 6, s.y, SPLAT[s.kind]);
        s.dead = true;
      }
      if (s.x > VIEW_W + 40) s.dead = true;
    }
    b.shots = b.shots.filter((s) => !s.dead);
  }
  function lobPos(l) {
    const k = clamp(l.t / l.dur, 0, 1);
    return { x: lerp(l.x0, l.tx, k), y: lerp(l.y0, l.ty, k) - 4 * 160 * k * (1 - k), k };
  }
  function updateLobs(b, dt) {
    for (const l of b.lobs) {
      l.t += dt;
      const z = b.zombieById(l.target);
      if (z && b.isAlive(z)) {
        l.tx = z.x - 8;
        l.ty = z.y - 62 * zombieScale(z.id) - z.lift;
      }
      if (l.t >= l.dur) {
        if (z && b.isAlive(z) && z.state !== "fly") {
          b.damage(z, l.dmg, "lob");
          b.sfx("hitSoft");
        }
        b.splat(l.tx, l.ty, "#9ad65a");
        l.dead = true;
      }
    }
    b.lobs = b.lobs.filter((l) => !l.dead);
  }
  function updateMowers(b, dt) {
    for (const m of b.mowers) {
      if (m.state !== "run") continue;
      m.t += dt;
      m.x += 560 * dt;
      for (const z of b.zombies) {
        if (z.row !== m.row || !b.isAlive(z) || z.state === "fly") continue;
        if (z.x - 30 < m.x + 40 && z.x + 30 > m.x - 10) b.kill(z, "mow");
      }
      if (m.x > VIEW_W + 120) m.state = "gone";
    }
  }
  var BOWL_SPEED = 250;
  function updateBowls(b, dt) {
    const top = rowFeet(0);
    const bottom = rowFeet(ROWS - 1);
    for (const w of b.bowls) {
      const giant = w.id === "giantnut";
      const sp = giant ? 200 : BOWL_SPEED;
      w.x += sp * dt;
      w.rot += sp / (giant ? 60 : 30) * dt;
      if (w.vy) {
        w.y += w.vy * dt;
        if (w.y < top) {
          w.y = top;
          w.vy = Math.abs(w.vy);
        } else if (w.y > bottom) {
          w.y = bottom;
          w.vy = -Math.abs(w.vy);
        }
      }
      w.row = clamp(Math.round((w.y + 18 - LAWN_Y) / CELL_H - 1), 0, ROWS - 1);
      if (Math.abs(w.y - rowFeet(w.row)) > 40) continue;
      for (const z of b.zombies) {
        if (z.row !== w.row || !b.isAlive(z) || z.state === "fly" || z.lift > 20) continue;
        if (Math.abs(z.x - 14 * zombieScale(z.id) - w.x) > (giant ? 70 : 42) || w.hitIds.includes(z.uid)) continue;
        w.hitIds.push(z.uid);
        if (w.id === "bombnut") {
          w.dead = true;
          b.explode(w.x, w.y - 30, w.row, 1, BLAST_HALF, "\u8F70\uFF01");
          break;
        }
        if (giant) {
          b.damage(z, 3e3, "crush");
          b.shake = Math.max(b.shake, 0.18);
          b.sfx("bowl");
          continue;
        }
        b.damage(z, 900, "bowl");
        w.hits++;
        b.sfx("bowl");
        b.splat(w.x + 20, w.y - 30, "#c88a44");
        if (w.hits >= 2) {
          b.particles.push(b.particle("text", w.x, w.y - 90, { text: `\u8FDE\u51FB \xD7${w.hits}`, life: 1.1, size: 30 + w.hits * 3, color: "#ffe066", vy: -40 }));
          b.bestCombo = Math.max(b.bestCombo, w.hits);
        }
        const dir = w.vy === 0 ? w.row === 0 ? 1 : w.row === ROWS - 1 ? -1 : Math.random() < 0.5 ? -1 : 1 : w.vy > 0 ? -1 : 1;
        w.vy = dir * 230;
        break;
      }
      if (w.x > VIEW_W + 80) w.dead = true;
    }
    b.bowls = b.bowls.filter((w) => !w.dead);
  }

  // games-src/garden-guard/src/game/waves.ts
  var isEndless = (level) => level.waves === Infinity;
  function isFlagWave(level, index) {
    if (isEndless(level)) return (index + 1) % 10 === 0;
    return level.flags.includes(index + 1);
  }
  function isFinalWave(level, index) {
    return !isEndless(level) && index === level.waves - 1;
  }
  function planWave(level, index) {
    const progress = isEndless(level) ? Math.min(1, index / 24) : index / Math.max(1, level.waves - 1);
    const flag2 = isFlagWave(level, index);
    let budget = level.diff * (1 + index * 0.42);
    if (isEndless(level)) budget *= 1 + Math.max(0, index - 20) * 0.05;
    if (flag2) budget = budget * 2.2 + 1;
    budget = Math.max(1, Math.round(budget));
    const pool = level.pool.filter((id) => ZOMBIES[id].from <= progress + 1e-6 && ZOMBIES[id].weight > 0);
    const out = [];
    if (flag2) out.push("flag");
    const newest = pool.filter((id) => ZOMBIES[id].from > 0 && ZOMBIES[id].from <= progress && ZOMBIES[id].from > progress - 0.12);
    for (const id of newest) {
      if (budget >= ZOMBIES[id].cost) {
        out.push(id);
        budget -= ZOMBIES[id].cost;
      }
    }
    let guard = 0;
    while (budget > 0 && out.length < 44 && guard++ < 200) {
      const fits = pool.filter((id2) => ZOMBIES[id2].cost <= budget);
      if (!fits.length) break;
      const id = weighted(fits, (z) => ZOMBIES[z].weight * (z === "basic" ? 1 + progress : 1));
      out.push(id);
      budget -= ZOMBIES[id].cost;
    }
    return out;
  }
  function previewList(level) {
    const ids = level.pool.filter((id) => id !== "imp");
    const out = [];
    for (const id of ids) {
      const n = id === "basic" ? 3 : id === "garg" ? 1 : 2;
      for (let i = 0; i < n; i++) out.push(id);
    }
    return out.slice(0, 14);
  }

  // games-src/garden-guard/src/game/battle.ts
  var BANK_X = 102;
  var BANK_Y = 12;
  var SLOT_STEP = 70;
  var SUN_HOME = { x: 52, y: 46 };
  var BELT_LEN = MAX_SLOTS * SLOT_STEP;
  var btnMenu = { x: VIEW_W - 128, y: 10, w: 116, h: 46 };
  var btnSpeed = { x: VIEW_W - 204, y: 10, w: 66, h: 46 };
  var DEAD_STATES = /* @__PURE__ */ new Set(["dying", "ash", "squashed", "mowed"]);
  var Battle = class {
    constructor(level, host) {
      this.level = level;
      this.host = host;
      this.phase = "intro";
      this.phaseT = 0;
      this.t = 0;
      this.cam = 0;
      this.shake = 0;
      this.paused = false;
      this.speed = 1;
      this.uidSeq = 1;
      this.sunFlash = 0;
      this.plants = [];
      this.grid = [];
      this.zombies = [];
      this.previews = [];
      this.shots = [];
      this.lobs = [];
      this.suns = [];
      this.mowers = [];
      this.particles = [];
      this.bowls = [];
      this.belt = [];
      this.messages = [];
      this.slots = [];
      this.cooldown = /* @__PURE__ */ new Map();
      this.holding = null;
      this.holdBelt = -1;
      this.dragFrom = null;
      this.mx = -999;
      this.my = -999;
      this.waveIndex = 0;
      this.pendingWave = -1;
      this.pendingT = 0;
      this.waveStartHp = 0;
      this.waveSince = 0;
      this.spawnQueue = [];
      this.skyTimer = 5;
      this.beltTimer = 1;
      this.chosen = [];
      this.lastDeath = { x: VIEW_W / 2, y: 400 };
      this.reward = null;
      this.combo = 0;
      this.bestCombo = 0;
      this.tipT = 0;
      this.lostBy = null;
      /** Width of a cell, exposed for behaviors. */
      this.cellW = CELL_W;
      this.cellH = CELL_H;
      this.sun = level.startSun;
      this.waveTimer = level.firstWave;
      for (let r = 0; r < ROWS; r++) this.grid.push(new Array(COLS).fill(null));
      for (const r of level.rows) this.mowers.push({ row: r, x: MOWER_X, state: "idle", t: 0 });
      this.available = PLANT_ORDER.filter((id) => host.save.plants.includes(id));
      this.needChooser = this.usesSlots && this.available.length > MAX_SLOTS;
      if (!this.needChooser) this.slots = this.usesSlots ? [...this.available] : [];
      this.makePreviews();
      const seen = new Set(host.save.seen);
      for (const id of level.pool) seen.add(id);
      if (level.pool.includes("garg")) seen.add("imp");
      host.save.seen = [...seen];
    }
    get audio() {
      return this.host.audio;
    }
    get usesSlots() {
      return this.level.mode === "normal" || this.level.mode === "endless";
    }
    get usesBelt() {
      return this.level.mode === "bowling" || this.level.mode === "conveyor";
    }
    get bowling() {
      return this.level.mode === "bowling";
    }
    sfx(s) {
      this.audio.play(s);
    }
    uid() {
      return this.uidSeq++;
    }
    // ------------------------------------------------------------- lifecycle
    makePreviews() {
      const list = previewList(this.level);
      const spots = [];
      for (const id of list) {
        let best = { x: 0, y: 0 };
        let bestD = -1;
        for (let k = 0; k < 14; k++) {
          const c = { x: rand(LAWN_R + 230, LAWN_R + 560), y: rand(LAWN_Y + 90, LAWN_B - 6) };
          const d = Math.min(9999, ...spots.map((s) => Math.hypot((s.x - c.x) * 0.8, s.y - c.y)));
          if (d > bestD) {
            bestD = d;
            best = c;
          }
        }
        spots.push(best);
        const z = this.makeZombie(id, 0, best.x);
        z.y = best.y;
        z.state = "walk";
        z.phase = rand(0, 6);
        this.previews.push(z);
      }
      this.previews.sort((a, b) => a.y - b.y);
    }
    makeZombie(id, row, x) {
      const def = ZOMBIES[id];
      return {
        uid: this.uid(),
        id,
        def,
        row,
        x,
        y: rowFeet(row),
        lift: 0,
        hp: def.hp,
        maxHp: def.hp,
        armor: def.armor,
        armorMax: def.armor,
        armorKind: def.armorKind,
        speed: def.speed * rand(0.92, 1.08),
        state: "walk",
        stateT: 0,
        phase: rand(0, 6.28),
        deathT: 0,
        slow: 0,
        flash: 0,
        hasArm: true,
        hasHead: true,
        hasPole: id === "pole",
        hasImp: id === "garg",
        angry: false,
        target: 0,
        biteT: 0,
        wave: this.waveIndex,
        fromX: 0,
        toX: 0,
        remove: false
      };
    }
    setPhase(p) {
      this.phase = p;
      this.phaseT = 0;
    }
    startPlay() {
      this.setPhase("play");
      this.audio.music("battle");
      this.tipT = this.level.tip ? 11 : 0;
      if (this.usesBelt) {
        this.beltTimer = 0.6;
      }
    }
    // ------------------------------------------------------------- update
    update(dt) {
      this.t += dt;
      this.phaseT += dt;
      this.shake = Math.max(0, this.shake - dt * 1.6);
      this.sunFlash = Math.max(0, this.sunFlash - dt);
      for (const m of this.messages) m.t += dt;
      this.messages = this.messages.filter((m) => m.t < m.dur);
      for (const z of this.previews) z.phase += dt * 1.6;
      switch (this.phase) {
        case "intro": {
          const k = clamp((this.phaseT - 0.7) / 1.8, 0, 1);
          this.cam = easeInOut(k) * STREET_CAM;
          if (this.phaseT > 2.9) {
            if (this.needChooser) this.setPhase("choose");
            else if (this.phaseT > 4.2) this.setPhase("back");
          }
          break;
        }
        case "choose":
          this.cam = STREET_CAM;
          break;
        case "back": {
          const k = clamp(this.phaseT / 1.5, 0, 1);
          this.cam = (1 - easeInOut(k)) * STREET_CAM;
          if (k >= 1) {
            this.cam = 0;
            this.setPhase("ready");
            this.messages.push({ text: "\u51C6\u5907\u2026\u2026", t: 0, dur: 0.7, style: "ready" });
            this.sfx("ready");
          }
          break;
        }
        case "ready":
          if (this.phaseT > 0.7 && this.phaseT - dt <= 0.7) {
            this.messages.push({ text: "\u5C31\u4F4D\u2026\u2026", t: 0, dur: 0.7, style: "ready" });
            this.sfx("ready");
          }
          if (this.phaseT > 1.4 && this.phaseT - dt <= 1.4) {
            this.messages.push({ text: "\u79CD\u690D\uFF01", t: 0, dur: 1.1, style: "huge" });
            this.sfx("plantGo");
          }
          if (this.phaseT > 1.6) this.startPlay();
          break;
        case "play":
          this.updatePlay(dt);
          break;
        case "won":
          this.updateWorld(dt, false);
          if (this.reward) {
            const r = this.reward;
            r.t += dt;
            if (r.y < r.floor || r.vy < 0) {
              r.vy += 900 * dt;
              r.y += r.vy * dt;
              if (r.y >= r.floor) {
                r.y = r.floor;
                r.vy = 0;
              }
            }
          }
          break;
        case "reward":
          this.updateWorld(dt, false);
          if (this.phaseT > 2.6) this.host.finish(this.result(true), "reward");
          break;
        case "lost":
          this.updateLost(dt);
          break;
      }
      this.updateParticles(dt);
    }
    updatePlay(dt) {
      if (this.tipT > 0) this.tipT -= dt;
      for (const [id, cd] of this.cooldown) this.cooldown.set(id, Math.max(0, cd - dt));
      this.updateWaves(dt);
      if (this.level.skySun) {
        this.skyTimer -= dt;
        if (this.skyTimer <= 0) {
          this.skyTimer = rand(8.5, 11.5);
          const x = rand(LAWN_X + 40, LAWN_R - 80);
          this.suns.push(this.makeSun(x, -40, 0, 70, rand(LAWN_Y + 70, LAWN_B - 40), 25, "fall"));
        }
      }
      if (this.usesBelt) this.updateBelt(dt);
      this.updateWorld(dt, true);
      this.checkWin();
    }
    updateWorld(dt, live) {
      for (const p of this.plants) if (!p.dead) updatePlant(this, p, dt, live);
      for (const z of this.zombies) updateZombie(this, z, dt, live);
      updateShots(this, dt);
      updateLobs(this, dt);
      updateMowers(this, dt);
      updateBowls(this, dt);
      this.updateSuns(dt);
      this.plants = this.plants.filter((p) => !p.dead);
      this.zombies = this.zombies.filter((z) => !z.remove);
    }
    updateLost(dt) {
      const z = this.lostBy;
      if (z && z.x > -60) {
        z.x -= 22 * dt;
        z.phase += dt * 2.4;
      }
      if (this.phaseT > 1 && this.phaseT - dt <= 1) {
        this.messages.push({ text: "\u50F5\u5C38\u95EF\u8FDB\u4E86\u4F60\u7684\u623F\u5B50\u2026\u2026", t: 0, dur: 999, style: "warn" });
        this.sfx("groan");
      }
    }
    updateParticles(dt) {
      for (const p of this.particles) {
        p.life -= dt;
        p.vy += p.g * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
        if (p.y > p.floor && p.g > 0) {
          p.y = p.floor;
          p.vy *= -0.35;
          p.vx *= 0.6;
          p.vr *= 0.5;
          if (Math.abs(p.vy) < 30) p.vy = 0;
        }
      }
      this.particles = this.particles.filter((p) => p.life > 0);
    }
    // ------------------------------------------------------------- waves
    get totalWaves() {
      return this.level.waves;
    }
    get progress() {
      if (isEndless(this.level)) return 0;
      return clamp(this.waveIndex / this.level.waves, 0, 1);
    }
    updateWaves(dt) {
      const endless = isEndless(this.level);
      if (this.pendingWave >= 0) {
        this.pendingT -= dt;
        if (this.pendingT <= 0) {
          this.spawnWave(this.pendingWave);
          this.pendingWave = -1;
        }
      } else if (endless || this.waveIndex < this.level.waves) {
        this.waveTimer -= dt;
        this.waveSince += dt;
        if (this.waveIndex > 0 && this.waveSince > 6 && this.waveStartHp > 0) {
          const alive = this.waveHp(this.waveIndex - 1);
          if (alive < this.waveStartHp * 0.4) this.waveTimer = Math.min(this.waveTimer, 2.2);
        }
        if (this.waveTimer <= 0) this.launchWave();
      }
      for (const q2 of this.spawnQueue) {
        q2.at -= dt;
        if (q2.at <= 0) this.spawnZombie(q2.id, q2.wave);
      }
      this.spawnQueue = this.spawnQueue.filter((q2) => q2.at > 0);
    }
    waveHp(wave) {
      let hp = 0;
      for (const z of this.zombies) if (z.wave === wave && !DEAD_STATES.has(z.state)) hp += Math.max(0, z.hp) + Math.max(0, z.armor);
      for (const q2 of this.spawnQueue) if (q2.wave === wave) hp += ZOMBIES[q2.id].hp + ZOMBIES[q2.id].armor;
      return hp;
    }
    launchWave() {
      const i = this.waveIndex;
      this.waveIndex++;
      if (isFlagWave(this.level, i)) {
        this.messages.push({ text: "\u5927\u6279\u50F5\u5C38\u6B63\u5728\u903C\u8FD1\uFF01", t: 0, dur: 3.2, style: "warn" });
        this.sfx("siren");
        this.audio.intense = true;
        this.pendingWave = i;
        this.pendingT = 3.2;
        if (isFinalWave(this.level, i)) {
          window.setTimeout(() => {
            if (this.phase === "play") this.messages.push({ text: "\u6700\u540E\u4E00\u6CE2\uFF01", t: 0, dur: 2.4, style: "final" });
          }, 3300);
        }
      } else this.spawnWave(i);
      this.waveTimer = (this.bowling ? 17 : 24) + rand(0, 4);
      if (isFlagWave(this.level, i)) this.waveTimer += 6;
      this.waveSince = 0;
    }
    spawnWave(i) {
      const ids = planWave(this.level, i);
      const flag2 = isFlagWave(this.level, i);
      let hp = 0;
      ids.forEach((id, k) => {
        const at = id === "flag" ? 0 : rand(0, flag2 ? 4.5 : 2.5) + k * (flag2 ? 0.12 : 0.3);
        this.spawnQueue.push({ id, at, wave: i });
        hp += ZOMBIES[id].hp + ZOMBIES[id].armor;
      });
      this.waveStartHp = hp;
      if (i === 0) this.sfx("groan");
      if (!flag2) window.setTimeout(() => this.audio.intense = false, 8e3);
    }
    spawnZombie(id, wave) {
      const rows = this.level.rows;
      const load = rows.map((r) => this.zombies.filter((z2) => z2.row === r && z2.x > LAWN_R - 200).length);
      const row = weighted(rows, (r) => 1 / (1 + load[rows.indexOf(r)] * 1.5));
      const z = this.makeZombie(id, row, SPAWN_X + rand(0, 46));
      z.wave = wave;
      this.zombies.push(z);
      if (Math.random() < 0.25) this.sfx("groan");
    }
    checkWin() {
      if (isEndless(this.level)) return;
      if (this.waveIndex < this.level.waves || this.pendingWave >= 0 || this.spawnQueue.length) return;
      if (this.zombies.some((z) => !DEAD_STATES.has(z.state))) return;
      this.setPhase("won");
      this.audio.music(null);
      this.audio.intense = false;
      this.sfx("win");
      this.holding = null;
      const ld = this.lastDeath;
      this.reward = { x: clamp(ld.x, LAWN_X + 60, LAWN_R - 60), y: ld.y - 70, vy: -360, floor: ld.y - 40, t: 0 };
    }
    result(won) {
      return {
        level: this.level,
        won,
        score: this.bowling ? this.bestCombo : isEndless(this.level) ? Math.max(0, this.waveIndex - 1) : 0
      };
    }
    lose(z) {
      if (this.phase !== "play") return;
      this.lostBy = z;
      this.setPhase("lost");
      this.holding = null;
      this.audio.music(null);
      this.audio.intense = false;
      this.sfx("lose");
    }
    // ------------------------------------------------------------- combat helpers
    isAlive(z) {
      return !DEAD_STATES.has(z.state) && !z.remove;
    }
    targetable(z) {
      return this.isAlive(z) && z.state !== "fly" && z.x < LAWN_R + 36;
    }
    zombieById(uid) {
      return this.zombies.find((z) => z.uid === uid);
    }
    plantById(uid) {
      return this.plants.find((p) => p.uid === uid && !p.dead);
    }
    damage(z, amount, kind) {
      if (!this.isAlive(z)) return;
      z.flash = 0.12;
      let rest = amount;
      const hadArmor = z.armor > 0;
      if (z.armor > 0 && z.armorKind) {
        const bypass = z.armorKind === "door" && (kind === "lob" || kind === "spike");
        if (kind === "blast" || kind === "crush") {
          z.armor = Math.max(0, z.armor - amount);
        } else if (!bypass) {
          const take = Math.min(z.armor, rest);
          z.armor -= take;
          rest -= take;
          if (kind === "pea") this.sfx(z.armorKind === "bucket" || z.armorKind === "door" || z.armorKind === "helmet" ? "hitMetal" : "hitSoft");
        }
      } else if (kind === "pea") this.sfx("hit");
      if (hadArmor && z.armor <= 0) this.armorBreak(z);
      z.hp -= rest;
      if (z.hasArm && z.hp < z.maxHp * 0.5 && z.id !== "garg" && z.hp > 0) {
        z.hasArm = false;
        this.burst("arm", z.x - 14, z.y - 96, { zid: z.id, floor: z.y - 4 });
      }
      if (z.hp <= 0) this.kill(z, kind);
    }
    armorBreak(z) {
      const kind = z.armorKind;
      if (kind === "paper") {
        for (let i = 0; i < 8; i++) this.burst("leaf", z.x - 50, z.y - 100, { color: "#ecebe3", floor: z.y });
        if (this.isAlive(z) && z.hp > 0 && (z.state === "walk" || z.state === "eat")) {
          z.state = "angry";
          z.stateT = 0;
          this.sfx("groan");
        }
        return;
      }
      const hy = z.y - 150 * zombieScale(z.id);
      this.burst("armor", kind === "door" ? z.x - 46 : z.x - 10, kind === "door" ? z.y - 80 : hy, { armorKind: kind, floor: z.y - 6 });
    }
    kill(z, kind) {
      if (!this.isAlive(z)) return;
      z.hp = Math.min(z.hp, 0);
      z.deathT = 0;
      z.lift = Math.min(z.lift, 0);
      this.lastDeath = { x: z.x, y: z.y };
      if (kind === "blast") z.state = "ash";
      else if (kind === "crush") z.state = "squashed";
      else if (kind === "mow") z.state = "mowed";
      else if (kind === "chomp") {
        z.state = "dying";
        z.remove = true;
      } else {
        z.state = "dying";
        if (z.hasHead) {
          z.hasHead = false;
          this.burst("head", z.x - 14, z.y - 130 * (z.id === "garg" ? 1.6 : z.id === "imp" ? 0.7 : 1), { zid: z.id, floor: z.y - 8 });
        }
      }
      if (z.hasImp && z.id === "garg") z.hasImp = false;
    }
    explode(x, y, row, rowsSpan, halfW, label) {
      for (const z of this.zombies) {
        if (!this.isAlive(z) || z.state === "fly") continue;
        if (Math.abs(z.row - row) > rowsSpan) continue;
        if (Math.abs(z.x - 10 - x) > halfW) continue;
        this.damage(z, 1800, "blast");
      }
      this.burst("boom", x, y, { size: 150 + rowsSpan * 30 });
      for (let i = 0; i < 14; i++) this.burst("smoke", x + rand(-60, 60), y + rand(-40, 30));
      this.shake = Math.max(this.shake, 0.55);
      this.sfx("explode");
      if (label) this.particles.push(this.particle("text", x, y - 40, { text: label, life: 1.2, size: 46, color: "#fff2c4" }));
    }
    burnRow(row) {
      for (const z of this.zombies) {
        if (z.row !== row || !this.isAlive(z) || z.state === "fly" || z.x > LAWN_R + 80) continue;
        this.damage(z, 1800, "blast");
      }
      for (let x = LAWN_X + 10; x < LAWN_R + 40; x += 34) {
        this.particles.push(this.particle("fire", x + rand(-8, 8), rowFeet(row) + 4, { life: rand(0.9, 1.3), size: rand(0.9, 1.3) }));
      }
      this.shake = Math.max(this.shake, 0.45);
      this.sfx("fire");
      this.sfx("explode");
    }
    killPlant(p, crushed = false) {
      if (p.dead) return;
      p.dead = true;
      if (this.grid[p.row][p.col] === p) this.grid[p.row][p.col] = null;
      for (let i = 0; i < (crushed ? 12 : 6); i++) this.burst("leaf", p.x, p.y - 30, { color: pick(["#5cbf2a", "#3c9a21", "#8bd650"]), floor: p.y });
      if (crushed) this.burst("shock", p.x, p.y, {});
    }
    // ------------------------------------------------------------- particles
    particle(kind, x, y, o = {}) {
      const life = o.life ?? 1;
      return {
        kind,
        x,
        y,
        vx: 0,
        vy: 0,
        g: 0,
        floor: 9999,
        life,
        max: life,
        size: 6,
        color: "#ffffff",
        rot: 0,
        vr: 0,
        ...o,
        ...o.life != null ? { max: o.life } : {}
      };
    }
    burst(kind, x, y, o = {}) {
      switch (kind) {
        case "head":
          this.particles.push(this.particle("head", x, y, { vx: rand(30, 90), vy: rand(-260, -160), g: 900, vr: rand(4, 9), life: 1.8, ...o }));
          break;
        case "arm":
          this.particles.push(this.particle("arm", x, y, { vx: rand(-40, 30), vy: rand(-200, -120), g: 900, vr: rand(-8, 8), life: 1.6, ...o }));
          break;
        case "armor":
          this.particles.push(this.particle("armor", x, y, { vx: rand(40, 110), vy: rand(-320, -220), g: 950, vr: rand(4, 9), life: 1.8, ...o }));
          break;
        case "leaf":
          this.particles.push(
            this.particle("leaf", x, y, { vx: rand(-140, 140), vy: rand(-320, -120), g: 800, vr: rand(-12, 12), life: rand(0.7, 1.2), size: rand(5, 9), ...o })
          );
          break;
        case "boom":
          this.particles.push(this.particle("boom", x, y, { life: 0.75, size: o.size ?? 160 }));
          for (let i = 0; i < 26; i++) {
            const a = rand(0, Math.PI * 2);
            const s = rand(200, 520);
            this.particles.push(
              this.particle("dot", x, y, { vx: Math.cos(a) * s, vy: Math.sin(a) * s - 100, g: 600, life: rand(0.4, 0.9), size: rand(3, 7), color: pick(["#ffd04a", "#ff7a1a", "#fff3b0", "#5a3a1a"]) })
            );
          }
          break;
        case "smoke":
          this.particles.push(this.particle("smoke", x, y, { vx: rand(-30, 30), vy: rand(-70, -30), life: rand(0.8, 1.4), size: rand(16, 30), ...o }));
          break;
        case "shock":
          this.particles.push(this.particle("shock", x, y, { life: 0.6, size: 90 }));
          for (let i = 0; i < 10; i++) this.particles.push(this.particle("dot", x + rand(-40, 40), y - 4, { vx: rand(-160, 160), vy: rand(-280, -80), g: 900, life: 0.8, size: rand(3, 6), color: "#7a5634", floor: y }));
          break;
        default:
          this.particles.push(this.particle(kind, x, y, o));
      }
    }
    splat(x, y, color) {
      this.particles.push(this.particle("splat", x, y, { life: 0.22, size: 14, color }));
      for (let i = 0; i < 4; i++) {
        this.particles.push(this.particle("dot", x, y, { vx: rand(-120, 60), vy: rand(-160, 40), g: 700, life: 0.35, size: rand(2, 4), color }));
      }
    }
    dirt(x, y, n = 8) {
      for (let i = 0; i < n; i++) {
        this.particles.push(this.particle("dot", x + rand(-20, 20), y - 4, { vx: rand(-110, 110), vy: rand(-260, -90), g: 900, life: 0.7, size: rand(2.5, 5), color: pick(["#7a5634", "#9b7448", "#5c3d22"]), floor: y + 4 }));
      }
    }
    // ------------------------------------------------------------- sun
    makeSun(x, y, vx, vy, floor, value, state) {
      return { x, y, vx, vy, floor, t: 0, life: 9, value, state, fromX: 0, fromY: 0, ct: 0, dead: false };
    }
    updateSuns(dt) {
      for (const s of this.suns) {
        s.t += dt;
        if (s.state === "fall") {
          s.y += s.vy * dt;
          if (s.y >= s.floor) {
            s.y = s.floor;
            s.state = "idle";
          }
        } else if (s.state === "pop") {
          s.vy += 700 * dt;
          s.x += s.vx * dt;
          s.y += s.vy * dt;
          if (s.vy > 0 && s.y >= s.floor) {
            s.y = s.floor;
            s.state = "idle";
          }
        } else if (s.state === "idle") {
          s.life -= dt;
          if (s.life <= 0) s.dead = true;
        } else {
          s.ct += dt;
          const k = clamp(s.ct / 0.55, 0, 1);
          const e = 1 - Math.pow(1 - k, 2);
          s.x = s.fromX + (SUN_HOME.x + this.cam - s.fromX) * e;
          s.y = s.fromY + (SUN_HOME.y - s.fromY) * e;
          if (k >= 1) s.dead = true;
        }
      }
      this.suns = this.suns.filter((s) => !s.dead);
    }
    collectSun(s) {
      s.state = "collect";
      s.fromX = s.x;
      s.fromY = s.y;
      s.ct = 0;
      this.sun = Math.min(9990, this.sun + s.value);
      this.sfx("sun");
    }
    // ------------------------------------------------------------- belt
    updateBelt(dt) {
      this.beltTimer -= dt;
      const max = MAX_SLOTS + 2;
      if (this.beltTimer <= 0 && this.belt.length < max) {
        const list = this.level.conveyor ?? [];
        const id = weighted(list, (it) => it.w).id;
        this.belt.push({ id, x: BELT_LEN + 10 });
        const early = this.t < 30;
        this.beltTimer = this.bowling ? early ? rand(2.2, 3) : rand(3.4, 4.6) : early ? rand(3.5, 4.5) : rand(6, 7.5);
      }
      let minX = 0;
      for (const it of this.belt) {
        it.x = Math.max(minX, it.x - 70 * dt);
        minX = it.x + SLOT_STEP;
      }
    }
    // ------------------------------------------------------------- input
    get overlay() {
      return this.paused || this.phase === "choose" || this.phase === "lost" || this.phase === "reward";
    }
    slotRect(i) {
      return { x: BANK_X + i * SLOT_STEP, y: BANK_Y, w: PACKET_W, h: PACKET_H };
    }
    get shovelRect() {
      return { x: BANK_X + MAX_SLOTS * SLOT_STEP + 14, y: 12, w: 84, h: 84 };
    }
    inRect(x, y, r) {
      return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
    }
    cellAt(x, y) {
      const wx = x + this.cam;
      if (wx < LAWN_X || wx >= LAWN_R || y < LAWN_Y || y >= LAWN_B) return null;
      return { row: rowAt(y), col: colAt(wx) };
    }
    canPlace(_id, row, col) {
      if (!this.level.rows.includes(row)) return false;
      if (this.bowling) return col <= 2;
      return !this.grid[row][col];
    }
    canAfford(id) {
      if (!this.usesSlots) return true;
      return this.sun >= PLANTS[id].cost && (this.cooldown.get(id) ?? 0) <= 0;
    }
    pointerMove(x, y) {
      this.mx = x;
      this.my = y;
    }
    pointerDown(x, y, button) {
      this.mx = x;
      this.my = y;
      if (button === 2) {
        this.holding = null;
        return;
      }
      if (this.overlay) return;
      if (this.phase === "won") {
        const r = this.reward;
        if (r && Math.hypot(x + this.cam - r.x, y - r.y) < 60) {
          this.setPhase("reward");
          this.sfx("reward");
        }
        return;
      }
      if (this.phase !== "play") return;
      const wx = x + this.cam;
      for (let i = this.suns.length - 1; i >= 0; i--) {
        const s = this.suns[i];
        if (s.state !== "collect" && Math.hypot(s.x - wx, s.y - y) < 46) {
          this.collectSun(s);
          return;
        }
      }
      if (this.inRect(x, y, btnMenu)) {
        this.paused = true;
        this.sfx("click");
        return;
      }
      if (this.inRect(x, y, btnSpeed)) {
        this.speed = this.speed === 1 ? 2 : 1;
        this.sfx("click");
        return;
      }
      if (!this.bowling && this.inRect(x, y, this.shovelRect)) {
        this.holding = this.holding === "shovel" ? null : "shovel";
        this.sfx(this.holding ? "shovel" : "click");
        return;
      }
      if (this.usesSlots) {
        for (let i = 0; i < this.slots.length; i++) {
          if (this.inRect(x, y, this.slotRect(i))) {
            this.selectSlot(i);
            this.dragFrom = { x, y };
            return;
          }
        }
      } else {
        for (let i = 0; i < this.belt.length; i++) {
          const it = this.belt[i];
          if (this.inRect(x, y, { x: BANK_X + it.x, y: BANK_Y, w: PACKET_W, h: PACKET_H })) {
            if (this.holding === it.id && this.holdBelt === i) this.holding = null;
            else {
              this.holding = it.id;
              this.holdBelt = i;
              this.sfx("pick");
            }
            this.dragFrom = { x, y };
            return;
          }
        }
      }
      const cell = this.cellAt(x, y);
      if (cell && this.holding) {
        this.applyHolding(cell.row, cell.col);
        return;
      }
      if (this.holding) this.holding = null;
    }
    pointerUp(x, y) {
      const from = this.dragFrom;
      this.dragFrom = null;
      if (!from || !this.holding || this.holding === "shovel" || this.phase !== "play") return;
      if (Math.hypot(x - from.x, y - from.y) < 24) return;
      const cell = this.cellAt(x, y);
      if (cell) this.applyHolding(cell.row, cell.col);
    }
    selectSlot(i) {
      const id = this.slots[i];
      if (!id) return;
      if (this.holding === id) {
        this.holding = null;
        return;
      }
      if (!this.canAfford(id)) {
        this.sfx("buzz");
        if (this.sun < PLANTS[id].cost) this.sunFlash = 0.5;
        return;
      }
      this.holding = id;
      this.sfx("pick");
    }
    key(k) {
      if (this.phase !== "play") return;
      if (k === "Escape" || k === " ") {
        if (this.holding && k === "Escape") this.holding = null;
        else this.paused = !this.paused;
        return;
      }
      if (this.paused) return;
      if (k === "f" || k === "F") this.speed = this.speed === 1 ? 2 : 1;
      if ((k === "q" || k === "Q" || k === "s" || k === "S") && !this.bowling) {
        this.holding = this.holding === "shovel" ? null : "shovel";
      }
      const n = Number(k);
      if (n >= 1 && n <= 9) {
        if (this.usesSlots) this.selectSlot(n - 1);
        else if (this.belt[n - 1]) {
          this.holding = this.belt[n - 1].id;
          this.holdBelt = n - 1;
        }
      }
    }
    applyHolding(row, col) {
      const h = this.holding;
      if (!h) return;
      if (h === "shovel") {
        const p = this.grid[row][col];
        if (p) {
          this.killPlant(p);
          this.dirt(p.x, p.y);
          this.sfx("shovel");
        }
        this.holding = null;
        return;
      }
      if (!this.canPlace(h, row, col)) {
        this.sfx("buzz");
        return;
      }
      if (this.usesSlots) {
        if (!this.canAfford(h)) {
          this.sfx("buzz");
          return;
        }
        this.sun -= PLANTS[h].cost;
        this.cooldown.set(h, PLANTS[h].cooldown);
      } else {
        this.belt.splice(this.holdBelt, 1);
        this.holdBelt = -1;
      }
      this.holding = null;
      if (PLANTS[h].bowling) {
        this.bowls.push({ id: h, row, x: colCenter(col), y: rowFeet(row), vy: 0, toRow: row, rot: 0, hits: 0, hitIds: [], dead: false });
        this.sfx("bowl");
        return;
      }
      this.place(h, row, col);
    }
    place(id, row, col) {
      const def = PLANTS[id];
      const p = {
        uid: this.uid(),
        id,
        row,
        col,
        x: colCenter(col),
        y: rowFeet(row),
        hp: def.hp,
        maxHp: def.hp,
        age: 0,
        timer: 0.5,
        timer2: -1,
        anim: 0,
        state: "idle",
        stateT: 0,
        flash: 0,
        dead: false,
        target: 0,
        fromX: 0,
        toX: 0,
        lookX: 3
      };
      switch (id) {
        case "sunflower":
          p.timer = rand(5, 8);
          break;
        case "cherry":
        case "jalapeno":
          p.state = "fuse";
          break;
        case "potato":
          p.state = "arming";
          break;
        case "chomper":
          p.state = "ready";
          break;
        case "cabbage":
          p.timer = 1.2;
          break;
        case "spikeweed":
          p.timer = 0;
          break;
      }
      this.plants.push(p);
      this.grid[row][col] = p;
      this.sfx("plant");
      this.dirt(p.x, p.y, 6);
      return p;
    }
    // ------------------------------------------------------------- chooser
    toggleChoice(id) {
      const i = this.chosen.indexOf(id);
      if (i >= 0) this.chosen.splice(i, 1);
      else if (this.chosen.length < MAX_SLOTS) this.chosen.push(id);
      else {
        this.sfx("buzz");
        return;
      }
      this.sfx("pick");
    }
    confirmChoice() {
      if (!this.chosen.length) {
        this.sfx("buzz");
        return;
      }
      this.slots = [...this.chosen];
      this.setPhase("back");
      this.sfx("click");
    }
    // Mower trigger and house check are shared with behaviors.
    checkHouse(z) {
      const m = this.mowers.find((mm) => mm.row === z.row);
      if (m && m.state === "idle" && z.x - 20 < MOWER_X + 34) {
        m.state = "run";
        this.sfx("mower");
      }
      if (z.x < HOUSE_X - 24 && (!m || m.state === "gone")) this.lose(z);
    }
    sunflowerSun(p) {
      this.suns.push(this.makeSun(p.x + rand(-10, 10), p.y - 70, rand(-60, 60), -260, p.y - 18 + rand(-6, 6), 25, "pop"));
    }
  };

  // games-src/garden-guard/src/game/render.ts
  function plantView(b, p) {
    const v = { t: b.t + p.uid * 0.37, anim: p.anim, hp: p.hp / p.maxHp, state: p.state, stateT: p.stateT, lookX: p.lookX };
    if (p.id === "cabbage") v.loaded = p.timer < 2.4;
    if (p.id === "squash" && p.state === "jump") v.state = "idle";
    return v;
  }
  function zombieView(b, z) {
    return {
      id: z.id,
      t: b.t + z.uid * 0.21,
      phase: z.phase,
      state: z.state,
      stateT: z.stateT,
      deathT: z.deathT,
      hasArm: z.hasArm,
      hasHead: z.hasHead,
      hasPole: z.hasPole,
      hasImp: z.hasImp,
      armorKind: z.armorKind,
      armor: z.armorMax ? Math.max(0, z.armor) / z.armorMax : 0,
      angry: z.angry
    };
  }
  function zombieTint(z) {
    if (z.state === "ash") return "ash";
    if (z.slow > 0) return z.flash > 0 ? "frostflash" : "frost";
    return z.flash > 0 ? "flash" : "normal";
  }
  function drawZ(ctx, b, z) {
    setTint(zombieTint(z));
    drawZombie(ctx, z.x, z.y, zombieView(b, z), z.lift);
    setTint("normal");
    if (z.state === "ash" && z.deathT > 0.6) {
      const k = clamp((z.deathT - 0.6) / 0.9, 0, 1);
      ctx.fillStyle = `rgba(40,40,40,${0.6 * (1 - k)})`;
      for (let i = 0; i < 12; i++) {
        const sx = z.x - 30 + i * 37 % 50;
        ctx.fillRect(sx, z.y - 120 + k * 110 + i * 53 % 90 * (1 - k), 4, 4);
      }
    }
  }
  function drawP(ctx, b, p) {
    const lift = p.id === "squash" ? squashLift(p) : 0;
    ctx.save();
    if (p.id === "squash" && p.state === "done") ctx.globalAlpha = clamp(1 - (p.stateT - 0.4) / 0.4, 0, 1);
    setTint(p.flash > 0 ? "flash" : "normal");
    drawPlant(ctx, p.id, p.x, p.y - lift, plantView(b, p));
    setTint("normal");
    ctx.restore();
  }
  function drawParticle(ctx, b, p) {
    const k = clamp(p.life / p.max, 0, 1);
    ctx.save();
    switch (p.kind) {
      case "dot":
        ctx.globalAlpha = Math.min(1, k * 2);
        circle(ctx, p.x, p.y, p.size);
        paint(ctx, p.color);
        break;
      case "splat":
        ctx.globalAlpha = k;
        for (let i = 0; i < 5; i++) {
          const a = i * 1.26 + p.x;
          circle(ctx, p.x + Math.cos(a) * p.size * (1.2 - k), p.y + Math.sin(a) * p.size * (1.2 - k), p.size * 0.35 * (0.5 + k));
          paint(ctx, p.color);
        }
        break;
      case "smoke":
        ctx.globalAlpha = k * 0.55;
        circle(ctx, p.x, p.y, p.size * (1.6 - k * 0.6));
        paint(ctx, "#5a5652");
        break;
      case "fire":
        ctx.globalAlpha = Math.min(1, k * 1.6);
        flame(ctx, p.x, p.y, p.size * (0.7 + 0.3 * k), b.t + p.x);
        break;
      case "boom": {
        const r = p.size * (0.35 + (1 - k) * 0.9);
        ctx.globalAlpha = k;
        circle(ctx, p.x, p.y, r);
        paint(ctx, radial(ctx, p.x, p.y, r * 0.1, p.x, p.y, r, [[0, "#ffffff"], [0.25, "#fff2a0"], [0.55, "#ff9a2a"], [0.85, "#d2401a"], [1, "#5a1a0a00"]]));
        if (k > 0.75) {
          ctx.globalAlpha = (k - 0.75) * 2.4;
          ctx.fillStyle = "#fffbe0";
          ctx.fillRect(b.cam, 0, VIEW_W, VIEW_H);
        }
        break;
      }
      case "text": {
        const pop = easeOutBack(clamp((p.max - p.life) / 0.25, 0, 1));
        ctx.globalAlpha = Math.min(1, k * 3);
        ctx.translate(p.x, p.y);
        ctx.scale(pop, pop);
        text(ctx, p.text ?? "", 0, 0, { size: p.size, color: p.color, stroke: "#4a1a04", lw: Math.max(5, p.size / 7), weight: 900 });
        break;
      }
      case "head":
        ctx.globalAlpha = Math.min(1, k * 2.5);
        drawZombieHead(ctx, p.zid ?? "basic", p.x, p.y, p.rot, 1);
        break;
      case "arm": {
        ctx.globalAlpha = Math.min(1, k * 2.5);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.lineCap = "round";
        ctx.lineWidth = 12;
        ctx.strokeStyle = "#2a2219";
        ctx.beginPath();
        ctx.moveTo(0, -12);
        ctx.lineTo(0, 12);
        ctx.stroke();
        ctx.lineWidth = 9;
        ctx.strokeStyle = p.zid === "pole" ? "#e6e1d6" : p.zid === "football" ? "#c8242c" : "#7d6850";
        ctx.stroke();
        circle(ctx, 0, 16, 6);
        paint(ctx, "#aac08e", "#3d4a30", 1.6);
        break;
      }
      case "armor":
        ctx.globalAlpha = Math.min(1, k * 2.5);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        drawArmorPiece(ctx, p);
        break;
      case "leaf":
        ctx.globalAlpha = Math.min(1, k * 2);
        ellipse(ctx, p.x, p.y, p.size, p.size * 0.45, p.rot);
        paint(ctx, p.color);
        break;
      case "shock":
        ctx.globalAlpha = k;
        ellipse(ctx, p.x, p.y, p.size * (1.4 - k), p.size * 0.3 * (1.4 - k));
        ctx.lineWidth = 5 * k;
        ctx.strokeStyle = "#f5e6c8";
        ctx.stroke();
        break;
      case "ice":
        break;
    }
    ctx.restore();
  }
  function drawArmorPiece(ctx, p) {
    switch (p.armorKind) {
      case "cone":
        ctx.beginPath();
        ctx.moveTo(-20, 16);
        ctx.lineTo(-2, -30);
        ctx.lineTo(18, 16);
        ctx.closePath();
        paint(ctx, "#f27a22", "#6e2d07", 2);
        ctx.fillStyle = "#fff4e6";
        ctx.fillRect(-12, -2, 22, 6);
        break;
      case "bucket":
        ctx.beginPath();
        ctx.moveTo(-20, 18);
        ctx.lineTo(-15, -20);
        ctx.lineTo(17, -16);
        ctx.lineTo(22, 18);
        ctx.closePath();
        paint(ctx, linear(ctx, -20, 0, 22, 0, [[0, "#7a838a"], [0.4, "#dfe5ea"], [1, "#6d757c"]]), "#3b4146", 2);
        break;
      case "helmet":
        ctx.beginPath();
        ctx.ellipse(0, 6, 24, 24, 0, Math.PI, Math.PI * 2);
        ctx.closePath();
        paint(ctx, "#c8242c", "#4a070c", 2);
        break;
      case "door":
        rrect(ctx, -22, -60, 44, 120, 3);
        paint(ctx, "rgba(200,210,215,0.35)", "#4c5156", 5);
        break;
      default:
        break;
    }
  }
  function drawWorld(ctx, b, bg) {
    ctx.drawImage(bg, 0, 0, bg.width, bg.height, 0, 0, WORLD_W, VIEW_H);
    if (b.bowling) {
      const x = LAWN_X + 3 * CELL_W;
      ctx.save();
      ctx.setLineDash([14, 10]);
      ctx.lineWidth = 5;
      ctx.strokeStyle = "rgba(220,40,30,0.85)";
      ctx.beginPath();
      ctx.moveTo(x, LAWN_Y + 4);
      ctx.lineTo(x, LAWN_B - 4);
      ctx.stroke();
      ctx.restore();
    }
    if (b.phase === "intro" || b.phase === "choose" || b.phase === "back") {
      for (const z of b.previews) zombieShadow(ctx, z.x, z.y, z.id);
      for (const z of b.previews) drawZombie(ctx, z.x, z.y, { ...zombieView(b, z), state: "preview" });
    }
    if (b.phase === "play" && !b.paused && b.holding) {
      const cell = b.cellAt(b.mx, b.my);
      if (cell) {
        const cx = LAWN_X + cell.col * CELL_W;
        const cy = LAWN_Y + cell.row * CELL_H;
        if (b.holding === "shovel") {
          const p = b.grid[cell.row][cell.col];
          if (p) {
            rrect(ctx, cx + 4, cy + 4, CELL_W - 8, CELL_H - 8, 10);
            paint(ctx, "rgba(255,80,60,0.18)", "rgba(255,120,100,0.8)", 3);
          }
        } else {
          const ok = b.canPlace(b.holding, cell.row, cell.col);
          rrect(ctx, cx + 4, cy + 4, CELL_W - 8, CELL_H - 8, 10);
          paint(ctx, ok ? "rgba(255,255,255,0.16)" : "rgba(255,60,40,0.16)", ok ? "rgba(255,255,255,0.55)" : "rgba(255,90,70,0.6)", 2.5);
          if (ok) {
            ctx.save();
            ctx.globalAlpha = 0.45;
            drawPlant(ctx, b.holding, colCenter(cell.col), rowFeet(cell.row), { t: b.t, hp: 1 });
            ctx.restore();
          }
        }
      }
    }
    for (const p of b.plants) plantShadow(ctx, p.x, p.y + 2, p.id === "tallnut" ? 34 : p.id === "spikeweed" ? 40 : 30);
    for (const w of b.bowls) plantShadow(ctx, w.x, w.y + 2, w.id === "giantnut" ? 60 : 30);
    for (const z of b.zombies) if (z.state !== "mowed") zombieShadow(ctx, z.x, z.y, z.id, z.lift);
    for (let r = 0; r < ROWS; r++) {
      for (const m of b.mowers) if (m.row === r && m.state !== "gone") drawMower(ctx, m.x, rowFeet(r) + 4, b.t, m.state === "run");
      const ps = b.plants.filter((p) => p.row === r && p.id === "spikeweed");
      for (const p of ps) drawP(ctx, b, p);
      for (const p of b.plants) if (p.row === r && p.id !== "spikeweed") drawP(ctx, b, p);
      for (const w of b.bowls) if (w.row === r) drawPlant(ctx, w.id, w.x, w.y, { t: b.t, rot: w.rot, hp: 1 });
      const zs = b.zombies.filter((z) => z.row === r && z.state !== "fly").sort((a, c) => c.x - a.x);
      for (const z of zs) drawZ(ctx, b, z);
      for (const s of b.shots) if (s.row === r) drawPea(ctx, s.x, s.y, s.kind, b.t);
    }
    for (const z of b.zombies) if (z.state === "fly") drawZ(ctx, b, z);
    for (const l of b.lobs) {
      const pos = lobPos(l);
      drawCabbageBall(ctx, pos.x, pos.y, pos.k * 8);
    }
    for (const p of b.particles) drawParticle(ctx, b, p);
    for (const s of b.suns) {
      const blink = s.state === "idle" && s.life < 2 ? Math.sin(b.t * 18) > 0 ? 1 : 0.35 : 1;
      const grow = s.state === "pop" ? 0.7 + Math.min(0.3, s.t * 0.8) : s.state === "collect" ? 1 - s.ct * 0.4 : 1;
      drawSun(ctx, s.x, s.y, b.t + s.x * 0.01, grow, blink);
    }
  }
  function drawBank(ctx, b, ui) {
    const w = BANK_X + MAX_SLOTS * SLOT_STEP;
    rrect(ctx, 4, 3, w, 108, 12);
    paint(ctx, linear(ctx, 0, 0, 0, 110, [[0, "#9a6434"], [1, "#6a3e1a"]]), "#2e1c08", 3);
    if (b.usesSlots) {
      drawSunCounter(ctx, 10, 5, b.sun, b.t, b.sunFlash);
    } else {
      rrect(ctx, 10, 8, 84, 98, 10);
      paint(ctx, "#4a2c12", "#2e1c08", 2);
      text(ctx, b.bowling ? "\u4FDD\u9F84\u7403" : "\u4F20\u9001\u5E26", 52, 40, { size: 17, color: "#ffe9b0", weight: 900 });
      text(ctx, b.bowling ? "\u6700\u9AD8\u8FDE\u51FB" : "\u514D\u8D39\u79CD\u690D", 52, 66, { size: 13, color: "#e6c890" });
      if (b.bowling) text(ctx, String(b.bestCombo), 52, 88, { size: 20, color: "#ffe066", weight: 900 });
    }
    for (let i = 0; i < MAX_SLOTS; i++) {
      rrect(ctx, BANK_X + i * SLOT_STEP, BANK_Y, PACKET_W, PACKET_H, 8);
      paint(ctx, "rgba(30,16,4,0.45)", "rgba(255,220,160,0.12)", 1.5);
    }
    if (b.usesSlots) {
      const list = b.phase === "choose" ? b.chosen : b.slots;
      list.forEach((id, i) => {
        const r = b.slotRect(i);
        const cd = b.cooldown.get(id) ?? 0;
        const hover = ui.over(r.x, r.y, r.w, r.h);
        drawPacket(ctx, r.x, r.y, id, {
          cost: PLANTS[id].cost,
          cd: cd > 0 ? cd / PLANTS[id].cooldown : 0,
          off: b.phase === "play" && b.sun < PLANTS[id].cost,
          hover,
          picked: b.holding === id
        });
        if (b.phase === "choose" && ui.hit(r.x, r.y, r.w, r.h)) b.toggleChoice(id);
      });
    } else {
      ctx.save();
      rrect(ctx, BANK_X - 2, BANK_Y - 4, BELT_LEN, PACKET_H + 8, 8);
      ctx.clip();
      ctx.fillStyle = "#2a2a2e";
      ctx.fillRect(BANK_X - 2, BANK_Y + PACKET_H - 20, BELT_LEN, 28);
      ctx.strokeStyle = "#4a4a50";
      ctx.lineWidth = 3;
      const off = b.t * 70 % 24;
      for (let x = BANK_X - off; x < BANK_X + BELT_LEN; x += 24) {
        ctx.beginPath();
        ctx.moveTo(x, BANK_Y + PACKET_H - 18);
        ctx.lineTo(x + 8, BANK_Y + PACKET_H + 6);
        ctx.stroke();
      }
      b.belt.forEach((it, i) => {
        const x = BANK_X + it.x;
        const hover = ui.over(x, BANK_Y, PACKET_W, PACKET_H);
        drawPacket(ctx, x, BANK_Y, it.id, { cost: null, hover, picked: b.holding === it.id && b.holdBelt === i });
      });
      ctx.restore();
    }
    if (!b.bowling) {
      const s = b.shovelRect;
      const hover = ui.over(s.x, s.y, s.w, s.h);
      rrect(ctx, s.x, s.y, s.w, s.h, 12);
      paint(ctx, linear(ctx, 0, s.y, 0, s.y + s.h, [[0, "#9a6434"], [1, "#6a3e1a"]]), hover ? "#ffe9b0" : "#2e1c08", 3);
      rrect(ctx, s.x + 7, s.y + 7, s.w - 14, s.h - 14, 9);
      paint(ctx, "#3a2410");
      if (b.holding !== "shovel") drawShovel(ctx, s.x + s.w / 2 - 2, s.y + s.h / 2 - 2, 1, 0);
    }
  }
  function drawButtons(ctx, b, ui) {
    for (const [r, label] of [
      [btnMenu, "\u83DC\u5355"],
      [btnSpeed, b.speed === 2 ? "\xD72" : "\xD71"]
    ]) {
      const hover = ui.over(r.x, r.y, r.w, r.h);
      rrect(ctx, r.x, r.y + 3, r.w, r.h, 10);
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.fill();
      rrect(ctx, r.x, r.y, r.w, r.h, 10);
      const hot = label === "\xD72";
      paint(ctx, linear(ctx, 0, r.y, 0, r.y + r.h, hot ? [[0, "#ffd36a"], [1, "#d48a14"]] : [[0, "#a3d36a"], [1, "#4f8a24"]]), hover ? "#ffffff" : "#1e3a0c", 3);
      text(ctx, label, r.x + r.w / 2, r.y + r.h / 2 + 1, { size: 21, color: "#fff", stroke: "#1e3a0c", lw: 4, weight: 900 });
    }
  }
  function drawProgressHud(ctx, b) {
    const lv = b.level;
    if (isEndless(lv)) {
      text(ctx, `\u65E0\u5C3D\u751F\u5B58 \xB7 \u7B2C ${Math.max(1, b.waveIndex)} \u6CE2`, VIEW_W - 24, VIEW_H - 22, { size: 20, color: "#fff3c8", stroke: "#3a2408", lw: 5, align: "right" });
      return;
    }
    const flags = lv.flags.map((f) => f / lv.waves);
    const label = lv.id.includes("-") ? `\u5173\u5361 ${lv.id}` : lv.name;
    drawProgress(ctx, VIEW_W - 250, VIEW_H - 32, 226, b.progress, flags, label);
  }
  function drawMessages(ctx, b) {
    for (const m of b.messages) {
      const k = m.t / m.dur;
      ctx.save();
      if (m.style === "ready" || m.style === "huge" || m.style === "final") {
        const pop = m.t < 0.18 ? 1.8 - easeOutCubic(m.t / 0.18) * 0.8 : 1;
        const size = m.style === "ready" ? 78 : m.style === "huge" ? 120 : 100;
        ctx.globalAlpha = k > 0.8 ? (1 - k) / 0.2 : 1;
        ctx.translate(VIEW_W / 2, VIEW_H / 2);
        ctx.scale(pop, pop);
        if (m.style === "huge") ctx.rotate(Math.sin(m.t * 40) * 0.015);
        text(ctx, m.text, 0, 0, { size, color: "#ff3a26", stroke: "#fff6e8", lw: 10, weight: 900, shadow: true });
      } else if (m.style === "warn") {
        const bob = Math.sin(m.t * 6) * 4;
        ctx.globalAlpha = m.dur > 100 ? Math.min(1, m.t * 2) : k > 0.85 ? (1 - k) / 0.15 : Math.min(1, m.t * 4);
        text(ctx, m.text, VIEW_W / 2, VIEW_H / 2 - 20 + bob, { size: 56, color: "#ff3a26", stroke: "#2a0606", lw: 9, weight: 900, shadow: true });
      } else {
        ctx.globalAlpha = k > 0.8 ? (1 - k) / 0.2 : 1;
        text(ctx, m.text, VIEW_W / 2, VIEW_H - 120, { size: 26, color: "#fff", stroke: "#000", lw: 5 });
      }
      ctx.restore();
    }
  }
  function drawTip(ctx, b) {
    if (b.tipT <= 0 || !b.level.tip) return;
    ctx.save();
    ctx.globalAlpha = Math.min(1, b.tipT, (11 - b.tipT) * 3);
    ctx.font = `700 20px ${FONT}`;
    const lines = wrapText(ctx, b.level.tip, 700);
    const h = 24 + lines.length * 28;
    const y = VIEW_H - 64 - h;
    rrect(ctx, VIEW_W / 2 - 380, y, 760, h, 14);
    paint(ctx, "rgba(24,18,8,0.78)", "rgba(255,230,160,0.6)", 2);
    lines.forEach((ln, i) => text(ctx, ln, VIEW_W / 2, y + 26 + i * 28, { size: 20, color: "#fff3c8", weight: 700 }));
    ctx.restore();
  }
  function drawHolding(ctx, b) {
    if (b.phase !== "play" || b.paused || !b.holding) return;
    if (b.holding === "shovel") {
      drawShovel(ctx, b.mx + 10, b.my - 10, 1.1, -0.3);
      return;
    }
    ctx.save();
    ctx.globalAlpha = 0.92;
    ctx.translate(b.mx, b.my + 30);
    ctx.scale(0.85, 0.85);
    drawPlant(ctx, b.holding, 0, 0, { t: b.t, hp: 1 });
    ctx.restore();
  }
  function panel(ctx, x, y, w, h) {
    rrect(ctx, x, y + 6, w, h, 20);
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fill();
    rrect(ctx, x, y, w, h, 20);
    paint(ctx, linear(ctx, 0, y, 0, y + h, [[0, "#fbfff5f5"], [1, "#deedddf5"]]), "#98b7a1", 1.5);
    rrect(ctx, x + 10, y + 10, w - 20, h - 20, 14);
    ctx.strokeStyle = "rgba(255,255,255,0.65)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  function drawChooser(ctx, b, ui) {
    const x = 18;
    const y = 126;
    const w = 520;
    const h = 572;
    panel(ctx, x, y, w, h);
    text(ctx, "\u9009\u62E9\u51FA\u6218\u690D\u7269", x + w / 2, y + 40, { size: 30, color: "#315447", weight: 900 });
    text(ctx, `\u5DF2\u9009 ${b.chosen.length} / ${MAX_SLOTS}`, x + w / 2, y + 74, { size: 17, color: "#6c8170" });
    const cols = 6;
    b.available.forEach((id, i) => {
      const px = x + 30 + i % cols * 78;
      const py = y + 100 + Math.floor(i / cols) * 100;
      const picked = b.chosen.includes(id);
      const hover = ui.over(px, py, PACKET_W, PACKET_H);
      drawPacket(ctx, px, py, id, { cost: PLANTS[id].cost, picked, hover });
      if (!picked && ui.hit(px, py, PACKET_W, PACKET_H)) b.toggleChoice(id);
    });
    const hoverId = b.available.find((_id, i) => ui.over(x + 30 + i % cols * 78, y + 100 + Math.floor(i / cols) * 100, PACKET_W, PACKET_H));
    if (hoverId) {
      const d = PLANTS[hoverId];
      rrect(ctx, x + 24, y + h - 170, w - 48, 82, 10);
      paint(ctx, "rgba(90,58,16,0.1)");
      text(ctx, `${d.name} \xB7 ${d.cost} \u9633\u5149`, x + 40, y + h - 146, { size: 19, color: "#315447", align: "left", weight: 900 });
      ctx.font = `600 15px ${FONT}`;
      wrapText(ctx, d.desc.replace(/\n/g, ""), w - 90).slice(0, 2).forEach((ln, i) => text(ctx, ln, x + 40, y + h - 118 + i * 22, { size: 15, color: "#5b7563", align: "left", weight: 600 }));
    }
    if (ui.button(ctx, "\u5F00\u59CB\u79CD\u690D\uFF01", x + w / 2 - 120, y + h - 74, 240, 56, "green", 26, b.chosen.length === 0)) b.confirmChoice();
    text(ctx, "\u672C\u5173\u51FA\u73B0\u7684\u50F5\u5C38", VIEW_W - 220, 150, { size: 22, color: "#fff3c8", stroke: "#2a1a08", lw: 5 });
  }
  function drawPause(ctx, b, ui) {
    ctx.fillStyle = "rgba(10,14,8,0.55)";
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    const w = 420;
    const h = 420;
    const x = (VIEW_W - w) / 2;
    const y = (VIEW_H - h) / 2;
    panel(ctx, x, y, w, h);
    text(ctx, "\u6E38\u620F\u6682\u505C", VIEW_W / 2, y + 52, { size: 36, color: "#315447", weight: 900 });
    if (ui.button(ctx, "\u7EE7\u7EED\u6E38\u620F", x + 70, y + 92, w - 140, 56, "green", 24)) b.paused = false;
    if (ui.button(ctx, "\u91CD\u65B0\u5F00\u59CB", x + 70, y + 160, w - 140, 56, "wood", 24)) b.host.finish(b.result(false), "retry");
    if (ui.button(ctx, "\u8FD4\u56DE\u83DC\u5355", x + 70, y + 228, w - 140, 56, "wood", 24)) b.host.finish(b.result(false), "menu");
    const a = b.audio;
    if (ui.button(ctx, `\u97F3\u4E50\uFF1A${a.musicOn ? "\u5F00" : "\u5173"}`, x + 50, y + 312, 150, 48, "stone", 20)) {
      a.setMusicOn(!a.musicOn);
      b.host.save.music = a.musicOn;
    }
    if (ui.button(ctx, `\u97F3\u6548\uFF1A${a.sfxOn ? "\u5F00" : "\u5173"}`, x + w - 200, y + 312, 150, 48, "stone", 20)) {
      a.sfxOn = !a.sfxOn;
      b.host.save.sfx = a.sfxOn;
    }
    text(ctx, "\u7A7A\u683C \u6682\u505C \xB7 1\u20138 \u9009\u5361 \xB7 Q \u94F2\u5B50 \xB7 F \u52A0\u901F", VIEW_W / 2, y + h - 26, { size: 14, color: "#6c8170" });
  }
  function drawLost(ctx, b, ui) {
    const k = clamp(b.phaseT / 2, 0, 1);
    ctx.fillStyle = `rgba(20,0,0,${0.5 * k})`;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    if (b.phaseT < 2.6) return;
    if (isEndless(b.level)) {
      text(ctx, `\u4F60\u575A\u6301\u4E86 ${Math.max(0, b.waveIndex - 1)} \u6CE2`, VIEW_W / 2, VIEW_H / 2 + 50, { size: 30, color: "#fff3c8", stroke: "#2a0606", lw: 6 });
    }
    if (ui.button(ctx, "\u518D\u8BD5\u4E00\u6B21", VIEW_W / 2 - 250, VIEW_H / 2 + 100, 230, 60, "green", 26)) b.host.finish(b.result(false), "retry");
    if (ui.button(ctx, "\u8FD4\u56DE\u83DC\u5355", VIEW_W / 2 + 20, VIEW_H / 2 + 100, 230, 60, "wood", 26)) b.host.finish(b.result(false), "menu");
  }
  function drawRewardItem(ctx, b, x, y, s) {
    const id = b.level.reward[0];
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.save();
    ctx.rotate(b.t * 0.6);
    ctx.fillStyle = "rgba(255,245,180,0.35)";
    for (let i = 0; i < 12; i++) {
      ctx.rotate(Math.PI / 6);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-9, -84);
      ctx.lineTo(9, -84);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    circle(ctx, 0, 0, 56);
    paint(ctx, radial(ctx, 0, 0, 4, 0, 0, 56, [[0, "#fff8c8cc"], [1, "#fff8c800"]]));
    if (id) drawPacket(ctx, -PACKET_W / 2, -PACKET_H / 2, id, { cost: PLANTS[id].cost });
    else drawTrophy(ctx, 0, 40, 0.55, b.t);
    ctx.restore();
  }
  function drawWon(ctx, b) {
    const r = b.reward;
    if (!r) return;
    const bob = r.vy === 0 ? Math.sin(r.t * 3) * 5 : 0;
    drawRewardItem(ctx, b, r.x - b.cam, r.y + bob, 1);
    if (r.t > 1) {
      const a = Math.sin(r.t * 5) * 6;
      text(ctx, "\u70B9\u51FB\u9886\u53D6", r.x - b.cam, r.y - 78 + a, { size: 22, color: "#fff7c8", stroke: "#3a2408", lw: 5 });
    }
  }
  function drawRewardPhase(ctx, b) {
    const r = b.reward;
    if (!r) return;
    const k = easeOutCubic(clamp(b.phaseT / 1.2, 0, 1));
    const x = lerp(r.x - b.cam, VIEW_W / 2, k);
    const y = lerp(r.y, VIEW_H / 2 - 20, k);
    const white = clamp((b.phaseT - 0.9) / 1.5, 0, 1);
    ctx.fillStyle = `rgba(255,252,236,${white})`;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    drawRewardItem(ctx, b, x, y, 1 + k * 1.6);
  }
  function renderBattle(ctx, b, bg, ui) {
    const sx = b.shake > 0 ? (Math.random() - 0.5) * b.shake * 16 : 0;
    const sy = b.shake > 0 ? (Math.random() - 0.5) * b.shake * 12 : 0;
    ctx.save();
    ctx.translate(-b.cam + sx, sy);
    drawWorld(ctx, b, bg);
    ctx.restore();
    const hudIn = b.phase === "choose" ? 1 : b.phase === "intro" ? clamp((b.phaseT - 2.2) / 0.5, 0, 1) : 1;
    ctx.save();
    ctx.translate(0, (1 - hudIn) * -130);
    if (b.phase !== "intro" || hudIn > 0) drawBank(ctx, b, ui);
    ctx.restore();
    if (b.phase === "play" || b.phase === "won" || b.phase === "lost") {
      drawButtons(ctx, b, ui);
      drawProgressHud(ctx, b);
    }
    drawTip(ctx, b);
    if (b.phase === "choose") drawChooser(ctx, b, ui);
    if (b.phase === "won") drawWon(ctx, b);
    drawHolding(ctx, b);
    drawMessages(ctx, b);
    if (b.phase === "lost") drawLost(ctx, b, ui);
    if (b.phase === "reward") drawRewardPhase(ctx, b);
    if (b.paused) drawPause(ctx, b, ui);
    if (b.phase === "intro" && b.phaseT < 0.4) {
      ctx.fillStyle = `rgba(0,0,0,${1 - b.phaseT / 0.4})`;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    }
  }

  // games-src/garden-guard/src/save.ts
  var fresh = () => ({
    unlocked: 0,
    cleared: [],
    plants: ["peashooter"],
    seen: ["basic"],
    endlessBest: 0,
    bowlingBest: 0,
    music: true,
    sfx: true
  });
  function loadSave() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return fresh();
      return { ...fresh(), ...JSON.parse(raw) };
    } catch {
      return fresh();
    }
  }
  function writeSave(data) {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch {
    }
  }
  function resetSave() {
    const data = fresh();
    writeSave(data);
    return data;
  }

  // games-src/garden-guard/src/scenes.ts
  var ALL_ROWS = [0, 1, 2, 3, 4];
  function backdrop(ctx, app2, cam, dim = 0) {
    const bg = app2.world(ALL_ROWS);
    const k = bg.width / WORLD_W;
    ctx.drawImage(bg, cam * k, 0, VIEW_W * k, VIEW_H * k, 0, 0, VIEW_W, VIEW_H);
    if (dim > 0) {
      ctx.fillStyle = `rgba(12,18,8,${dim})`;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    }
  }
  function view(id, t, phase, state = "walk") {
    const def = ZOMBIES[id];
    return {
      id,
      t,
      phase,
      state,
      stateT: 0,
      deathT: 0,
      hasArm: true,
      hasHead: true,
      hasPole: id === "pole",
      hasImp: id === "garg",
      armorKind: def.armorKind,
      armor: def.armor ? 1 : 0,
      angry: false
    };
  }
  function plank(ctx, x, y, w, h) {
    rrect(ctx, x, y + 8, w, h, 25);
    paint(ctx, "rgba(28,67,48,0.15)");
    rrect(ctx, x, y, w, h, 25);
    paint(ctx, linear(ctx, 0, y, 0, y + h, [[0, "#ffffed"], [1, "#edf2d5"]]), "#93b292", 1.5);
    ctx.strokeStyle = "#ccd9b7";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 24, y + h - 20);
    ctx.lineTo(x + w - 24, y + h - 20);
    ctx.stroke();
  }
  function parchment(ctx, x, y, w, h) {
    rrect(ctx, x, y + 6, w, h, 20);
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fill();
    rrect(ctx, x, y, w, h, 20);
    paint(ctx, linear(ctx, 0, y, 0, y + h, [[0, "#fcfff9f5"], [1, "#e9f3e6f2"]]), "#adc7b4", 1.5);
  }
  function backButton(ctx, app2) {
    return app2.ui.button(ctx, "\u2039 \u8FD4\u56DE", 20, 16, 128, 50, "wood", 22);
  }
  var TitleScene = class {
    constructor(app2) {
      this.app = app2;
      this.music = "menu";
      this.t = 0;
      this.zs = [];
      this.peas = [];
      this.shootT = [0.3, 0.9, 0.5, 1.2, 0.7];
      this.shooters = [
        { id: "sunflower", row: 0, col: 0 },
        { id: "peashooter", row: 0, col: 1 },
        { id: "repeater", row: 1, col: 1 },
        { id: "sunflower", row: 1, col: 0 },
        { id: "snowpea", row: 2, col: 1 },
        { id: "sunflower", row: 2, col: 0 },
        { id: "peashooter", row: 3, col: 1 },
        { id: "cabbage", row: 4, col: 1 },
        { id: "sunflower", row: 3, col: 0 },
        { id: "sunflower", row: 4, col: 0 },
        { id: "wallnut", row: 2, col: 3 },
        { id: "tallnut", row: 4, col: 3 }
      ];
      const ids = ["basic", "cone", "bucket", "pole", "paper", "football", "door"];
      for (let i = 0; i < 6; i++) {
        this.zs.push({ id: ids[i % ids.length], row: i % 5, x: 900 + i * 70 + rand(0, 60), phase: rand(0, 6), speed: rand(14, 20), flash: 0 });
      }
    }
    update(dt) {
      this.t += dt;
      for (const z of this.zs) {
        z.x -= z.speed * dt;
        z.phase += dt * z.speed * 0.105;
        z.flash = Math.max(0, z.flash - dt);
        if (z.x < 760) {
          z.x = 1240 + rand(0, 120);
          z.id = ["basic", "cone", "bucket", "pole", "paper", "football", "door", "flag"][Math.floor(rand(0, 8))];
        }
      }
      for (let r = 0; r < 4; r++) {
        this.shootT[r] -= dt;
        if (this.shootT[r] <= 0) {
          this.shootT[r] = 1.4;
          if (this.zs.some((z) => z.row === r && z.x < 1180)) this.peas.push({ row: r, x: colCenter(1) + 40 });
        }
      }
      for (const p of this.peas) p.x += 430 * dt;
      this.peas = this.peas.filter((p) => {
        const z = this.zs.find((zz) => zz.row === p.row && p.x > zz.x - 24 && p.x < zz.x + 30);
        if (z) {
          z.flash = 0.1;
          z.x += 4;
        }
        return !z && p.x < VIEW_W + 40;
      });
    }
    render(ctx) {
      const app2 = this.app;
      backdrop(ctx, app2, 0);
      for (const s of this.shooters) plantShadow(ctx, colCenter(s.col), rowFeet(s.row) + 2);
      for (let r = 0; r < 5; r++) {
        for (const s of this.shooters) if (s.row === r) drawPlant(ctx, s.id, colCenter(s.col), rowFeet(s.row), { t: this.t + s.col + r, hp: 1 });
        for (const z of this.zs) {
          if (z.row !== r) continue;
          zombieShadow(ctx, z.x, rowFeet(r), z.id);
          drawZombie(ctx, z.x, rowFeet(r), { ...view(z.id, this.t, z.phase), state: "walk" });
        }
        for (const p of this.peas) if (p.row === r) drawPea(ctx, p.x, rowFeet(r) - 61, r === 2 ? "snow" : "pea", this.t);
      }
      ctx.fillStyle = linear(ctx, 0, 0, VIEW_W, 0, [[0, "#eaf4eaf5"], [0.55, "#e5f2ebeb"], [1, "#d9ebe4bd"]]);
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      parchment(ctx, 48, 48, 530, 620);
      text(ctx, "YUMO GARDENS / NO. 02", 86, 91, { size: 13, color: "#637f75", align: "left", weight: 500 });
      text(ctx, "\u82B1\u56ED\u4FDD\u536B\u6218", 84, 172, { size: 67, color: "#285448", align: "left", weight: 800 });
      text(ctx, "A LITTLE DEFENCE OF JOY.", 88, 221, { size: 19, color: "#638975", align: "left", weight: 500 });
      text(ctx, "\u79CD\u4E0B\u5E0C\u671B\uFF0C\u5B88\u4F4F\u597D\u65F6\u5149\u3002", 88, 267, { size: 20, color: "#6b8375", align: "left", weight: 500 });
      ctx.strokeStyle = "#c3d6c7";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(88, 302);
      ctx.lineTo(537, 302);
      ctx.stroke();
      const lv = LEVELS[Math.min(app2.save.unlocked, LEVELS.length - 1)];
      if (app2.ui.button(ctx, "\u5F00\u59CB\u5192\u9669  \u2197", 88, 329, 450, 70, "green", 28)) app2.startLevel(lv);
      text(ctx, `\u4E0B\u4E00\u7AD9  ${lv.id} \xB7 ${lv.name}`, 313, 425, { size: 15, color: "#628174", weight: 500 });
      if (app2.ui.button(ctx, "\u5173\u5361\u4E0E\u5C0F\u6E38\u620F", 88, 459, 450, 57, "wood", 22)) app2.go(new SelectScene(app2));
      if (app2.ui.button(ctx, "\u690D\u7269\u56FE\u9274", 88, 532, 218, 54, "wood", 20)) app2.go(new AlmanacScene(app2));
      if (app2.ui.button(ctx, "\u8BBE\u7F6E", 320, 532, 218, 54, "wood", 20)) app2.go(new SettingsScene(app2));
      text(ctx, "12 \u5173\u5192\u9669     /     15 \u79CD\u690D\u7269     /     \u65E0\u9650\u597D\u65F6\u5149", 313, 626, { size: 13, color: "#718b7e", weight: 500 });
      text(ctx, "GROW.", 660, 124, { size: 64, color: "#325e50", align: "left", weight: 800 });
      text(ctx, "GUARD. REPEAT.", 664, 165, { size: 20, color: "#668a79", align: "left", weight: 500 });
      ctx.save();
      ctx.translate(962, 330);
      ctx.rotate(0.11);
      parchment(ctx, -153, -144, 306, 322);
      text(ctx, "SPECIMEN 01 / SUNFLOWER", 0, -112, { size: 11, color: "#738b7b", weight: 500 });
      circle(ctx, 0, 7, 96);
      paint(ctx, "#ecedce");
      ctx.save();
      ctx.translate(0, 98);
      ctx.scale(1.6, 1.6);
      drawPlant(ctx, "sunflower", 0, 0, { t: this.t, hp: 1 });
      ctx.restore();
      text(ctx, "\u9633\u5149\uFF0C\u662F\u6700\u597D\u7684\u8865\u7ED9\u3002", 0, 147, { size: 15, color: "#587563", weight: 500 });
      ctx.restore();
      ctx.save();
      ctx.translate(756, 482);
      ctx.rotate(-0.1);
      parchment(ctx, -116, -127, 232, 271);
      text(ctx, "02 / PEA SHOOTER", 0, -98, { size: 11, color: "#738b7b", weight: 500 });
      circle(ctx, 0, -4, 71);
      paint(ctx, "#d9e9db");
      ctx.save();
      ctx.translate(0, 70);
      ctx.scale(1.3, 1.3);
      drawPlant(ctx, "peashooter", 0, 0, { t: this.t, hp: 1 });
      ctx.restore();
      text(ctx, "\u5C0F\u5C0F\u4E00\u682A\uFF0C\u5927\u5927\u52C7\u6C14\u3002", 0, 115, { size: 13, color: "#587563", weight: 500 });
      ctx.restore();
      text(ctx, "\u2733", 1084, 592, { size: 72, color: "#83a988", weight: 500 });
      text(ctx, "KEEP THE GARDEN GROWING.", 896, 668, { size: 13, color: "#557c68", weight: 500 });
    }
    key(k) {
      if (k === "Enter") this.app.startLevel(LEVELS[Math.min(this.app.save.unlocked, LEVELS.length - 1)]);
    }
  };
  var SelectScene = class {
    constructor(app2) {
      this.app = app2;
      this.music = "menu";
      this.t = 0;
    }
    update(dt) {
      this.t += dt;
    }
    render(ctx) {
      const app2 = this.app;
      const save = app2.save;
      backdrop(ctx, app2, 120, 0.55);
      if (backButton(ctx, app2)) app2.go(new TitleScene(app2));
      text(ctx, "\u5192\u9669\u6A21\u5F0F \xB7 \u767D\u5929\u7684\u8349\u576A", 172, 42, { size: 30, color: "#fff3c8", stroke: "#2a1a08", lw: 6, align: "left" });
      const owned = save.plants.length;
      text(ctx, `\u690D\u7269\u6536\u96C6 ${owned}/${ALL_PLANTS.length}`, 792, 42, { size: 18, color: "#d8f0b0", stroke: "#1a2a08", lw: 4, align: "right" });
      const cw = 178;
      const ch = 132;
      LEVELS.forEach((lv, i) => {
        const x = 28 + i % 4 * (cw + 16);
        const y = 92 + Math.floor(i / 4) * (ch + 16);
        const locked = i > save.unlocked;
        const cleared = save.cleared.includes(i);
        const hover = !locked && app2.ui.over(x, y, cw, ch);
        ctx.save();
        if (hover) ctx.translate(0, -3);
        plank(ctx, x, y, cw, ch);
        text(ctx, lv.id, x + 18, y + 38, { size: 34, color: "#31594a", align: "left", weight: 900 });
        text(ctx, lv.name, x + 18, y + 80, { size: 17, color: "#476854", align: "left" });
        const tag = lv.mode === "bowling" ? "\u4FDD\u9F84\u7403" : lv.mode === "conveyor" ? "\u4F20\u9001\u5E26" : `${lv.waves} \u6CE2`;
        text(ctx, tag, x + 18, y + 108, { size: 14, color: "#71856c", align: "left", weight: 700 });
        if (lv.reward[0]) drawPacket(ctx, x + cw - 58, y + 26, lv.reward[0], { scale: 0.62 });
        else drawTrophy(ctx, x + cw - 38, y + 92, 0.36, this.t);
        if (cleared) {
          circle(ctx, x + cw - 12, y + 12, 16);
          paint(ctx, "#4fbf2a", "#1d4a0e", 3);
          text(ctx, "\u2713", x + cw - 12, y + 13, { size: 20, color: "#fff", weight: 900 });
        }
        if (locked) {
          rrect(ctx, x, y, cw, ch, 16);
          ctx.fillStyle = "rgba(10,8,4,0.62)";
          ctx.fill();
          lock(ctx, x + cw / 2, y + ch / 2);
        }
        ctx.restore();
        if (!locked && app2.ui.hit(x, y, cw, ch)) {
          app2.audio.play("click");
          app2.startLevel(lv);
        }
      });
      const mx = 820;
      parchment(ctx, mx, 92, 356, 428);
      text(ctx, "\u5C0F\u6E38\u620F", mx + 178, 128, { size: 28, color: "#315447", weight: 900 });
      const games = [
        { lv: BOWLING, title: "\u575A\u679C\u4FDD\u9F84\u7403 \xB7 \u6311\u6218", sub: "20 \u6CE2\u4FDD\u9F84\u7403\uFF0C\u6253\u51FA\u6700\u9AD8\u8FDE\u51FB", need: 4, best: `\u6700\u9AD8\u8FDE\u51FB ${save.bowlingBest}` },
        { lv: ENDLESS, title: "\u65E0\u5C3D\u751F\u5B58", sub: "\u4E00\u6CE2\u63A5\u4E00\u6CE2\uFF0C\u770B\u4F60\u80FD\u6491\u591A\u4E45", need: 9, best: `\u6700\u4F73\u7EAA\u5F55 ${save.endlessBest} \u6CE2` }
      ];
      games.forEach((g, i) => {
        const x = mx + 22;
        const y = 160 + i * 172;
        const locked = !save.cleared.includes(g.need) && save.unlocked <= g.need;
        const hover = !locked && app2.ui.over(x, y, 312, 152);
        rrect(ctx, x, y - (hover ? 3 : 0), 312, 152, 14);
        paint(ctx, linear(ctx, 0, y, 0, y + 152, i ? [[0, "#5d7f3a"], [1, "#2f4a1a"]] : [[0, "#8a5a2c"], [1, "#5c3a18"]]), hover ? "#fff3c8" : "#2a1a08", 3);
        if (i === 0) drawPlant(ctx, "bowlnut", x + 262, y + 112, { t: this.t, rot: this.t * 3, hp: 1 });
        else drawZombieHead(ctx, "bucket", x + 262, y + 92, -0.1, 1.05);
        text(ctx, g.title, x + 18, y + 36, { size: 21, color: "#fff3c8", stroke: "#1a1006", lw: 4, align: "left", weight: 900 });
        text(ctx, g.sub, x + 18, y + 72, { size: 14, color: "#f0e0c0", align: "left", weight: 600 });
        text(ctx, g.best, x + 18, y + 112, { size: 16, color: "#ffe066", align: "left", weight: 800 });
        if (locked) {
          rrect(ctx, x, y, 312, 152, 14);
          ctx.fillStyle = "rgba(10,8,4,0.66)";
          ctx.fill();
          lock(ctx, x + 156, y + 56);
          text(ctx, `\u901A\u5173 ${LEVELS[g.need].id} \u540E\u89E3\u9501`, x + 156, y + 116, { size: 16, color: "#ffe9b0", weight: 700 });
        } else if (app2.ui.hit(x, y, 312, 152)) {
          app2.audio.play("click");
          app2.startLevel(g.lv);
        }
      });
      if (app2.ui.button(ctx, "\u690D\u7269\u56FE\u9274", mx + 22, 540, 150, 54, "wood", 21)) app2.go(new AlmanacScene(app2));
      if (app2.ui.button(ctx, "\u8BBE\u7F6E", mx + 184, 540, 150, 54, "wood", 21)) app2.go(new SettingsScene(app2));
    }
    key(k) {
      if (k === "Escape") this.app.go(new TitleScene(this.app));
    }
  };
  function lock(ctx, x, y) {
    ctx.lineWidth = 6;
    ctx.strokeStyle = "#c9c9c9";
    ctx.beginPath();
    ctx.arc(x, y - 8, 13, Math.PI, 0);
    ctx.stroke();
    rrect(ctx, x - 20, y - 8, 40, 32, 6);
    paint(ctx, linear(ctx, 0, y - 8, 0, y + 24, [[0, "#ffd75a"], [1, "#c8901a"]]), "#5a3a08", 2.5);
    circle(ctx, x, y + 6, 4);
    paint(ctx, "#5a3a08");
  }
  var AlmanacScene = class {
    constructor(app2) {
      this.app = app2;
      this.music = "menu";
      this.t = 0;
      this.tab = "plants";
      this.plant = "peashooter";
      this.zombie = "basic";
    }
    update(dt) {
      this.t += dt;
    }
    render(ctx) {
      const app2 = this.app;
      const save = app2.save;
      backdrop(ctx, app2, 300, 0.62);
      if (backButton(ctx, app2)) app2.go(new TitleScene(app2));
      text(ctx, "\u56FE\u9274", 172, 42, { size: 32, color: "#fff3c8", stroke: "#2a1a08", lw: 6, align: "left" });
      if (app2.ui.button(ctx, "\u690D\u7269", 270, 18, 120, 48, this.tab === "plants" ? "green" : "stone", 22)) this.tab = "plants";
      if (app2.ui.button(ctx, "\u50F5\u5C38", 400, 18, 120, 48, this.tab === "zombies" ? "green" : "stone", 22)) this.tab = "zombies";
      parchment(ctx, 24, 86, 512, 610);
      parchment(ctx, 556, 86, 620, 610);
      if (this.tab === "plants") {
        PLANT_ORDER.forEach((id, i) => {
          const x = 54 + i % 5 * 92;
          const y = 110 + Math.floor(i / 5) * 112;
          const owned = save.plants.includes(id);
          const hover = app2.ui.over(x, y, PACKET_W, PACKET_H);
          if (owned) drawPacket(ctx, x, y, id, { cost: PLANTS[id].cost, hover });
          else {
            rrect(ctx, x, y, PACKET_W, PACKET_H, 8);
            paint(ctx, "#dce7d8", "#8ba38b", 2.4);
            text(ctx, "?", x + PACKET_W / 2, y + PACKET_H / 2, { size: 40, color: "#8ba38b", weight: 900 });
          }
          if (this.plant === id) {
            rrect(ctx, x - 4, y - 4, PACKET_W + 8, PACKET_H + 8, 10);
            ctx.strokeStyle = "#2f8a1a";
            ctx.lineWidth = 4;
            ctx.stroke();
          }
          if (app2.ui.hit(x, y, PACKET_W, PACKET_H)) {
            this.plant = id;
            app2.audio.play("pick");
          }
        });
        text(ctx, "\u4FDD\u9F84\u7403\u4E13\u7528\uFF1A\u4FDD\u9F84\u575A\u679C \xB7 \u7206\u70B8\u575A\u679C \xB7 \u5DE8\u578B\u575A\u679C", 280, 670, { size: 14, color: "#6c8170" });
        this.plantDetail(ctx, this.plant, save.plants.includes(this.plant));
      } else {
        ZOMBIE_ORDER.forEach((id, i) => {
          const x = 50 + i % 4 * 118;
          const y = 108 + Math.floor(i / 4) * 128;
          const seen = save.seen.includes(id);
          const hover = app2.ui.over(x, y, 104, 112);
          rrect(ctx, x, y - (hover ? 2 : 0), 104, 112, 12);
          paint(ctx, linear(ctx, 0, y, 0, y + 112, [[0, "#7cc152"], [1, "#4c8a2c"]]), this.zombie === id ? "#fff3a0" : "#2c4a14", this.zombie === id ? 4 : 2.4);
          if (seen) drawZombieHead(ctx, id, x + 56, y + 52, -0.1, id === "garg" ? 0.62 : id === "imp" ? 0.95 : 1);
          else text(ctx, "?", x + 52, y + 52, { size: 46, color: "#2c4a14", weight: 900 });
          text(ctx, seen ? ZOMBIES[id].name : "???", x + 52, y + 98, { size: 14, color: "#fff", stroke: "#1d3a0c", lw: 3, weight: 800 });
          if (app2.ui.hit(x, y, 104, 112)) {
            this.zombie = id;
            app2.audio.play("pick");
          }
        });
        this.zombieDetail(ctx, this.zombie, save.seen.includes(this.zombie));
      }
    }
    stage(ctx) {
      const x = 586;
      const y = 112;
      rrect(ctx, x, y, 560, 300, 16);
      ctx.save();
      ctx.clip();
      ctx.fillStyle = linear(ctx, 0, y, 0, y + 300, [
        [0, "#9fd9ff"],
        [0.45, "#d8f2ff"],
        [0.46, "#6cc644"],
        [1, "#4f9a2c"]
      ]);
      ctx.fillRect(x, y, 560, 300);
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = i % 2 ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.05)";
        ctx.fillRect(x + i * 98, y + 136, 98, 164);
      }
      ctx.restore();
      rrect(ctx, x, y, 560, 300, 16);
      ctx.strokeStyle = "#5b7563";
      ctx.lineWidth = 4;
      ctx.stroke();
    }
    plantDetail(ctx, id, owned) {
      this.stage(ctx);
      const d = PLANTS[id];
      if (owned) {
        plantShadow(ctx, 866, 372, 46);
        ctx.save();
        ctx.translate(866, 372);
        ctx.scale(1.6, 1.6);
        const st = id === "potato" ? "armed" : id === "chomper" ? "ready" : void 0;
        drawPlant(ctx, id, 0, 0, { t: this.t, hp: 1, state: st, anim: id === "sunflower" ? (Math.sin(this.t) + 1) / 2 : 0 });
        ctx.restore();
      } else text(ctx, "\u5C1A\u672A\u83B7\u5F97", 866, 262, { size: 34, color: "#2c4a14", weight: 900 });
      text(ctx, owned ? d.name : "\uFF1F\uFF1F\uFF1F", 866, 446, { size: 32, color: "#315447", weight: 900 });
      if (!owned) return;
      text(ctx, `\u9633\u5149 ${d.cost}\u3000\xB7\u3000\u51B7\u5374 ${d.cooldown >= 30 ? "\u6162" : "\u5FEB"}\u3000\xB7\u3000\u8010\u4E45 ${d.hp}`, 866, 484, { size: 17, color: "#8a5a1a", weight: 800 });
      let y = 522;
      ctx.font = `600 18px ${FONT}`;
      for (const ln of wrapText(ctx, d.desc, 520)) {
        text(ctx, ln, 866, y, { size: 18, color: "#465e51", weight: 600 });
        y += 28;
      }
      y += 8;
      text(ctx, d.stats.join("\u3000"), 866, y, { size: 16, color: "#2f7a1a", weight: 800 });
    }
    zombieDetail(ctx, id, seen) {
      this.stage(ctx);
      const d = ZOMBIES[id];
      if (seen) {
        zombieShadow(ctx, 866, 384, id);
        ctx.save();
        ctx.translate(866, 384);
        const s = id === "garg" ? 0.95 : id === "imp" ? 1.6 : 1.45;
        ctx.scale(s, s);
        drawZombie(ctx, 0, 0, view(id, this.t, this.t * 2.2, "preview"));
        ctx.restore();
      } else text(ctx, "\u5C1A\u672A\u906D\u9047", 866, 262, { size: 34, color: "#2c4a14", weight: 900 });
      text(ctx, seen ? d.name : "\uFF1F\uFF1F\uFF1F", 866, 446, { size: 32, color: "#315447", weight: 900 });
      if (!seen) return;
      text(ctx, d.toughness, 866, 484, { size: 17, color: "#8a1a1a", weight: 800 });
      let y = 522;
      ctx.font = `600 18px ${FONT}`;
      for (const ln of wrapText(ctx, d.desc, 520)) {
        text(ctx, ln, 866, y, { size: 18, color: "#465e51", weight: 600 });
        y += 28;
      }
    }
    key(k) {
      if (k === "Escape") this.app.go(new TitleScene(this.app));
    }
  };
  var SettingsScene = class {
    constructor(app2) {
      this.app = app2;
      this.music = "menu";
      this.confirmReset = 0;
      this.toast = "";
      this.toastT = 0;
    }
    update(dt) {
      this.confirmReset = Math.max(0, this.confirmReset - dt);
      this.toastT = Math.max(0, this.toastT - dt);
    }
    render(ctx) {
      const app2 = this.app;
      backdrop(ctx, app2, 200, 0.6);
      if (backButton(ctx, app2)) app2.go(new TitleScene(app2));
      const w = 520;
      const h = 470;
      const x = (VIEW_W - w) / 2;
      const y = 120;
      parchment(ctx, x, y, w, h);
      text(ctx, "\u8BBE\u7F6E", VIEW_W / 2, y + 50, { size: 36, color: "#315447", weight: 900 });
      const a = app2.audio;
      if (app2.ui.button(ctx, `\u80CC\u666F\u97F3\u4E50\uFF1A${a.musicOn ? "\u5F00" : "\u5173"}`, x + 70, y + 96, w - 140, 58, a.musicOn ? "green" : "stone", 24)) {
        a.setMusicOn(!a.musicOn);
        app2.save.music = a.musicOn;
        app2.persist();
      }
      if (app2.ui.button(ctx, `\u97F3\u6548\uFF1A${a.sfxOn ? "\u5F00" : "\u5173"}`, x + 70, y + 168, w - 140, 58, a.sfxOn ? "green" : "stone", 24)) {
        a.sfxOn = !a.sfxOn;
        app2.save.sfx = a.sfxOn;
        app2.persist();
      }
      if (app2.ui.button(ctx, "\u89E3\u9501\u5168\u90E8\u5173\u5361\u4E0E\u690D\u7269", x + 70, y + 240, w - 140, 58, "wood", 22)) {
        app2.save.unlocked = LEVELS.length - 1;
        app2.save.plants = [...ALL_PLANTS];
        app2.save.seen = [...ZOMBIE_ORDER];
        app2.save.cleared = Array.from({ length: LEVELS.length - 1 }, (_2, i) => i);
        app2.persist();
        this.toast = "\u5DF2\u89E3\u9501\u5168\u90E8\u5185\u5BB9";
        this.toastT = 2;
      }
      const label = this.confirmReset > 0 ? "\u518D\u70B9\u4E00\u6B21\u786E\u8BA4\u91CD\u7F6E" : "\u91CD\u7F6E\u5B58\u6863";
      if (app2.ui.button(ctx, label, x + 70, y + 312, w - 140, 58, "red", 22)) {
        if (this.confirmReset > 0) {
          const fresh2 = resetSave();
          Object.assign(app2.save, fresh2);
          this.confirmReset = 0;
          this.toast = "\u5B58\u6863\u5DF2\u91CD\u7F6E";
          this.toastT = 2;
        } else this.confirmReset = 3;
      }
      text(ctx, "\u8FDB\u5EA6\u4FDD\u5B58\u5728\u6D4F\u89C8\u5668\u672C\u5730 \xB7 \u5FEB\u6377\u952E\uFF1A\u7A7A\u683C\u6682\u505C\u30011\u20138 \u9009\u5361\u3001Q \u94F2\u5B50\u3001F \u52A0\u901F", VIEW_W / 2, y + h - 40, { size: 14, color: "#6c8170" });
      if (this.toastT > 0) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, this.toastT * 2);
        text(ctx, this.toast, VIEW_W / 2, y + h + 40, { size: 24, color: "#fff3c8", stroke: "#2a1a08", lw: 5 });
        ctx.restore();
      }
    }
    key(k) {
      if (k === "Escape") this.app.go(new TitleScene(this.app));
    }
  };
  var RewardScene = class {
    constructor(app2, level, plants, final) {
      this.app = app2;
      this.level = level;
      this.plants = plants;
      this.final = final;
      this.music = "menu";
      this.t = 0;
    }
    update(dt) {
      this.t += dt;
    }
    render(ctx) {
      const app2 = this.app;
      ctx.fillStyle = linear(ctx, 0, 0, 0, VIEW_H, [
        [0, "#f4faf0"],
        [1, "#dfece0"]
      ]);
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      ctx.save();
      ctx.translate(VIEW_W / 2, 330);
      ctx.rotate(this.t * 0.15);
      ctx.fillStyle = "rgba(255,214,90,0.18)";
      for (let i = 0; i < 16; i++) {
        ctx.rotate(Math.PI / 8);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-60, -900);
        ctx.lineTo(60, -900);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
      const pop = easeOutBack(clamp(this.t / 0.6, 0, 1));
      if (this.plants.length) {
        text(ctx, "\u4F60\u83B7\u5F97\u4E86\u65B0\u690D\u7269\uFF01", VIEW_W / 2, 74, { size: 46, color: "#3f8a1c", stroke: "#fff", lw: 8, weight: 900 });
        const n = this.plants.length;
        this.plants.forEach((id, i) => {
          const cx = VIEW_W / 2 + (i - (n - 1) / 2) * 420;
          const d = PLANTS[id];
          circle(ctx, cx, 300, 120 * pop);
          paint(ctx, radial(ctx, cx, 300, 10, cx, 300, 120, [[0, "#ffffffcc"], [1, "#ffffff00"]]));
          ctx.save();
          ctx.translate(cx, 380);
          ctx.scale(1.9 * pop, 1.9 * pop);
          plantShadow(ctx, 0, 2, 34);
          drawPlant(ctx, id, 0, 0, { t: this.t, hp: 1, state: id === "potato" ? "armed" : void 0 });
          ctx.restore();
          text(ctx, d.name, cx, 430, { size: 34, color: "#315447", weight: 900 });
          ctx.font = `600 18px ${FONT}`;
          wrapText(ctx, d.desc, 360).forEach((ln, k) => text(ctx, ln, cx, 470 + k * 28, { size: 18, color: "#5b7563", weight: 600 }));
          text(ctx, `${d.cost} \u9633\u5149`, cx, 540, { size: 18, color: "#b07a1a", weight: 800 });
        });
      } else {
        text(ctx, this.final ? "\u606D\u559C\u901A\u5173\uFF01\u4F60\u5B88\u4F4F\u4E86\u82B1\u56ED" : `\u5173\u5361 ${this.level.id} \u5B8C\u6210\uFF01`, VIEW_W / 2, 84, { size: 46, color: "#b07a1a", stroke: "#fff", lw: 8, weight: 900 });
        drawTrophy(ctx, VIEW_W / 2, 420, 2.1 * pop, this.t);
        if (this.final) text(ctx, "\u611F\u8C22\u6E38\u73A9 \xB7 \u53BB\u5C0F\u6E38\u620F\u91CC\u6311\u6218\u66F4\u9AD8\u7EAA\u5F55\u5427", VIEW_W / 2, 500, { size: 22, color: "#5b7563", weight: 700 });
      }
      if (this.t > 0.8 && app2.ui.button(ctx, "\u7EE7\u7EED", VIEW_W / 2 - 120, VIEW_H - 120, 240, 64, "green", 28)) app2.go(new SelectScene(app2));
    }
    key(k) {
      if (k === "Enter" || k === " ") this.app.go(new SelectScene(this.app));
    }
  };

  // games-src/garden-guard/src/ui.ts
  var STYLES = {
    wood: { top: "#f4f6de", bottom: "#e2ebc8", edge: "#729874", ink: "#2c5142", stroke: void 0 },
    stone: { top: "#e3ece9", bottom: "#ccdcd7", edge: "#76968e", ink: "#2a4e46", stroke: void 0 },
    green: { top: "#426f55", bottom: "#2c5a47", edge: "#234638", ink: "#edf7d8", stroke: void 0 },
    red: { top: "#e9a389", bottom: "#d17e69", edge: "#a25e51", ink: "#fff8ed", stroke: void 0 },
    ghost: { top: "rgba(255,255,255,0.14)", bottom: "rgba(255,255,255,0.06)", edge: "rgba(255,255,255,0.4)", ink: "#ffffff", stroke: void 0 }
  };
  var UI = class {
    constructor(audio) {
      this.audio = audio;
      this.mx = -999;
      this.my = -999;
      this.down = false;
      this.click = null;
      this.wantsPointer = false;
    }
    queueClick(x, y) {
      this.click = { x, y };
    }
    begin() {
      this.wantsPointer = false;
    }
    end() {
      this.click = null;
    }
    hasClick() {
      return this.click !== null;
    }
    consume() {
      this.click = null;
    }
    over(x, y, w, h) {
      const inside = this.mx >= x && this.mx <= x + w && this.my >= y && this.my <= y + h;
      if (inside) this.wantsPointer = true;
      return inside;
    }
    hit(x, y, w, h) {
      const c = this.click;
      if (!c || c.x < x || c.x > x + w || c.y < y || c.y > y + h) return false;
      this.click = null;
      return true;
    }
    button(ctx, label, x, y, w, h, style = "wood", size = 22, disabled = false) {
      const s = STYLES[style];
      const hover = !disabled && this.over(x, y, w, h);
      const press = hover && this.down;
      const oy = press ? 2 : hover ? -1 : 0;
      ctx.save();
      if (disabled) ctx.globalAlpha *= 0.45;
      rrect(ctx, x, y + 4, w, h, 18);
      ctx.fillStyle = "rgba(35,69,54,0.12)";
      ctx.fill();
      rrect(ctx, x, y + oy, w, h, 18);
      paint(ctx, linear(ctx, 0, y, 0, y + h, [[0, s.top], [1, s.bottom]]), s.edge, 1.5);
      ctx.beginPath();
      ctx.moveTo(x + 18, y + oy + 2);
      ctx.lineTo(x + w - 18, y + oy + 2);
      ctx.strokeStyle = hover ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.5)";
      ctx.lineWidth = 1;
      ctx.stroke();
      text(ctx, label, x + w / 2, y + oy + h / 2 + 1, { size, color: s.ink, stroke: s.stroke, lw: 4, weight: 650 });
      ctx.restore();
      if (disabled) return false;
      const clicked = this.hit(x, y, w, h);
      if (clicked) this.audio.play("click");
      return clicked;
    }
  };

  // games-src/garden-guard/src/app.ts
  var BattleScene = class {
    constructor(app2, battle) {
      this.app = app2;
      this.battle = battle;
      this.music = null;
    }
    update(dt) {
      const b = this.battle;
      if (b.paused) return;
      const n = b.phase === "play" ? b.speed : 1;
      for (let i = 0; i < n; i++) b.update(dt);
    }
    render(ctx) {
      renderBattle(ctx, this.battle, this.app.world(this.battle.level.rows), this.app.ui);
    }
    down(x, y, button) {
      this.battle.pointerDown(x, y, button);
    }
    up(x, y) {
      this.battle.pointerUp(x, y);
    }
    move(x, y) {
      this.battle.pointerMove(x, y);
    }
    key(k) {
      this.battle.key(k);
    }
  };
  var App = class {
    constructor(canvas2) {
      this.canvas = canvas2;
      this.audio = new AudioEngine();
      this.save = loadSave();
      this.t = 0;
      this.next = null;
      this.fade = 0;
      this.fadeDir = 0;
      this.worlds = /* @__PURE__ */ new Map();
      this.scale = 1;
      this.ox = 0;
      this.oy = 0;
      this.dpr = 1;
      this.acc = 0;
      this.last = 0;
      this.ctx = canvas2.getContext("2d");
      this.audio.musicOn = this.save.music;
      this.audio.sfxOn = this.save.sfx;
      this.ui = new UI(this.audio);
      this.scene = new TitleScene(this);
      this.resize();
      this.bind();
    }
    // ------------------------------------------------------------- host api
    persist() {
      writeSave(this.save);
    }
    world(rows) {
      const k = Math.min(2.5, Math.max(1, Math.round(this.scale * this.dpr * 4) / 4));
      const key = `${rows.join("")}@${k}`;
      let cv = this.worlds.get(key);
      if (!cv) {
        cv = renderWorld(rows, k);
        this.worlds.set(key, cv);
      }
      return cv;
    }
    go(scene) {
      if (this.fadeDir === 1) return;
      this.next = scene;
      this.fadeDir = 1;
    }
    startLevel(level) {
      this.go(new BattleScene(this, new Battle(level, this)));
    }
    finish(result, action) {
      const lv = result.level;
      const save = this.save;
      if (lv === ENDLESS) save.endlessBest = Math.max(save.endlessBest, result.score);
      if (lv === BOWLING) save.bowlingBest = Math.max(save.bowlingBest, result.score);
      if (action === "retry") {
        this.persist();
        this.startLevel(lv);
        return;
      }
      if (action === "menu" || !result.won) {
        this.persist();
        this.go(new SelectScene(this));
        return;
      }
      const idx = LEVELS.indexOf(lv);
      const fresh2 = lv.reward.filter((id) => !save.plants.includes(id));
      if (idx >= 0) {
        if (!save.cleared.includes(idx)) save.cleared.push(idx);
        save.unlocked = Math.max(save.unlocked, Math.min(LEVELS.length - 1, idx + 1));
        for (const id of fresh2) save.plants.push(id);
      }
      this.persist();
      this.go(new RewardScene(this, lv, fresh2, idx === LEVELS.length - 1));
    }
    // ------------------------------------------------------------- loop
    start() {
      this.last = performance.now();
      const frame = (now) => {
        const dt = Math.min(0.1, (now - this.last) / 1e3);
        this.last = now;
        this.tick(dt);
        requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    }
    tick(dt) {
      this.acc += dt;
      let steps = 0;
      while (this.acc >= STEP && steps < 8) {
        this.step(STEP);
        this.acc -= STEP;
        steps++;
      }
      if (steps === 8) this.acc = 0;
      this.draw();
    }
    step(dt) {
      this.t += dt;
      if (this.fadeDir === 1) {
        this.fade = Math.min(1, this.fade + dt / 0.28);
        if (this.fade >= 1 && this.next) {
          this.scene = this.next;
          this.next = null;
          this.fadeDir = -1;
          if (this.scene.music !== null) this.audio.music(this.scene.music);
        }
      } else if (this.fadeDir === -1) {
        this.fade = Math.max(0, this.fade - dt / 0.28);
        if (this.fade <= 0) this.fadeDir = 0;
      }
      this.scene.update(dt);
    }
    draw() {
      const ctx = this.ctx;
      const { canvas: canvas2 } = this;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = "#0b0f08";
      ctx.fillRect(0, 0, canvas2.width, canvas2.height);
      const s = this.scale * this.dpr;
      ctx.setTransform(s, 0, 0, s, this.ox * this.dpr, this.oy * this.dpr);
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, VIEW_W, VIEW_H);
      ctx.clip();
      this.ui.begin();
      this.scene.render(ctx);
      this.ui.end();
      if (this.fade > 0) {
        ctx.fillStyle = `rgba(0,0,0,${this.fade})`;
        ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      }
      ctx.restore();
      this.canvas.style.cursor = this.ui.wantsPointer ? "pointer" : "default";
    }
    // ------------------------------------------------------------- input / layout
    resize() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      this.dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      this.canvas.width = Math.round(w * this.dpr);
      this.canvas.height = Math.round(h * this.dpr);
      this.canvas.style.width = `${w}px`;
      this.canvas.style.height = `${h}px`;
      this.scale = Math.min(w / VIEW_W, h / VIEW_H);
      this.ox = (w - VIEW_W * this.scale) / 2;
      this.oy = (h - VIEW_H * this.scale) / 2;
      this.worlds.clear();
    }
    toView(e) {
      return { x: (e.clientX - this.ox) / this.scale, y: (e.clientY - this.oy) / this.scale };
    }
    bind() {
      let resizeT = 0;
      window.addEventListener("resize", () => {
        window.clearTimeout(resizeT);
        resizeT = window.setTimeout(() => this.resize(), 80);
      });
      const c = this.canvas;
      c.addEventListener("contextmenu", (e) => e.preventDefault());
      c.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        this.audio.unlock();
        if (this.scene.music !== null) this.audio.music(this.scene.music);
        const p = this.toView(e);
        this.ui.mx = p.x;
        this.ui.my = p.y;
        this.ui.down = true;
        if (this.fadeDir !== 0) return;
        if (e.button !== 2) this.ui.queueClick(p.x, p.y);
        this.scene.down?.(p.x, p.y, e.button);
      });
      c.addEventListener("pointermove", (e) => {
        const p = this.toView(e);
        this.ui.mx = p.x;
        this.ui.my = p.y;
        this.scene.move?.(p.x, p.y);
      });
      window.addEventListener("pointerup", (e) => {
        this.ui.down = false;
        const p = this.toView(e);
        this.scene.up?.(p.x, p.y);
      });
      window.addEventListener("keydown", (e) => {
        this.audio.unlock();
        if (e.key === " " || e.key.startsWith("Arrow")) e.preventDefault();
        this.scene.key?.(e.key);
      });
      document.addEventListener("visibilitychange", () => {
        if (document.hidden && this.scene instanceof BattleScene && this.scene.battle.phase === "play") this.scene.battle.paused = true;
      });
    }
    /** Jump straight into a level: `?level=1-5`, `?level=endless`, `?level=bowling`. */
    openFromQuery(q2) {
      if (q2.has("unlock")) {
        this.save.unlocked = LEVELS.length - 1;
        this.save.plants = [...PLANT_ORDER];
        this.save.seen = [...ZOMBIE_ORDER];
      }
      const scene = q2.get("scene");
      if (scene === "select") this.scene = new SelectScene(this);
      if (scene === "almanac") this.scene = new AlmanacScene(this);
      if (scene === "settings") this.scene = new SettingsScene(this);
      const id = q2.get("level");
      if (!id) return false;
      const lv = id === "endless" ? ENDLESS : id === "bowling" ? BOWLING : LEVELS.find((l) => l.id === id);
      if (!lv) return false;
      this.scene = new BattleScene(this, new Battle(lv, this));
      return true;
    }
    /** A staged mid-battle tableau, used for the arcade cover screenshot. */
    showcase() {
      const b = new Battle(LEVELS[11], this);
      b.slots = ["sunflower", "peashooter", "repeater", "snowpea", "wallnut", "cherry", "torchwood", "threepeater"];
      b.cam = 0;
      b.setPhase("play");
      b.sun = 375;
      b.cooldown.set("cherry", 30);
      b.cooldown.set("wallnut", 12);
      b.waveIndex = 13;
      const layout = [
        [0, 0, "sunflower"],
        [1, 0, "sunflower"],
        [2, 0, "sunflower"],
        [3, 0, "sunflower"],
        [4, 0, "sunflower"],
        [0, 1, "repeater"],
        [1, 1, "snowpea"],
        [2, 1, "threepeater"],
        [3, 1, "repeater"],
        [4, 1, "cabbage"],
        [0, 2, "peashooter"],
        [2, 2, "torchwood"],
        [3, 2, "chomper"],
        [4, 2, "peashooter"],
        [1, 3, "squash"],
        [0, 4, "wallnut"],
        [2, 4, "tallnut"],
        [3, 4, "spikeweed"],
        [4, 3, "potato"],
        [1, 5, "wallnut"]
      ];
      for (const [r, c, id] of layout) b.place(id, r, c);
      b.particles = [];
      for (const p of b.plants) {
        p.age = 3;
        if (p.id === "potato") {
          p.state = "armed";
          p.stateT = 20;
        }
      }
      const zs = [
        ["bucket", 0, 758],
        ["cone", 1, 856],
        ["football", 2, 762],
        ["basic", 3, 690],
        ["door", 4, 830],
        ["flag", 1, 1e3],
        ["pole", 3, 1040],
        ["paper", 0, 930],
        ["garg", 2, 1060],
        ["basic", 4, 1e3]
      ];
      for (const [id, row, x] of zs) {
        const z = b.makeZombie(id, row, x);
        b.zombies.push(z);
      }
      b.zombies[0].state = "eat";
      b.zombies[0].target = b.grid[0][4].uid;
      b.zombies[1].slow = 8;
      b.suns.push(b.makeSun(470, 300, 0, 0, 300, 25, "idle"));
      b.suns.push(b.makeSun(820, 520, 0, 0, 520, 25, "idle"));
      b.tipT = 0;
      b.messages = [];
      this.scene = new BattleScene(this, b);
      this.audio.sfxOn = false;
    }
  };

  // games-src/garden-guard/src/main.ts
  var canvas = document.getElementById("game");
  var app = new App(canvas);
  var q = new URLSearchParams(location.search);
  if (q.has("demo")) app.showcase();
  else app.openFromQuery(q);
  app.start();
  var loader = document.getElementById("boot");
  if (loader) {
    loader.classList.add("done");
    window.setTimeout(() => loader.remove(), 600);
  }
})();
//# sourceMappingURL=main.js.map
