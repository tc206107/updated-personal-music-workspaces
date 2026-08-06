# 个人作品集源文件，可自作修改后直接使用

1920 年代默剧标题字体 + 波斯地毯花纹的古典风个人作品集。所有曲目可在线播放（真实音频），MIDI/源文件可直接下载。

## 打开方式

- 本地：直接双击 `index.html`（推荐 Edge / Chrome，离线使用内嵌数据）。
- 线上（唯一）：`你的GitHub仓库地址`
- 作品总览第二页：`overview.html`（导航「总览」或首页作品集上方的「音乐作品总览」入口）。

## 在线管理（推荐）

- 管理地址：`你仓库克隆存放的地址`
- 桌面快捷方式：`你的名字 在线管理.url`（双击直达登录界面）
- 登录密码：`你的密码`（与本地管理页相同）
- 首次使用：登录后粘贴一个 GitHub 细粒度 PAT（只授权本仓库、Contents 读写；令牌仅保存在浏览器 localStorage，不会上传到任何服务器），点「连接并拉取数据」即可编辑与上传；每次点「保存并发布」直接提交到 `main` 分支，GitHub Pages 约 1 分钟内自动更新，公网立即生效。
- 不依赖任何第三方托管服务（初版原有依赖，已移除 Netlify）。

## 本地管理（local-admin.html，维护本地文件夹）

1. 用 Edge/Chrome 打开本地 `local-admin.html`，输入密码 `你的密码`（登录后可改）；
2. 「选择站点文件夹」选中本地站点文件夹，即可编辑作品、上传音频/MIDI/源文件/封面并保存；
3. 保存的是 `assets/js/works.js`（内嵌回退数据）；如需线上生效，请用「在线管理」保存发布，或把改动同步进 Git 仓库（同时更新 `assets/data/works.json`）。

## 数据是怎么工作的

- 线上（https）：页面自动读取 `assets/data/works.json`（在线管理页维护）；
- 本地（file://）：读取失败时自动回退到 `assets/js/works.js` 中的内嵌数据。

## 手动新增作品

1. 把音频（mp3/wav）放入 `assets/audio/`，MIDI 放入 `assets/midi/`，源文件放入 `assets/sources/`，封面放入 `assets/img/`；
2. 在 `assets/data/works.json` 的 `works` 数组中追加对象（字段与现有条目一致），并同步 `assets/js/works.js`；
3. 刷新页面即可。

## 目录结构

```
index.html                 公开首页
overview.html              音乐作品总览（第二页，链接直达第三页卡片）
catalog.html               作品集目录（第三页，阅览格式卡片 + 锚点定位）
online-admin.html          在线管理（密码 + GitHub 令牌，提交到 main 分支）
local-admin.html           本地管理页（密码保护，维护本地文件夹）
assets/
  data/works.json          线上数据源
  css/styles.css           古典风样式
  js/works.js              内嵌回退数据
  js/loader.js             数据加载器（JSON 优先）
  js/player.js             在线播放器（真实音频）
  js/main.js               首页渲染与交互
  js/overview.js           总览页渲染
  js/catalog.js            目录页渲染与播放
  js/admin.js              本地管理页逻辑
  js/admin-config.js       管理密码配置（SHA-256 加盐）
  js/online-admin.js       在线管理页逻辑
  img/ audio/ midi/ sources/
```

## 关于「防止他人修改」

- 线上内容由 GitHub 仓库 + 细粒度 PAT 管理，只有持有令牌的人能修改并自动产生提交记录；
- 本地管理页有密码保护，入口不放在公开首页；
- 静态文件本身公开可读。

## 数据说明

- 拍号、速度、配器由源文件解析得到，时长以实际音频文件为准；
- `marianette.musicxml` 与 `marianette.mid` 为同一作品的两个格式，挂在 marianette 卡片下作为 MusicXML 下载；
- 音频由本机 MuseScore 4 从各曲目源文件导出。
