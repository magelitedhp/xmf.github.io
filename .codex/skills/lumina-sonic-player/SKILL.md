---
name: lumina-sonic-player
description: Maintain the Nocturne Vue site (glass homepage, modules for music/tools/effects). Use for routing, Academia music UI, prop1 glass site shell, or AquaInkGL effects page.
---

# Nocturne Site

Vue 3 + Vite multi-module personal site. Homepage uses **prop1 Nocturne Glassmorphism**. Blog content is the main narrative; music, tools, and effects are feature modules.

## Reference

- Site shell design: `ui/prop1.md`
- Music module design (optional): `ui/prop2.md`
- Ink animation source: https://github.com/WishMelz/AquaInkGL (served from `public/effects/aquaInk`)

## Architecture

- `src/App.vue` — root `RouterView` only
- `src/layouts/SiteLayout.vue` — glass nav + atmosphere for site pages
- `src/config/nav.ts` — top nav: 随笔 / 音乐 / AI工具 / 动画效果 / 游戏
- `src/pages` — Home, Tools, Effects
- `src/modules/blog` — typed article content, cards, index and detail pages
- `src/modules/music` — self-contained player
- `src/router/routes/site.ts` + `music.ts` — modular routes, lazy-loaded
- Effects page iframes `public/effects/aquaInk/index.html` (AquaInkGL WebGL fluid ink)
- `src/modules/game` — game arcade. `/games` (`GameIndexPage`) lists cover cards from the registry `data/games.ts`; `/games/:slug` (`GameDetailPage`) shows header + controls/notes and lazy-loads the entry's `load()` component. `components/GameFrame.vue` is the shared stage (fullscreen + toolbar slot); `components/GameCard.vue` is the list card. Covers live in `public/games/<slug>/cover.png`.
- To add a game: create `games/<slug>/<Name>.vue`, add a cover, append an entry to `data/games.ts` — no route changes.
- First game 《烬灯行》 in `games/ember-lantern/`: `EmberLantern.vue` hosts a 960×540 canvas; `engine/` holds `game.ts` (state, rooms, combat), `enemies.ts` (AI + bosses), `upgrades.ts`, `render.ts` (procedural pixel art + HUD), `input.ts`, `audio.ts` (WebAudio synth). Gameplay style is inspired by game.inc.re Entropy Blade, but never copy its code or assets — it is not open source.
- Second game 《花园保卫战》 (Garden Guard, lawn tower defense) is a standalone project in `games-src/garden-guard/` (TS + esbuild, own `tsconfig.json`). `npm run game:garden` type-checks and builds it into one HTML: `output/garden-guard.html`, copied to `public/games/garden-guard/index.html`. Intermediate artifacts in `.build/` are intentionally kept. The site wrapper `games/garden-guard/GardenGuard.vue` embeds that file in an iframe inside `GameFrame`. Rebuild the game before `npm run build` whenever its source changes. Art, music and code are original; never copy PvZ assets.

## UI Rules

- Site pages: deep ink `#0B1322`, light wells, colorless glass (`backdrop-blur` 40–60px + saturate 180%), champagne `#E4B863`, rounded 16–24px, spring easing.
- Do not use purple-pink AI gradients on the site shell.
- Music module may keep its own tokens/styles under `modules/music`.

## Validation

- `npm run build`
- Check `/`, `/tools`, `/effects`, `/music`, `/games`, `/games/ember-lantern`, `/games/garden-guard`
- Effects iframe loads and pointer drag creates ink motion
