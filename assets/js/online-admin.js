/* TangCheee 在线管理（GitHub Pages 方案 A）
   密码门（与 local-admin 共用 admin-config.js）+ GitHub 细粒度 PAT（存 localStorage）
   -> 直接调用 GitHub Contents API 提交到 main 分支，Pages 自动重建发布。
   依赖：admin-config.js（密码）、works.js（初始数据，连接后以仓库 works.json 为准）。 */
"use strict";

(() => {
  const $ = (s) => document.querySelector(s);

  const REPO = "tc206107/updated-personal-music-workspaces";
  const BRANCH = "main";
  const JSON_PATH = "assets/data/works.json";
  const JS_PATH = "assets/js/works.js";
  const API = "https://api.github.com";
  const LS_PAT = "tcdc_gh_pat";
  const SS_AUTH = "tc-admin-online";

  const loginBox = $("#loginBox");
  const githubBox = $("#githubBox");
  const editorBox = $("#editorBox");
  const pwdInput = $("#pwdInput");
  const loginBtn = $("#loginBtn");
  const loginErr = $("#loginErr");
  const patInput = $("#patInput");
  const connectBtn = $("#connectBtn");
  const clearPatBtn = $("#clearPatBtn");
  const connStatus = $("#connStatus");
  const logoutBtn = $("#logoutBtn");
  const statusText = $("#statusText");
  const worksList = $("#worksList");
  const contactText = $("#contactText");
  const addWorkBtn = $("#addWorkBtn");
  const saveBtn = $("#saveBtn");
  const reloadBtn = $("#reloadBtn");

  let pat = localStorage.getItem(LS_PAT) || "";
  let works = [];
  let contactLines = [];
  let shaJson = null;
  let shaJs = null;
  let connected = false;

  /* ---------- 密码（与 local-admin 相同：sha256(SALT+密码)） ---------- */
  const sha256hex = async (s) => {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
  };
  const checkPwd = async (pw) => (await sha256hex(ADMIN_CONFIG.SALT + pw)) === ADMIN_CONFIG.HASH;

  async function tryLogin() {
    if (await checkPwd(pwdInput.value)) {
      sessionStorage.setItem(SS_AUTH, "1");
      loginBox.hidden = true;
      githubBox.hidden = false;
      patInput.value = pat;
    } else {
      loginErr.textContent = "密码错误";
    }
  }
  loginBtn.addEventListener("click", tryLogin);
  pwdInput.addEventListener("keydown", (e) => { if (e.key === "Enter") tryLogin(); });
  if (sessionStorage.getItem(SS_AUTH) === "1") {
    loginBox.hidden = true;
    githubBox.hidden = false;
    patInput.value = pat;
  }

  /* ---------- GitHub API ---------- */
  function headers() {
    return {
      Authorization: "Bearer " + pat,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "TangCheee-online-admin"
    };
  }

  function b64Encode(str) {
    const bytes = new TextEncoder().encode(str);
    let bin = "";
    for (let i = 0; i < bytes.length; i += 0x8000) {
      bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    }
    return btoa(bin);
  }

  function b64Decode(b64) {
    const bin = atob(b64.replace(/\s/g, ""));
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  async function api(path, opts) {
    const res = await fetch(API + path, Object.assign({ headers: headers() }, opts || {}));
    if (!res.ok) {
      let msg = "HTTP " + res.status;
      try {
        const j = await res.json();
        msg += (j && j.message ? ": " + j.message : "");
      } catch (e) { /* ignore */ }
      throw new Error(msg);
    }
    return res.status === 204 ? null : res.json();
  }

  /* ---------- 连接 GitHub ---------- */
  async function connect() {
    pat = patInput.value.trim();
    if (!pat) { connStatus.textContent = "请先粘贴 GitHub 令牌（PAT）"; return; }
    connStatus.textContent = "连接中…";
    try {
      const user = await api("/user");
      await loadFromGitHub();
      localStorage.setItem(LS_PAT, pat);
      connected = true;
      connStatus.textContent = "已连接 " + (user.login || "") + " → " + REPO + "（共 " + works.length + " 首作品）";
      showEditor();
    } catch (e) {
      connStatus.textContent = "连接失败：" + e.message;
      localStorage.removeItem(LS_PAT);
    }
  }

  async function loadFromGitHub() {
    const wj = await api("/repos/" + REPO + "/contents/" + JSON_PATH + "?ref=" + BRANCH);
    const data = JSON.parse(b64Decode(wj.content));
    works = Array.isArray(data.works) ? data.works : [];
    contactLines = Array.isArray(data.contactLines) ? data.contactLines : [];
    shaJson = wj.sha;
    try {
      const ws = await api("/repos/" + REPO + "/contents/" + JS_PATH + "?ref=" + BRANCH);
      shaJs = ws.sha;
    } catch (e) { shaJs = null; }
  }

  connectBtn.addEventListener("click", connect);
  patInput.addEventListener("keydown", (e) => { if (e.key === "Enter") connect(); });
  clearPatBtn.addEventListener("click", () => {
    localStorage.removeItem(LS_PAT);
    patInput.value = "";
    pat = "";
    connStatus.textContent = "已清除本地保存的令牌";
  });
  logoutBtn.addEventListener("click", () => {
    sessionStorage.removeItem(SS_AUTH);
    location.reload();
  });

  /* ---------- 编辑器 ---------- */
  function showEditor() {
    githubBox.hidden = true;
    editorBox.hidden = false;
    renderAll();
  }

  function renderAll() {
    renderWorks();
    contactText.value = contactLines.join("\n");
  }

  const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  function renderWorks() {
    worksList.innerHTML = "";
    works.forEach((w, i) => worksList.appendChild(workNode(w, i)));
  }

  function workNode(w, i) {
    const div = document.createElement("div");
    div.className = "work-editor";
    const dlText = (w.downloads || []).map((d) => (d.label || "") + "|" + (d.href || "")).join("\n");
    const index = w.index || "№" + String(i + 1).padStart(2, "0");
    div.innerHTML =
      '<h3>' + esc(w.title || "(未命名)") + ' · ' + esc(index) + '</h3>' +
      '<div class="field-grid">' +
        '<div class="field"><label>标题</label><input data-k="title" value="' + esc(w.title) + '"></div>' +
        '<div class="field"><label>年份</label><input data-k="year" value="' + esc(w.year) + '"></div>' +
        '<div class="field"><label>拍号</label><input data-k="timeSig" value="' + esc(w.timeSig) + '"></div>' +
        '<div class="field"><label>速度</label><input data-k="tempo" value="' + esc(w.tempo) + '"></div>' +
        '<div class="field"><label>配器</label><input data-k="instruments" value="' + esc(w.instruments) + '"></div>' +
        '<div class="field"><label>时长</label><input data-k="duration" value="' + esc(w.duration) + '"></div>' +
        '<div class="field"><label>封面（assets/img/…）</label><input data-k="cover" value="' + esc(w.cover) + '"></div>' +
        '<div class="field"><label>音频（assets/audio/…）</label><input data-k="audio" value="' + esc(w.audio) + '"></div>' +
        '<div class="field field-wide"><label>下载文件（每行：标签|路径）</label><textarea data-k="downloads">' + esc(dlText) + '</textarea></div>' +
      '</div>' +
      '<div class="upload-row"><span>上传到</span>' +
        '<select class="up-cat">' +
          '<option value="audio">assets/audio</option>' +
          '<option value="midi">assets/midi</option>' +
          '<option value="sources">assets/sources</option>' +
          '<option value="img">assets/img</option>' +
        '</select>' +
        '<input type="file" class="up-file" multiple>' +
        '<span class="up-hint"></span>' +
      '</div>' +
      '<div class="work-actions">' +
        '<button class="admin-btn small up-apply" type="button">上传并填入路径</button>' +
        '<button class="admin-btn small danger del" type="button">删除作品</button>' +
      '</div>';

    const set = (k, v) => { w[k] = v; };

    div.querySelectorAll("input[data-k]").forEach((inp) => {
      inp.addEventListener("change", () => {
        set(inp.dataset.k, inp.value.trim());
        if (inp.dataset.k === "title") {
          div.querySelector("h3").textContent = (w.title || "(未命名)") + " · " + (w.index || index);
        }
      });
    });

    const dlArea = div.querySelector("textarea[data-k='downloads']");
    dlArea.addEventListener("change", () => {
      w.downloads = dlArea.value.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
        const parts = l.split("|");
        return { label: (parts[0] || "文件").trim(), href: (parts[1] || "").trim() };
      });
    });

    div.querySelector(".del").addEventListener("click", () => {
      if (confirm("删除《" + (w.title || "") + "》？仅从数据中移除，不删除仓库文件。")) {
        works.splice(i, 1);
        renderAll();
      }
    });

    const upFile = div.querySelector(".up-file");
    const upCat = div.querySelector(".up-cat");
    const upHint = div.querySelector(".up-hint");
    div.querySelector(".up-apply").addEventListener("click", () => {
      const file = upFile.files && upFile.files[0];
      if (!file) { upHint.textContent = "请先选择文件"; return; }
      uploadOne(file, upCat.value, upHint, w);
    });

    return div;
  }

  const safeName = (name) => name.replace(/[\\/:*?"<>|]/g, "-").replace(/\s+/g, "-");

  function applyPath(cat, rel, w) {
    if (cat === "audio") w.audio = rel;
    else if (cat === "img") w.cover = rel;
    else {
      const label = cat === "midi" ? "MIDI" : (rel.match(/\.musicxml$/i) ? "MusicXML" : rel.split(".").pop().toUpperCase());
      w.downloads = w.downloads || [];
      w.downloads = w.downloads.filter((d) => d.href !== rel);
      w.downloads.push({ label: label, href: rel });
    }
  }

  /* ---------- 上传（GitHub Contents API） ---------- */
  async function uploadOne(file, cat, hintEl, w) {
    if (!connected) { hintEl.textContent = "请先连接 GitHub"; return; }
    const rel = "assets/" + cat + "/" + safeName(file.name);
    hintEl.textContent = "上传中：" + file.name + " …";
    try {
      const b64 = await fileToBase64(file);
      let existing = null;
      try {
        existing = await api("/repos/" + REPO + "/contents/" + rel + "?ref=" + BRANCH);
      } catch (e) { existing = null; }
      const body = {
        message: "Upload " + rel + " via online admin",
        content: b64,
        branch: BRANCH
      };
      if (existing && existing.sha) body.sha = existing.sha;
      await api("/repos/" + REPO + "/contents/" + rel, { method: "PUT", body: JSON.stringify(body) });
      applyPath(cat, rel, w);
      hintEl.textContent = "已上传并填入：" + rel;
      statusText.textContent = "已上传 " + rel + "（记得点「保存并发布」提交数据）";
      renderWorks();
    } catch (e) {
      hintEl.textContent = "上传失败：" + e.message;
    }
  }

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => {
        const dataUrl = fr.result;
        const idx = dataUrl.indexOf(",");
        resolve(dataUrl.slice(idx + 1));
      };
      fr.onerror = () => reject(new Error("读取文件失败"));
      fr.readAsDataURL(file);
    });
  }

  /* ---------- 保存并发布 ---------- */
  function buildWorksJson() {
    return JSON.stringify({ works: works, contactLines: contactLines }, null, 2) + "\n";
  }

  function buildWorksJs() {
    return "/* TangCheee 内嵌作品数据（回退用）\n   由在线管理页自动生成并同步到 GitHub。\n   在线环境优先读取 assets/data/works.json。 */\n\n" +
      "window.WORKS = " + JSON.stringify(works, null, 2) + ";\n\n" +
      "window.CONTACT_LINES = " + JSON.stringify(contactLines, null, 2) + ";\n";
  }

  async function saveAndPublish() {
    if (!connected) { statusText.textContent = "请先连接 GitHub"; return; }
    contactLines = contactText.value.split("\n").map((l) => l.trim()).filter(Boolean);
    statusText.textContent = "保存中…";
    try {
      const jsonContent = b64Encode(buildWorksJson());
      const jsonBody = { message: "Update works.json via online admin", content: jsonContent, branch: BRANCH };
      if (shaJson) jsonBody.sha = shaJson;
      const rj = await api("/repos/" + REPO + "/contents/" + JSON_PATH, { method: "PUT", body: JSON.stringify(jsonBody) });
      shaJson = rj.content.sha;

      if (!shaJs) {
        try {
          const ws = await api("/repos/" + REPO + "/contents/" + JS_PATH + "?ref=" + BRANCH);
          shaJs = ws.sha;
        } catch (e) { shaJs = null; }
      }
      const jsBody = { message: "Sync works.js via online admin", content: b64Encode(buildWorksJs()), branch: BRANCH };
      if (shaJs) jsBody.sha = shaJs;
      const rs = await api("/repos/" + REPO + "/contents/" + JS_PATH, { method: "PUT", body: JSON.stringify(jsBody) });
      shaJs = rs.content.sha;

      statusText.textContent = "已保存并发布 ✓（GitHub Pages 约 1 分钟内自动更新）";
    } catch (e) {
      statusText.textContent = "保存失败：" + e.message;
    }
  }

  addWorkBtn.addEventListener("click", () => {
    works.push({
      id: "new-" + Date.now(),
      title: "", year: "", timeSig: "", tempo: "", instruments: "", duration: "",
      cover: "", audio: "", downloads: [],
      index: "№" + String(works.length + 1).padStart(2, "0")
    });
    renderAll();
  });

  reloadBtn.addEventListener("click", async () => {
    statusText.textContent = "拉取最新…";
    try {
      await loadFromGitHub();
      renderAll();
      statusText.textContent = "已拉取最新数据（" + works.length + " 首作品）";
    } catch (e) {
      statusText.textContent = "拉取失败：" + e.message;
    }
  });

  saveBtn.addEventListener("click", saveAndPublish);

  /* ---------- 初始化（离线回退数据预览） ---------- */
  if (Array.isArray(window.WORKS)) works = JSON.parse(JSON.stringify(window.WORKS));
  if (Array.isArray(window.CONTACT_LINES)) contactLines = window.CONTACT_LINES.slice();
})();