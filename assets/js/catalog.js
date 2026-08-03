/* 作品集（第三页）：纵向阅览卡片、分类筛选、详情浮层、锚点直达 */
"use strict";

(() => {
  const $ = (sel) => document.querySelector(sel);

  const list = $("#catalogList");
  const filterBar = $("#filterBar");
  const playerBar = $("#playerBar");
  const pbToggle = $("#pbToggle");
  const pbTitle = $("#pbTitle");
  const pbMeta = $("#pbMeta");
  const pbSeek = $("#pbSeek");
  const pbCur = $("#pbCur");
  const pbDur = $("#pbDur");
  const pbDownload = $("#pbDownload");

  const modal = $("#workModal");
  const modalCover = $("#modalCover");
  const modalTitle = $("#modalTitle");
  const modalMeta = $("#modalMeta");
  const modalPlay = $("#modalPlay");
  const modalDownloads = $("#modalDownloads");
  const modalClose = $("#modalClose");

  let activeId = null;
  let durationSec = 0;
  let seeking = false;
  let activeFilter = "全部";

  const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const workById = (id) => (window.WORKS || []).find((w) => w.id === id);

  /* ---------- 筛选栏（按配器，事实数据动态生成） ---------- */

  function renderFilterBar() {
    if (!filterBar) return;
    const values = [];
    (window.WORKS || []).forEach((w) => {
      if (w.instruments && values.indexOf(w.instruments) === -1) values.push(w.instruments);
    });
    const chips = ["全部"].concat(values);
    filterBar.innerHTML = "";
    chips.forEach((v) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "filter-chip";
      btn.textContent = v;
      btn.setAttribute("aria-pressed", v === activeFilter ? "true" : "false");
      btn.addEventListener("click", () => {
        activeFilter = v;
        filterBar.querySelectorAll(".filter-chip").forEach((b) => b.setAttribute("aria-pressed", b.textContent === v ? "true" : "false"));
        renderCatalog();
      });
      filterBar.appendChild(btn);
    });
  }

  /* ---------- 渲染目录卡片 ---------- */

  function renderCatalog() {
    list.innerHTML = "";
    const frag = document.createDocumentFragment();
    (window.WORKS || []).filter((w) => activeFilter === "全部" || w.instruments === activeFilter).forEach((w) => {
      const card = document.createElement("article");
      card.className = "catalog-card";
      card.id = "work-" + esc(w.id);

      const links = (w.downloads || []).map((d) =>
        `<a class="catalog-link" href="${esc(d.href)}" download>${esc(d.label)}</a>`
      ).join("");

      card.innerHTML = `
        <div class="cc-orn" aria-hidden="true"></div>
        <div class="catalog-cover">
          <img src="${esc(w.cover)}" alt="${esc(w.title)}" loading="lazy">
          <button class="cc-play" type="button" data-play="${esc(w.id)}" aria-label="播放 ${esc(w.title)}">▶</button>
        </div>
        <div class="catalog-body">
          <h2 class="catalog-title">${esc(w.title)}</h2>
          <p class="catalog-meta">
            <span>${esc(w.timeSig)}</span><span class="dot">·</span><span>${esc(w.tempo)}</span>
            <span class="dot">·</span><span>${esc(w.instruments)}</span>
            <span class="dot">·</span><span>${esc(w.duration)}</span>
          </p>
          <div class="catalog-links">
            ${links}
            <span class="catalog-index">${esc(w.index)} · ${esc(w.year)}</span>
          </div>
        </div>`;
      frag.appendChild(card);
    });
    list.appendChild(frag);
  }

  /* ---------- 详情浮层 ---------- */

  function openModal(w) {
    if (!modal || !w) return;
    modalCover.src = w.cover || "";
    modalCover.alt = w.title || "";
    modalTitle.textContent = w.title || "";
    modalMeta.innerHTML = `
      <span>${esc(w.year)}</span><span class="dot">·</span><span>${esc(w.timeSig)}</span>
      <span class="dot">·</span><span>${esc(w.tempo)}</span>
      <span class="dot">·</span><span>${esc(w.instruments)}</span>
      <span class="dot">·</span><span>${esc(w.duration)}</span>`;
    modalDownloads.innerHTML = "";
    (w.downloads || []).forEach((d) => {
      const a = document.createElement("a");
      a.className = "modal-download";
      a.href = d.href || "#";
      a.setAttribute("download", "");
      a.textContent = d.label || "下载";
      modalDownloads.appendChild(a);
    });
    modalPlay.dataset.play = w.id;
    modal.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    if (!modal) return;
    modal.hidden = true;
    document.body.style.overflow = "";
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

  list.addEventListener("click", (e) => {
    const playBtn = e.target.closest("[data-play]");
    if (playBtn) {
      const id = playBtn.dataset.play;
      activate(id);
      TCPlayer.play(workById(id));
      return;
    }
    const link = e.target.closest("a");
    if (link) return;
    const card = e.target.closest(".catalog-card");
    if (card) {
      const id = card.id.replace(/^work-/, "");
      openModal(workById(id));
    }
  });

  modalPlay.addEventListener("click", () => {
    const w = workById(modalPlay.dataset.play);
    if (!w) return;
    activate(w.id);
    TCPlayer.play(w);
  });

  modalClose.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeModal();
      return;
    }
    if (e.code !== "Space") return;
    const tag = document.activeElement && document.activeElement.tagName;
    if (tag === "INPUT" || tag === "BUTTON" || tag === "A" || tag === "TEXTAREA") return;
    e.preventDefault();
    if (activeId) TCPlayer.toggle();
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

  /* ---------- 启动 ---------- */

  const dataReady = window.TCDATA || Promise.resolve();
  dataReady.then(() => {
    renderFilterBar();
    renderCatalog();
    if (location.hash) {
      const target = document.querySelector(location.hash);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
})();