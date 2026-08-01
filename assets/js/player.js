/* TangCheee 播放器：基于真实音频文件（MP3），支持播放/暂停/跳转 */
"use strict";

const TCPlayer = (() => {
  const audio = new Audio();
  audio.preload = "metadata";

  let current = null;

  const handlers = { progress: () => {}, state: () => {}, end: () => {} };
  const on = (name, fn) => { handlers[name] = fn; };

  audio.addEventListener("loadedmetadata", () => handlers.progress(audio.currentTime, audio.duration));
  audio.addEventListener("timeupdate", () => handlers.progress(audio.currentTime, audio.duration));
  audio.addEventListener("play", () => handlers.state({ playing: true }));
  audio.addEventListener("pause", () => handlers.state({ playing: false }));
  audio.addEventListener("ended", () => { handlers.state({ playing: false }); handlers.end(); });

  function play(work) {
    if (!work) return;
    if (current && current.id === work.id) {
      toggle();
      return;
    }
    current = { id: work.id, work };
    audio.src = work.audio;
    audio.currentTime = 0;
    const p = audio.play();
    if (p && p.catch) p.catch(() => {});
    handlers.state({ playing: true });
  }

  function toggle() {
    if (!current) return;
    if (audio.paused) {
      const p = audio.play();
      if (p && p.catch) p.catch(() => {});
    } else {
      audio.pause();
    }
  }

  function seek(sec) {
    if (!current || !isFinite(audio.duration)) return;
    audio.currentTime = Math.max(0, Math.min(sec, audio.duration));
    handlers.progress(audio.currentTime, audio.duration);
  }

  const fmt = (sec) => {
    if (!isFinite(sec) || sec < 0) return "00:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
  };

  return { play, toggle, seek, on, fmt, current: () => current };
})();