/* TangCheee 本地管理页：增删改作品、上传素材、保存数据（File System Access + 下载回退）
   线上内容请使用 /admin/ 的 Decap CMS。 */
"use strict";

(() => {
  const $ = (s) => document.querySelector(s);

  const loginBox = $("#loginBox");
  const editorBox = $("#editorBox");
  const pwdInput = $("#pwdInput");
  const loginBtn = $("#loginBtn");
  const loginErr = $("#loginErr");
  const statusText = $("#statusText");
  const worksList = $("#worksList");
  const contactText = $("#contactText");
  const pickDirBtn = $("#pickDirBtn");
  const saveBtn = $("#saveBtn");
  const downloadBtn = $("#downloadBtn");
  const addWorkBtn = $("#addWorkBtn");
  const pwdBtn = $("#pwdBtn");

  let dirHandle = null;
  let works = JSON.parse(JSON.stringify(window.WORKS || []));
  let contactLines = (window.CONTACT_LINES || []).slice();

  /* ---------- 密码 ---------- */

  const sha256hex = async (s) => {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
  };

  const checkPwd = async (pw) => (await sha256hex(ADMIN_CONFIG.SALT + pw)) === ADMIN_CONFIG.HASH;

  async function tryLogin() {
    if (await checkPwd(pwdInput.value)) {
      sessionStorage.setItem("tc-admin", "1");
      showEditor();
    } else {
      loginErr.textContent = "密码错误";
    }
  }

  loginBtn.addEventListener("click", tryLogin);
  pwdInput.addEventListener("keydown", (e) => { if (e.key === "Enter") tryLogin(); });

  function showEditor() {
    loginBox.hidden = true;
    editorBox.hidden = false;
    renderAll();
  }

  if (sessionStorage.getItem("tc-admin") === "1") showEditor();

  /* ---------- 渲染 ---------- */

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
    const dlText = (w.downloads || []).map((d) => `${d.label}|${d.href}`).join("\n");
    const index = w.index || "№ " + String(i + 1).padStart(2, "0");
    div.innerHTML = `
      <h3>${esc(w.title) || "(未命名)"} · ${esc(index)}</h3>
      <div class="field-grid">
        <div class="field"><label>标题</label><input data-k="title" value="${esc(w.title)}"></div>
        <div class="field"><label>年份</label><input data-k="year" value="${esc(w.year)}"></div>
        <div class="field"><label>拍号</label><input data-k="timeSig" value="${esc(w.timeSig)}"></div>
        <div class="field"><label>速度</label><input data-k="tempo" value="${esc(w.tempo)}"></div>
        <div class="field"><label>配器</label><input data-k="instruments" value="${esc(w.instruments)}"></div>
        <div class="field"><label>时长</label><input data-k="duration" value="${esc(w.duration)}"></div>
        <div class="field"><label>封面（assets/img/…）</label><input data-k="cover" value="${esc(w.cover)}"></div>
        <div class="field"><label>音频（assets/audio/…）</label><input data-k="audio" value="${esc(w.audio)}"></div>
        <div class="field field-wide"><label>下载文件（每行：标签|路径）</label><textarea data-k="downloads">${esc(dlText)}</textarea></div>
      </div>
      <div class="upload-row">
        <span>上传到</span>
        <select class="up-cat">
          <option value="audio">assets/audio</option>
          <option value="midi">assets/midi</option>
          <option value="sources">assets/sources</option>
          <option value="img">assets/img</option>
        </select>
        <input type="file" class="up-file" multiple>
        <span class="up-hint"></span>
      </div>
      <div class="work-actions">
        <button class="admin-btn small up-apply" type="button">应用此作品路径</button>
        <button class="admin-btn small danger del" type="button">删除作品</button>
      </div>`;

    const set = (k, v) => { w[k] = v; };

    div.querySelectorAll("input[data-k]").forEach((inp) => {
      inp.addEventListener("change", () => {
        set(inp.dataset.k, inp.value.trim());
        if (inp.dataset.k === "title") div.querySelector("h3").textContent = (w.title || "(未命名)") + " · " + (w.index || index);
      });
    });

    const dlArea = div.querySelector("textarea[data-k='downloads']");
    dlArea.addEventListener("change", () => {
      w.downloads = dlArea.value.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
        const [label, href] = l.split("|");
        return { label: (label || "文件").trim(), href: (href || "").trim() };
      });
    });

    div.querySelector(".del").addEventListener("click", () => {
      if (confirm("删除《" + (w.title || "") + "》？仅从数据中移除，不删除文件。")) {
        works.splice(i, 1);
        renderAll();
      }
    });

    const upFile = div.querySelector(".up-file");
    const upCat = div.querySelector(".up-cat");
    const upHint = div.querySelector(".up-hint");
    upFile.addEventListener("change", () => uploadFiles(upFile, upCat.value, upHint, w));

    div.querySelector(".up-apply").addEventListener("click", () => {
      const file = upFile.files && upFile.files[0];
      if (!file) { upHint.textContent = "请先选择文件"; return; }
      const rel = "assets/" + upCat.value + "/" + safeName(file.name);
      applyPath(upCat.value, rel, w);
      upHint.textContent = "已填入：" + rel;
      renderWorks();
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
      w.downloads.push({ label, href: rel });
    }
  }

  /* ---------- 文件系统访问 ---------- */

  const CAT_DIR = { audio: "audio", midi: "midi", sources: "sources", img: "img" };

  async function writeToSite(relPath, data) {
    if (!dirHandle) throw new Error("未连接文件夹");
    const parts = relPath.split("/");
    let h = dirHandle;
    for (const p of parts.slice(0, -1)) h = await h.getDirectoryHandle(p, { create: true });
    const fh = await h.getFileHandle(parts[parts.length - 1], { create: true });
    const wtr = await fh.createWritable();
    await wtr.write(data);
    await wtr.close();
  }

  async function uploadFiles(input, cat, hintEl, w) {
    const files = Array.from(input.files || []);
    if (!files.length) return;
    if (!dirHandle) {
      hintEl.textContent = "请先点击「选择站点文件夹」";
      return;
    }
    hintEl.textContent = "上传中…";
    try {
      for (const f of files) {
        const rel = "assets/" + CAT_DIR[cat] + "/" + safeName(f.name);
        await writeToSite(rel, f);
        applyPath(cat, rel, w);
      }
      hintEl.textContent = "完成：" + files.length + " 个文件，路径已填入";
      renderWorks();
    } catch (err) {
      hintEl.textContent = "上传失败：" + err.message;
    }
  }

  pickDirBtn.addEventListener("click", async () => {
    try {
      dirHandle = await window.showDirectoryPicker({ mode: "readwrite" });
      statusText.textContent = "已连接文件夹：" + dirHandle.name;
    } catch (err) {
      statusText.textContent = "未连接（浏览器不支持或已取消），保存将使用下载方式";
    }
  });

  /* ---------- 序列化与保存 ---------- */

  function serialize() {
    const header = "/* TangCheee 内嵌作品数据（回退用）\n   线上优先读取 assets/data/works.json（Decap CMS 管理），\n   本地打开时使用本文件。由 admin.html 生成。 */\n\n";
    return header +
      "window.WORKS = " + JSON.stringify(works, null, 2) + ";\n\n" +
      "window.CONTACT_LINES = " + JSON.stringify(contactLines, null, 2) + ";\n";
  }

  function download(name, text) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: "text/javascript;charset=utf-8" }));
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }

  saveBtn.addEventListener("click", async () => {
    contactLines = contactText.value.split("\n").map((l) => l.trim()).filter(Boolean);
    const text = serialize();
    if (dirHandle) {
      try {
        await writeToSite("assets/js/works.js", text);
        statusText.textContent = "已保存到 " + dirHandle.name + "（内嵌回退数据已更新）";
      } catch (err) {
        statusText.textContent = "保存失败：" + err.message + "（已改为下载）";
        download("works.js", text);
      }
    } else {
      download("works.js", text);
      statusText.textContent = "已下载 works.js，请放入 assets/js/ 覆盖原文件";
    }
  });

  downloadBtn.addEventListener("click", () => {
    contactLines = contactText.value.split("\n").map((l) => l.trim()).filter(Boolean);
    download("works.js", serialize());
  });

  addWorkBtn.addEventListener("click", () => {
    const n = works.length + 1;
    works.push({
      id: "new-work-" + Date.now().toString(36),
      title: "",
      year: "",
      timeSig: "",
      tempo: "",
      instruments: "",
      duration: "",
      cover: "",
      audio: "",
      downloads: [],
      index: "№ " + String(n).padStart(2, "0")
    });
    renderAll();
    worksList.lastElementChild.scrollIntoView({ behavior: "smooth", block: "center" });
  });

  contactText.addEventListener("change", () => {
    contactLines = contactText.value.split("\n").map((l) => l.trim()).filter(Boolean);
  });

  /* ---------- 修改密码 ---------- */

  pwdBtn.addEventListener("click", () => {
    const box = document.createElement("div");
    box.className = "pwd-dialog";
    box.innerHTML = `
      <input type="password" id="np1" placeholder="新密码">
      <input type="password" id="np2" placeholder="重复新密码">
      <button class="admin-btn small" id="npOk" type="button">确认修改</button>
      <span class="admin-status" id="npMsg"></span>`;
    pwdBtn.after(box);
    pwdBtn.disabled = true;
    const ok = box.querySelector("#npOk");
    const msg = box.querySelector("#npMsg");
    ok.addEventListener("click", async () => {
      const a = box.querySelector("#np1").value;
      const b = box.querySelector("#np2").value;
      if (!a || a.length < 4) { msg.textContent = "密码至少 4 位"; return; }
      if (a !== b) { msg.textContent = "两次输入不一致"; return; }
      const salt = "tc-salt-" + Date.now().toString(36);
      const hash = await sha256hex(salt + a);
      ADMIN_CONFIG.SALT = salt;
      ADMIN_CONFIG.HASH = hash;
      const cfg = `/* 管理密码配置：仅存盐与哈希。 */\nconst ADMIN_CONFIG = {\n  SALT: "${salt}",\n  HASH: "${hash}"\n};\n`;
      try {
        if (dirHandle) {
          await writeToSite("assets/js/admin-config.js", cfg);
          msg.textContent = "已修改并写入 admin-config.js";
        } else {
          download("admin-config.js", cfg);
          msg.textContent = "已生成新 admin-config.js，请放入 assets/js/ 覆盖原文件";
        }
        box.querySelector("#np1").value = "";
        box.querySelector("#np2").value = "";
      } catch (err) {
        msg.textContent = "写入失败：" + err.message;
      }
    });
  });
})();