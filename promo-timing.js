/* Cue times in seconds for why-sami-promo-v272.mp3, aligned to its recorded voice.
   Keep this table with the audio: replacing the track requires re-timing it. */
(function (root) {
  'use strict';
  const process = [
    [4.40, 2.20, 'BUILDING A SITE PLAN'],
    [7.46, 1.60, 'MULTIPLE SOURCES'],
    [10.02, 1.60, 'CHASING INFORMATION'],
    [12.06, 1.65, 'WAITING FOR ANSWERS'],
    [15.26, 2.10, 'EVERY DELAY COSTS TIME'],
    [18.32, 2.10, 'EVERY DELAY COSTS MONEY'],
  ];
  const sentences = [
    [21.60, 25.15, 'WHAT IF EVERYTHING YOU NEED WAS IN ONE PLACE?'],
    [27.00, 29.02, 'INTRODUCING SAMI'],
    [29.02, 33.20, 'SPATIAL ANALYSIS · MAPPING INTELLIGENCE'],
    [34.18, 35.65, 'FIND YOUR SITE'],
    [36.16, 38.32, 'DEFINE YOUR WORKING AREA'],
    [38.86, 41.35, 'BUILD TRUE-SCALE SITE PLANS'],
    [42.22, 43.48, 'ADD ASSETS'],
    [43.82, 45.25, 'ASSESS CONSTRAINTS'],
    [45.88, 47.28, 'PLAN ACCESS'],
    [47.72, 49.60, 'HGV ROUTES'],
    [50.26, 52.40, 'ALL WITHIN ONE WORKSPACE'],
    [54.02, 56.20, 'VOICE OR TEXT'],
    [56.22, 61.10, 'ASK SAMI TO MAKE THE CHANGES FOR YOU'],
    [61.64, 63.62, 'IT’S TIME TO WORK SMARTER'],
  ];
  function currentTime(audio, mediaDriven, now, start) {
    // A paused/buffering media clock must never jump to elapsed wall time.
    return mediaDriven && audio && Number.isFinite(audio.currentTime)
      ? Math.max(0, audio.currentTime) : Math.max(0, (now - start) / 1000);
  }
  const api = {process, sentences, currentTime};
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SAMIStoryTiming = api;
})(typeof window === 'object' ? window : globalThis);
