# TangCheee — 古典作品集

1920 年代默剧标题字体 + 波斯地毯花纹的古典风个人作品集。所有曲目可在线播放（真实音频），MIDI/源文件可直接下载。

## 打开方式

- 直接双击 `index.html`（推荐 Edge / Chrome，离线使用内嵌数据）。
- 线上版：`https://tangcheee.netlify.app/`
- 作品总览第二页：`overview.html`（导航「总览」或首页作品集上方的「音乐作品总览」入口）。

## 数据是怎么工作的

- 线上（https）：页面自动读取 `assets/data/works.json` —— 这个文件由 Decap CMS 管理；
- 本地（file://）：读取失败时自动回退到 `assets/js/works.js` 中的内嵌数据；
- 因此：线上改内容用 CMS；本地维护旧版文件夹用 `local-admin.html`（写内嵌回退数据）。

## 在线管理（Decap CMS，推荐）

线上访问 `https://tangcheee.netlify.app/admin/` 即可直接增删改作品、上传素材、改联系方式，保存后自动提交到 Git 并发布，**无需重新手动部署**。

首次启用需要完成 Netlify 侧设置（一次性）：

1. 站点必须**连接 Git 仓库**（GitHub/GitLab/Bitbucket），拖拽部署的站点无法使用 Git Gateway；
2. Netlify 后台 → Site settings → Identity → **Enable Identity**；
3. Identity → **Enable Git Gateway**；
4. Identity → Invite users，邀请你自己（邮箱）并接受邀请；
5. 打开 `https://tangcheee.netlify.app/admin/`，用该邮箱登录即可。

注意：`admin/config.yml` 中 `branch: main`，若你的仓库默认分支不同请修改后重新部署。

## 本地管理（local-admin.html，维护本地文件夹）

1. 用 Edge/Chrome 打开本地 `local-admin.html`，输入密码 `tangcheee`（登录后可改）；
2. 「选择站点文件夹」选中本地站点文件夹，即可编辑作品、上传音频/MIDI/源文件/封面并保存；
3. 保存的是 `assets/js/works.js`（内嵌回退数据）；如需线上生效，请把改动同步进 Git 仓库（或同时更新 `assets/data/works.json`）。

## 手动新增作品

1. 把音频（mp3/wav）放入 `assets/audio/`，MIDI 放入 `assets/midi/`，源文件放入 `assets/sources/`，封面放入 `assets/img/`（或用 CMS 上传到 `assets/uploads/`，路径写 `/assets/uploads/文件名`）；
2. 在 `assets/data/works.json` 的 `works` 数组中追加对象（字段与现有条目一致），并同步 `assets/js/works.js`；
3. 刷新页面即可。

## 目录结构

```
index.html                 公开首页
overview.html              音乐作品总览（第二页，链接直达第三页卡片）
catalog.html               作品集目录（第三页，阅览格式卡片 + 锚点定位）
local-admin.html             本地管理页（密码保护，维护本地文件夹）
admin/
  index.html               Decap CMS 在线管理入口
  config.yml               CMS 配置（作品/联系方式字段、Git Gateway）
assets/
  data/works.json          线上数据源（CMS 管理）
  uploads/                 CMS 上传的素材
  css/styles.css           古典风样式
  js/works.js              内嵌回退数据
  js/loader.js             数据加载器（JSON 优先）
  js/player.js             在线播放器（真实音频）
  js/main.js               首页渲染与交互
  js/overview.js           总览页渲染
  js/catalog.js            目录页渲染与播放
  js/admin.js              本地管理页逻辑
  img/ audio/ midi/ sources/
```

## 关于「防止他人修改」

- 线上内容由 Git 仓库 + Netlify Identity/Git Gateway 管理，只有受邀登录的账号能修改并自动产生提交记录；
- 本地管理页有密码保护，入口不放在公开首页；
- 静态文件本身公开可读；如需完全禁止阅读，需要额外鉴权方案（通常不适用于作品集）。

## 数据说明

- 拍号、速度、配器由源文件解析得到，时长以实际音频文件为准；
- `marianette.musicxml` 与 `marianette.mid` 为同一作品的两个格式，挂在 marianette 卡片下作为 MusicXML 下载；
- 音频由本机 MuseScore 4 从各曲目源文件导出。