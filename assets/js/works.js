/* TangCheee 内嵌作品数据（回退用）
   线上优先读取 assets/data/works.json（Decap CMS 管理），
   file:// 本地打开时使用本文件中的数据。
   本地管理页 admin.html 保存时也会更新本文件。 */

window.WORKS = [
  {
    id: "love-reverse-and-resurrection",
    title: "love, reverse, and resurrection",
    year: "2026",
    timeSig: "3/4",
    tempo: "144 BPM",
    instruments: "Violin · Piano ×2",
    duration: "2:21",
    cover: "assets/img/cover-love.svg",
    audio: "assets/audio/love-reverse-and-resurrection.mp3",
    downloads: [
      { label: "MIDI", href: "assets/midi/love-reverse-and-resurrection.mid" }
    ],
    index: "№ 01"
  },
  {
    id: "marianette",
    title: "marianette",
    year: "2026",
    timeSig: "3/4",
    tempo: "108 BPM",
    instruments: "Violin · Viola · Cello",
    duration: "2:50",
    cover: "assets/img/marianette-score.png",
    audio: "assets/audio/marianette.mp3",
    downloads: [
      { label: "MIDI", href: "assets/midi/marianette.mid" },
      { label: "MusicXML", href: "assets/sources/marianette.musicxml" }
    ],
    index: "№ 02"
  },
  {
    id: "fei-e",
    title: "飞蛾",
    year: "2026",
    timeSig: "4/4",
    tempo: "166 BPM",
    instruments: "Piano ×4",
    duration: "1:41",
    cover: "assets/img/cover-fei-e.svg",
    audio: "assets/audio/fei-e.mp3",
    downloads: [
      { label: "MIDI", href: "assets/midi/fei-e.mid" }
    ],
    index: "№ 03"
  },
  {
    id: "the-abyssal-sigh",
    title: "The Abyssal Sigh",
    year: "2026",
    timeSig: "2/4",
    tempo: "108 BPM",
    instruments: "Violin · Piano ×2",
    duration: "3:18",
    cover: "assets/img/cover-abyssal.svg",
    audio: "assets/audio/the-abyssal-sigh.mp3",
    downloads: [
      { label: "MIDI", href: "assets/midi/the-abyssal-sigh.mid" },
      { label: "MSCZ", href: "assets/sources/The Abyssal Sigh.mscz" }
    ],
    index: "№ 04"
  }
];

window.CONTACT_LINES = [
  "qq号：692597540",
  "qq聊天群号：781170461",
  "bilibili账号UID：527728057",
  "若需联系邮箱地址可发QQ邮箱，个人邮箱学习与工作用暂不贴出，十分抱歉。"
];