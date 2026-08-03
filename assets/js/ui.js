/* 共享界面功能：回到顶部按钮 + 移动端菜单 */
"use strict";

(() => {
  const toTop = document.getElementById("toTop");
  const navToggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".nav");

  /* 回到顶部：滚动超过一屏后显示 */
  if (toTop) {
    const onScroll = () => {
      toTop.hidden = window.scrollY < 320;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    toTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* 移动端菜单 */
  if (navToggle && nav) {
    navToggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.addEventListener("click", (e) => {
      if (e.target.closest("a")) {
        nav.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
      }
    });
  }
})();