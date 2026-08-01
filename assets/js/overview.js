/* 音乐作品总览：文本式排序作品名超链接列表 */
"use strict";

(() => {
  const list = document.getElementById("overviewList");
  const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const dataReady = window.TCDATA || Promise.resolve();
  dataReady.then(() => {
    const frag = document.createDocumentFragment();
    (window.WORKS || []).forEach((w) => {
      const li = document.createElement("li");
      li.className = "overview-item";
      const a = document.createElement("a");
      a.href = "catalog.html#work-" + encodeURIComponent(w.id);
      a.className = "overview-link";
      a.textContent = (w.index ? w.index + " · " : "") + w.title;
      li.appendChild(a);
      frag.appendChild(li);
    });
    list.appendChild(frag);
  });
})();