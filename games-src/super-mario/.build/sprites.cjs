"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// games-src/super-mario/src/sprites.ts
var sprites_exports = {};
__export(sprites_exports, {
  palette: () => palette,
  sprites: () => sprites
});
module.exports = __toCommonJS(sprites_exports);
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  palette,
  sprites
});
