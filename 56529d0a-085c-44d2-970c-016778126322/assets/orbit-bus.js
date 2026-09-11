/* Orbit 跨文档总线
   ─────────────────────────────────────────────────────────────────────
   拆分之后每个功能是一份独立文档，彼此拿不到对方的 document（file:// 下
   跨文档访问会被浏览器按不透明源拦掉）。所以视图之间不直接互相调用，一律
   经统一入口中转：

       视图 --send--> 入口 --broadcast--> 所有视图
                    入口 --deliver----> 某一个视图

   信封固定为 { __orbit: true, type, payload }。视图侧的 on(type, fn) 收到
   的第二个参数是消息来源窗口，需要回话时可以对着它 postMessage。

   这个文件同时负责主题：它在 <head> 里同步加载，读到 URL 片段里的 theme
   就立刻写到 <html data-theme>，赶在首次绘制之前——否则深色下会先闪一
   帧白。 */
(function () {
  "use strict";

  var THEME_KEY = "orbit.theme";
  var FRAGMENT = /(?:^|[#&])theme=(dark|light)/;
  var framed = window.parent !== window;
  var handlers = {};

  function root() { return document.documentElement; }

  /* 主题来源的优先级：URL 片段（入口创建 iframe 时带上，首帧即生效）
     → 上次的选择 → 系统偏好。 */
  function readTheme() {
    var m = FRAGMENT.exec(window.location.hash || "");
    if (m) return m[1];
    var saved = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch (e) { saved = null; }
    if (saved === "dark" || saved === "light") return saved;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark" : "light";
  }

  function applyTheme(theme) {
    root().setAttribute("data-theme", theme === "dark" ? "dark" : "light");
  }

  function currentTheme() {
    return root().getAttribute("data-theme") === "dark" ? "dark" : "light";
  }

  function setTheme(theme) {
    applyTheme(theme);
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) {}
  }

  /* 读一次并立刻落地：本文件在 <head> 中同步执行，所以这一步发生在
     首次绘制之前。 */
  applyTheme(readTheme());

  function envelope(type, payload) {
    return { __orbit: true, type: type, payload: payload === undefined ? null : payload };
  }

  function post(target, type, payload) {
    if (!target) return;
    try { target.postMessage(envelope(type, payload), "*"); } catch (e) {}
  }

  /* 视图 → 入口。单独打开视图文件时没有入口可通知，直接跳过。 */
  function send(type, payload) {
    if (!framed) return;
    post(window.parent, type, payload);
  }

  /* 入口 → 某一个视图。 */
  function deliver(frame, type, payload) {
    if (!frame) return;
    post(frame.contentWindow, type, payload);
  }

  /* 入口 → 全部视图。 */
  function broadcast(type, payload) {
    if (framed) return;
    var frames = document.querySelectorAll(".view-frame");
    for (var i = 0; i < frames.length; i++) deliver(frames[i], type, payload);
  }

  function on(type, fn) {
    (handlers[type] || (handlers[type] = [])).push(fn);
  }

  /* 视图就绪上报。入口收到后才投递排队中的消息与权威状态。 */
  function ready(view) {
    send("ready", view);
  }

  /* theme 由总线自己消化；其余类型交给注册者。
     单个处理器抛错不影响同类型的其它处理器，但错误必须打到控制台，
     不能悄悄吞掉。 */
  window.addEventListener("message", function (e) {
    var d = e.data;
    if (!d || d.__orbit !== true || typeof d.type !== "string") return;
    if (d.type === "theme") { applyTheme(d.payload); return; }
    var list = handlers[d.type];
    if (!list) return;
    for (var i = 0; i < list.length; i++) {
      try {
        list[i](d.payload, e.source);
      } catch (err) {
        if (window.console) console.error("[OrbitBus] " + d.type + " 处理器出错", err);
      }
    }
  });

  /* 声明式跳转：视图里带 data-nav="视图名" 的元素被点击时，请入口切页。
     用事件委托，视图自己不用再挂监听。 */
  function glue() {
    document.addEventListener("click", function (e) {
      var el = e.target.closest ? e.target.closest("[data-nav]") : null;
      if (!el) return;
      e.preventDefault();
      send("nav", el.getAttribute("data-nav"));
    });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", glue);
  } else {
    glue();
  }

  window.OrbitBus = {
    framed: framed,
    send: send,
    deliver: deliver,
    broadcast: broadcast,
    on: on,
    ready: ready,
    readTheme: readTheme,
    applyTheme: applyTheme,
    currentTheme: currentTheme,
    setTheme: setTheme
  };
})();
