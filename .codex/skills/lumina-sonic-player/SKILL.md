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
- `src/config/nav.ts` — top nav: 随笔 / 音乐 / AI工具 / 动画效果
- `src/pages` — Home, Tools, Effects
- `src/modules/blog` — typed article content, cards, index and detail pages
- `src/modules/music` — self-contained player
- `src/router/routes/site.ts` + `music.ts` — modular routes, lazy-loaded
- Effects page iframes `public/effects/aquaInk/index.html` (AquaInkGL WebGL fluid ink)

## UI Rules

- Site pages: deep ink `#0B1322`, light wells, colorless glass (`backdrop-blur` 40–60px + saturate 180%), champagne `#E4B863`, rounded 16–24px, spring easing.
- Do not use purple-pink AI gradients on the site shell.
- Music module may keep its own tokens/styles under `modules/music`.

## Validation

- `npm run build`
- Check `/`, `/tools`, `/effects`, `/music`
- Effects iframe loads and pointer drag creates ink motion
