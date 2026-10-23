# Engine provenance

PvZ-Portable is copyright (C) 2026 Zhou Qiankang and contributors, with portions based on the PopCap Games Framework. Source: https://github.com/wszqkzqk/PvZ-Portable

The unmodified JavaScript and WebAssembly runtime were downloaded from the project's official hosted build:
https://wszqkzqk.github.io/PvZ-Portable/pvz-portable.html

- Runtime observed build number: 931; commit date: 2026-10-10.
- Matching dated source commit: `141c1476dd462ac3526f796e303177616f4de6bc`.
- Corresponding upstream source archive is included as `engine-source-build931.zip`.
- Runtime JS SHA-256: `e52b4b438b91826f4fd0f9539729d6f9053e06bf2b24792e6b0a9b2d30387e10`.
- Runtime WASM SHA-256: `f905f2a40db10f2c39c6aa823fa1fed21db557d17d0b4c08788707a1fbd10b4a`.

The engine's LGPL-3.0 license and accompanying GPL-3.0 terms are retained in `LICENSE-LGPL-3.0.txt` and `LICENSE-GPL-3.0.txt`. Third-party notices and framework/source component headers are retained in the source archive. Source build instructions and dependencies are in the upstream repository and its `.github/workflows/ci.yml` WASM build job. The runtime binary has not been modified; this project's loader/compatibility source is in `games-src/pvz-kindergarten/`.

JSZip 3.10.2: https://github.com/Stuk/jszip . The distributed minified file retains its upstream license banner (MIT or GPLv3).

The original game artwork, music and other user-supplied data are separate from the open-source engine. Engine licensing does not establish ownership or redistribution permission for that data. Full original resource bundles are currently kept in an ignored local directory and are not included in this public runtime directory.
