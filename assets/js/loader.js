/* 数据加载器：在线环境优先读取 assets/data/works.json（CMS 可管理），
   读取失败（如 file:// 本地打开）时保留 works.js 中的内嵌数据。
   页面脚本通过 window.TCDATA 等待数据就绪。 */
"use strict";

window.TCDATA = (async () => {
  try {
    const res = await fetch("assets/data/works.json", { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();
    if (Array.isArray(data.works)) window.WORKS = data.works;
    if (Array.isArray(data.contactLines)) window.CONTACT_LINES = data.contactLines;
  } catch (e) {
    /* file:// 或离线环境：使用内嵌数据 */
  }
})();