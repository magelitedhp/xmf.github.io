---
name: lumina-sonic-player
description: Maintain and extend the Lumina Sonic Vue desktop music player in this repository. Use when updating the macOS-style music UI, playback state logic, component structure, project documentation, or prototype fidelity based on the local stitch_macos_style_music_web reference.
---

# Lumina Sonic Player

Use this skill when working on this repository's Vue 3 + Vite desktop music player.

## Reference

- Prototype source: `C:\Users\19568\Desktop\stitch_macos_style_music_web\stitch_macos_style_music_web`
- Design guide: `lumina_sonic/DESIGN.md`
- Main prototype screens: `_1/screen.png`, `_2/screen.png`, `_3/screen.png`, `_4/screen.png`

## Architecture

- Keep `src/App.vue` as a thin composition layer.
- Put playback state and controls in `src/composables/usePlayer.ts`.
- Put seed data, copy, image URLs, and shared types in `src/data/music.ts`.
- Put reusable UI in `src/components/music`.
- Put page-level views in `src/components/music/views`.
- Put global styles in `src/styles`; keep `src/style.css` as import-only.

## UI Rules

- Preserve the macOS light-mode direction: fixed 260px sidebar, fluid content, translucent bottom player, soft neutral surfaces.
- Use Electric Rose (`#c90038`) for active navigation, primary playback controls, progress, and like states.
- Keep album art and hero imagery prominent; do not replace the app with a landing page.
- Keep cards and controls compact for a PC music app workflow.
- Avoid putting all styles or all components into one file.

## Validation

- Run `npm run build` after structural or TypeScript changes.
- Check that Discover, Search, Library, and Playing views still render from `App.vue`.
- Check that play/pause, previous/next, seek, volume, search, and like interactions still route through `usePlayer`.
