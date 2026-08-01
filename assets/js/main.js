/* TangCheee — 渲染作品卡片与联系方式，接线播放器 */
"use strict";

(() => {
  const $ = (sel) => document.querySelector(sel);

  const filmstrip = $("#filmstrip");
  const contactList = $("#contactList");
  const playerBar = $("#playerBar");
  const pbToggle = $("#pbToggle");
  const pbTitle = $("#pbTitle");
  const pbMeta = $("#pbMeta");
  const pbSeek = $("#pbSeek");
  const pbCur = $("#pbCur");
  const pbDur = $("#pbDur");
  const pbDownload = $("#pbDownload");

  let activeId = null;
  let durationSec = 0;
  let seeking = false;

  const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const workById = (id) => (window.WORKS || []).find((w) => w.id === id);

  /* ---------- 渲染作品卡片（仅事实信息） ---------- */

  function renderWorks() {
    filmstrip.innerHTML = "";
    const frag = document.createDocumentFragment();
    (window.WORKS || []).forEach((w) => {
      const frame = document.createElement("article");
      frame.className = "film-frame";
      frame.id = "work-" + esc(w.id);
      frame.setAttribute("role", "listitem");

      const links = (w.downloads || []).map((d) =>
        `<a class="frame-link" href="${esc(d.href)}" download>${esc(d.label)}</a>`
      ).join("");

      frame.innerHTML = `
        <div class="frame-orn" aria-hidden="true"></div>
        <div class="frame-cover">
          <img src="${esc(w.cover)}" alt="${esc(w.title)}" loading="lazy">
          <button class="frame-play" type="button" data-play="${esc(w.id)}" aria-label="播放 ${esc(w.title)}">▶</button>
        </div>
        <div class="frame-body">
          <h3 class="frame-title">${esc(w.title)}</h3>
          <p class="frame-meta">
            <span>${esc(w.timeSig)}</span><span class="dot">·</span><span>${esc(w.tempo)}</span>
            <span class="dot">·</span><span>${esc(w.instruments)}</span>
            <span class="dot">·</span><span>${esc(w.duration)}</span>
          </p>
          <div class="frame-links">
            ${links}
            <span class="frame-index">${esc(w.index)} · ${esc(w.year)}</span>
          </div>
        </div>`;
      frag.appendChild(frame);
    });
    filmstrip.appendChild(frag);
  }

  /* ---------- 联系方式（每行一条完整文本） ---------- */

  function renderContact() {
    contactList.innerHTML = "";
    const frag = document.createDocumentFragment();
    (window.CONTACT_LINES || []).forEach((line) => {
      const li = document.createElement("li");
      li.innerHTML = `<span class="contact-value">${esc(line)}</span>`;
      frag.appendChild(li);
    });
    contactList.appendChild(frag);
  }

  /* ---------- 播放器栏 ---------- */

  function activate(id) {
    const w = workById(id);
    if (!w) return;
    activeId = id;
    playerBar.hidden = false;
    pbTitle.textContent = w.title;
    pbMeta.textContent = `${w.index} · ${w.timeSig} · ${w.tempo} · ${w.instruments} · ${w.duration}`;
    pbDownload.href = w.downloads[0] ? w.downloads[0].href : "#";
    pbDownload.setAttribute("download", w.downloads[0] ? w.downloads[0].href.split("/").pop() : "");
  }

  function onProgress(t, dur) {
    durationSec = isFinite(dur) ? dur : 0;
    pbCur.textContent = TCPlayer.fmt(t);
    pbDur.textContent = TCPlayer.fmt(durationSec);
    if (!seeking && durationSec > 0) {
      pbSeek.value = Math.round((Math.min(t, durationSec) / durationSec) * 1000);
    }
  }

  TCPlayer.on("progress", onProgress);
  TCPlayer.on("state", (st) => {
    pbToggle.textContent = st.playing ? "❚❚" : "▶";
    pbToggle.setAttribute("aria-label", st.playing ? "暂停" : "播放");
  });
  TCPlayer.on("end", () => {
    pbToggle.textContent = "▶";
    onProgress(durationSec, durationSec);
  });

  /* ---------- 事件 ---------- */

  filmstrip.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-play]");
    if (!btn) return;
    const id = btn.dataset.play;
    activate(id);
    TCPlayer.play(workById(id));
  });

  pbToggle.addEventListener("click", () => {
    if (activeId) TCPlayer.toggle();
  });

  pbSeek.addEventListener("input", () => {
    seeking = true;
    if (durationSec > 0) {
      const t = (pbSeek.value / 1000) * durationSec;
      pbCur.textContent = TCPlayer.fmt(t);
    }
  });

  pbSeek.addEventListener("change", () => {
    seeking = false;
    if (durationSec > 0) TCPlayer.seek((pbSeek.value / 1000) * durationSec);
  });

  window.addEventListener("keydown", (e) => {
    if (e.code !== "Space") return;
    const tag = document.activeElement && document.activeElement.tagName;
    if (tag === "INPUT" || tag === "BUTTON" || tag === "A" || tag === "TEXTAREA") return;
    e.preventDefault();
    if (activeId) TCPlayer.toggle();
  });

  /* ---------- 启动：等待数据（JSON 优先，内嵌回退） ---------- */

  const dataReady = window.TCDATA || Promise.resolve();
  dataReady.then(() => {
    renderWorks();
    renderContact();
  });
})();