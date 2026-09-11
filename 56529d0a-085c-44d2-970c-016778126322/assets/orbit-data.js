/* Orbit 共享数据层
   ─────────────────────────────────────────────────────────────────────
   拆分之后，入口和 11 个功能视图各自是一份独立文档，每份都要有自己的
   数据副本。这个文件就是那份副本，被 12 个文档共同引入。

   数据只有一处定义：DEPTS / ROLES / USERS / MENUS 四个数组。部门人数、
   角色成员数、未读条目一概由它们算出，不另立汇总值——"同一个数字在两
   个页面不一样"这类问题因此在结构上就不可能发生。

   跨文档的那一半在 orbit-bus.js：视图改动共享状态后经入口广播给其它视
   图，入口在视图就绪时把权威副本推过去（见文件末尾的 apply* 系列）。 */
(function () {
  "use strict";

  /* ---------- 组织 / 账号 / 角色 / 菜单 ----------
     USERS 是唯一的账号来源。行格式：
     [姓名, 登录名, 部门编码, 角色编码, 状态, 最后登录]
     日期口径与全局一致：今天 = 09-11。 */

var DEPTS = [
  { code: "HQ",        name: "Orbit 科技",  parent: "",    leader: "张思远" },
  { code: "RD",        name: "研发中心",    parent: "HQ",  leader: "周敏" },
  { code: "RD-PLAT",   name: "平台研发组",  parent: "RD",  leader: "周敏" },
  { code: "RD-APP",    name: "应用研发组",  parent: "RD",  leader: "高远" },
  { code: "RD-QA",     name: "质量保障组",  parent: "RD",  leader: "吴桐" },
  { code: "FIN",       name: "财务部",      parent: "HQ",  leader: "王雅琪" },
  { code: "FIN-ACC",   name: "会计核算组",  parent: "FIN", leader: "李承宇" },
  { code: "FIN-TRE",   name: "资金结算组",  parent: "FIN", leader: "郑楠" },
  { code: "MKT",       name: "市场部",      parent: "HQ",  leader: "孙博文" },
  { code: "MKT-BRAND", name: "品牌市场组",  parent: "MKT", leader: "何静" },
  { code: "MKT-CHN",   name: "渠道合作组",  parent: "MKT", leader: "马骁" },
  { code: "HR",        name: "人力资源",    parent: "HQ",  leader: "陈默" },
  { code: "HR-REC",    name: "招聘与配置组", parent: "HR", leader: "徐蕾" },
  { code: "HR-PERF",   name: "薪酬绩效组",  parent: "HR",  leader: "林涛" }
];

var ROLES = [
  { code: "super",    name: "超级管理员", scope: "全平台数据",   menus: ["dashboard", "chart", "doc", "notice", "member", "docConfig", "setting", "dept", "sysuser", "role", "menu"] },
  { code: "admin",    name: "管理员",     scope: "本部门及下级", menus: ["dashboard", "chart", "doc", "notice", "member", "docConfig", "setting", "dept", "sysuser", "role"] },
  { code: "approver", name: "审批人",     scope: "本部门",       menus: ["dashboard", "chart", "doc", "notice", "member"] },
  { code: "editor",   name: "编辑者",     scope: "仅本人",       menus: ["dashboard", "chart", "doc", "notice"] },
  { code: "viewer",   name: "只读",       scope: "仅本人",       menus: ["dashboard", "chart", "doc"] }
];

var USERS = [
  /* 研发中心 · 平台研发组 18 */
  ["张思远", "zhang", "RD-PLAT", "super", "ok", "09-11 14:28"],
  ["韩雪", "han.x", "RD-PLAT", "super", "ok", "09-11 13:40"],
  ["周敏", "zhou.m", "RD-PLAT", "admin", "ok", "09-11 12:05"],
  ["施远", "shi.y", "RD-PLAT", "approver", "ok", "09-11 11:20"],
  ["崔迪", "cui.d", "RD-PLAT", "approver", "ok", "09-10 18:30"],
  ["冯磊", "feng.l", "RD-PLAT", "editor", "ok", "09-11 10:12"],
  ["秦朗", "qin.l", "RD-PLAT", "editor", "ok", "09-11 09:48"],
  ["邓宇", "deng.y", "RD-PLAT", "editor", "ok", "09-10 17:22"],
  ["汪洋", "wang.y", "RD-PLAT", "editor", "ok", "09-10 16:05"],
  ["罗嘉", "luo.j", "RD-PLAT", "editor", "ok", "09-10 14:40"],
  ["唐宁", "tang.n", "RD-PLAT", "editor", "ok", "09-10 11:18"],
  ["蒋维", "jiang.w", "RD-PLAT", "editor", "ok", "09-09 17:55"],
  ["石岩", "shi.yan", "RD-PLAT", "editor", "ok", "09-09 15:30"],
  ["顾清", "gu.q", "RD-PLAT", "editor", "ok", "09-09 10:22"],
  ["赵鹏", "zhao", "RD-PLAT", "viewer", "off", "—"],
  ["沈括", "shen.k", "RD-PLAT", "viewer", "ok", "09-08 16:44"],
  ["郝然", "hao.r", "RD-PLAT", "viewer", "ok", "09-08 14:10"],
  ["白露", "bai.l", "RD-PLAT", "viewer", "ok", "09-05 09:30"],
  /* 研发中心 · 应用研发组 15 */
  ["高远", "gao.y", "RD-APP", "admin", "ok", "09-11 11:05"],
  ["苏航", "su.h", "RD-APP", "approver", "ok", "09-11 10:40"],
  ["邵峰", "shao.f", "RD-APP", "approver", "ok", "09-10 15:20"],
  ["田甜", "tian.t", "RD-APP", "editor", "ok", "09-11 09:20"],
  ["范晓", "fan.x", "RD-APP", "editor", "ok", "09-10 18:10"],
  ["卢明", "lu.m", "RD-APP", "editor", "ok", "09-10 13:35"],
  ["章程", "zhang.c", "RD-APP", "editor", "ok", "09-10 10:50"],
  ["谢东", "xie.d", "RD-APP", "editor", "ok", "09-09 18:02"],
  ["段锐", "duan.r", "RD-APP", "editor", "ok", "09-09 16:15"],
  ["龙飞", "long.f", "RD-APP", "editor", "ok", "09-09 11:40"],
  ["阮玲", "ruan.l", "RD-APP", "editor", "ok", "09-08 17:20"],
  ["侯亮", "hou.l", "RD-APP", "editor", "ok", "09-08 09:55"],
  ["关越", "guan.y", "RD-APP", "editor", "ok", "09-05 14:30"],
  ["龚敏", "gong.m", "RD-APP", "viewer", "ok", "09-04 16:10"],
  ["邱阳", "qiu.y", "RD-APP", "viewer", "ok", "09-04 10:05"],
  /* 研发中心 · 质量保障组 9 */
  ["吴桐", "wu.t", "RD-QA", "approver", "ok", "09-11 12:30"],
  ["施雯", "shi.wen", "RD-QA", "approver", "ok", "09-10 17:05"],
  ["曹阳", "cao.y", "RD-QA", "editor", "ok", "09-11 09:35"],
  ["苗青", "miao.q", "RD-QA", "editor", "ok", "09-10 14:20"],
  ["樊星", "fan.xing", "RD-QA", "editor", "ok", "09-09 17:10"],
  ["温迪", "wen.d", "RD-QA", "editor", "ok", "09-09 13:25"],
  ["席扬", "xi.y", "RD-QA", "viewer", "lock", "09-08 11:15"],
  ["岳峰", "yue.f", "RD-QA", "viewer", "ok", "09-06 15:40"],
  ["车楠", "che.n", "RD-QA", "viewer", "off", "—"],
  /* 财务部 · 会计核算组 11 */
  ["王雅琪", "wang", "FIN-ACC", "admin", "ok", "09-11 14:02"],
  ["李承宇", "li", "FIN-ACC", "approver", "ok", "09-11 13:15"],
  ["祁阳", "qi.y", "FIN-ACC", "approver", "ok", "09-10 16:50"],
  ["陈浩", "chen", "FIN-ACC", "editor", "ok", "09-11 13:02"],
  ["童瑶", "tong.y", "FIN-ACC", "editor", "ok", "09-10 15:30"],
  ["康宁", "kang.n", "FIN-ACC", "editor", "ok", "09-10 12:10"],
  ["项楠", "xiang.n", "FIN-ACC", "editor", "ok", "09-09 16:45"],
  ["庞博", "pang.b", "FIN-ACC", "editor", "ok", "09-09 09:30"],
  ["童飞", "tong.f", "FIN-ACC", "editor", "ok", "09-08 15:20"],
  ["甘霖", "gan.l", "FIN-ACC", "viewer", "off", "—"],
  ["蒋雯", "jiang.wen", "FIN-ACC", "viewer", "ok", "09-05 10:40"],
  /* 财务部 · 资金结算组 7 */
  ["郑楠", "zheng.n", "FIN-TRE", "admin", "ok", "09-11 10:25"],
  ["于洋", "yu.y", "FIN-TRE", "approver", "ok", "09-10 14:05"],
  ["韦然", "wei.r", "FIN-TRE", "approver", "ok", "09-09 15:50"],
  ["卢佳", "lu.j", "FIN-TRE", "editor", "ok", "09-10 11:30"],
  ["谭雪", "tan.x", "FIN-TRE", "editor", "ok", "09-09 14:15"],
  ["邹凯", "zou.k", "FIN-TRE", "editor", "ok", "09-08 16:35"],
  ["章婧", "zhang.j", "FIN-TRE", "viewer", "ok", "09-04 11:20"],
  /* 市场部 · 品牌市场组 14 */
  ["何静", "he.j", "MKT-BRAND", "approver", "ok", "09-11 11:50"],
  ["刘思彤", "liu", "MKT-BRAND", "editor", "ok", "09-11 11:48"],
  ["柯敏", "ke.m", "MKT-BRAND", "editor", "ok", "09-11 10:15"],
  ["骆琦", "luo.q", "MKT-BRAND", "editor", "ok", "09-10 17:40"],
  ["宋佳", "song.j", "MKT-BRAND", "editor", "ok", "09-10 13:20"],
  ["钟原", "zhong.y", "MKT-BRAND", "editor", "ok", "09-10 09:45"],
  ["倪娜", "ni.n", "MKT-BRAND", "editor", "ok", "09-09 17:30"],
  ["尹航", "yin.h", "MKT-BRAND", "editor", "ok", "09-09 14:50"],
  ["尚清", "shang.q", "MKT-BRAND", "editor", "ok", "09-08 16:20"],
  ["季然", "ji.r", "MKT-BRAND", "editor", "ok", "09-08 11:05"],
  ["褚辉", "chu.h", "MKT-BRAND", "editor", "ok", "09-07 15:30"],
  ["路宁", "lu.n", "MKT-BRAND", "editor", "ok", "09-06 10:15"],
  ["武岳", "wu.y", "MKT-BRAND", "viewer", "ok", "09-05 16:25"],
  ["乔安", "qiao.a", "MKT-BRAND", "viewer", "ok", "09-04 13:50"],
  /* 市场部 · 渠道合作组 12 */
  ["孙博文", "sun.b", "MKT-CHN", "admin", "ok", "09-11 09:05"],
  ["马骁", "ma.x", "MKT-CHN", "approver", "ok", "09-10 18:20"],
  ["谭溪", "tan.xi", "MKT-CHN", "editor", "ok", "09-10 16:40"],
  ["方蕾", "fang.l", "MKT-CHN", "editor", "ok", "09-10 10:30"],
  ["翟明", "zhai.m", "MKT-CHN", "editor", "ok", "09-09 15:20"],
  ["安琪", "an.q", "MKT-CHN", "editor", "ok", "09-09 11:10"],
  ["于蕾", "yu.l", "MKT-CHN", "editor", "ok", "09-08 14:35"],
  ["闻博", "wen.b", "MKT-CHN", "editor", "ok", "09-07 16:50"],
  ["毕冉", "bi.r", "MKT-CHN", "editor", "ok", "09-06 11:25"],
  ["屠强", "tu.q", "MKT-CHN", "viewer", "off", "—"],
  ["尹超", "yin.c", "MKT-CHN", "viewer", "lock", "09-06 09:40"],
  ["盛楠", "sheng.n", "MKT-CHN", "viewer", "ok", "09-05 14:20"],
  /* 人力资源 · 招聘与配置组 7 */
  ["陈默", "chen.m", "HR-REC", "admin", "ok", "09-11 08:55"],
  ["徐蕾", "xu.l", "HR-REC", "approver", "ok", "09-10 15:10"],
  ["周颖", "zhou.y", "HR-REC", "editor", "ok", "09-10 10:20"],
  ["白靖", "bai.j", "HR-REC", "editor", "ok", "09-09 16:05"],
  ["郝明", "hao.m", "HR-REC", "editor", "ok", "09-08 13:40"],
  ["邹蕾", "zou.l", "HR-REC", "editor", "ok", "09-07 10:25"],
  ["尹涛", "yin.t", "HR-REC", "viewer", "ok", "09-06 15:15"],
  /* 人力资源 · 薪酬绩效组 5 */
  ["林涛", "lin.t", "HR-PERF", "approver", "ok", "09-10 17:15"],
  ["崔静", "cui.j", "HR-PERF", "editor", "ok", "09-10 09:35"],
  ["贺敏", "he.m", "HR-PERF", "editor", "ok", "09-09 13:05"],
  ["鄢然", "yan.r", "HR-PERF", "editor", "ok", "09-08 10:50"],
  ["涂远", "tu.y", "HR-PERF", "viewer", "off", "—"]
];

var MENUS = [
  { code: "workbench", name: "工作台",       type: "目录", parent: "",          perm: "",                 order: 1, on: true },
  { code: "dashboard", name: "数据概览",     type: "菜单", parent: "workbench", perm: "dashboard:view",   order: 1, on: true },
  { code: "analytics", name: "数据分析",     type: "目录", parent: "workbench", perm: "",                 order: 2, on: true },
  { code: "chart",     name: "图表分析",     type: "菜单", parent: "analytics", perm: "chart:view",       order: 1, on: true },
  { code: "doc",       name: "数据表格",     type: "菜单", parent: "analytics", perm: "doc:list",         order: 2, on: true },
  { code: "notice",    name: "动态通知",     type: "菜单", parent: "workbench", perm: "notice:list",      order: 3, on: true },
  { code: "manage",    name: "管理",         type: "目录", parent: "",          perm: "",                 order: 2, on: true },
  { code: "business",  name: "业务管理",     type: "目录", parent: "manage",    perm: "",                 order: 1, on: true },
  { code: "member",    name: "成员管理",     type: "菜单", parent: "business",  perm: "member:list",      order: 1, on: true },
  { code: "docConfig", name: "单据配置",     type: "菜单", parent: "business",  perm: "doc:config",       order: 2, on: true },
  { code: "setting",   name: "系统设置",     type: "菜单", parent: "manage",    perm: "setting:edit",     order: 2, on: true },
  { code: "sysdata",   name: "系统数据管理", type: "目录", parent: "manage",    perm: "",                 order: 3, on: true },
  { code: "dept",      name: "组织部门管理", type: "菜单", parent: "sysdata",   perm: "system:dept:list", order: 1, on: true },
  { code: "sysuser",   name: "用户管理",     type: "菜单", parent: "sysdata",   perm: "system:user:list", order: 2, on: true },
  { code: "role",      name: "角色管理",     type: "菜单", parent: "sysdata",   perm: "system:role:list", order: 3, on: true },
  { code: "menu",      name: "菜单管理",     type: "菜单", parent: "sysdata",   perm: "system:menu:list", order: 4, on: true },
  { code: "b-dash-export",  name: "导出报表",   type: "按钮", parent: "dashboard", perm: "dashboard:export",       order: 1, on: true },
  { code: "b-doc-add",      name: "新建单据",   type: "按钮", parent: "doc",       perm: "doc:add",                order: 1, on: true },
  { code: "b-doc-export",   name: "导出数据",   type: "按钮", parent: "doc",       perm: "doc:export",             order: 2, on: true },
  { code: "b-member-invite", name: "邀请成员",  type: "按钮", parent: "member",    perm: "member:invite",          order: 1, on: true },
  { code: "b-member-disable", name: "停用成员", type: "按钮", parent: "member",    perm: "member:disable",         order: 2, on: true },
  { code: "b-docconf-add",  name: "新建模板",   type: "按钮", parent: "docConfig", perm: "doc:config:add",         order: 1, on: true },
  { code: "b-docconf-pub",  name: "发布模板",   type: "按钮", parent: "docConfig", perm: "doc:config:publish",     order: 2, on: true },
  { code: "b-dept-add",     name: "新增部门",   type: "按钮", parent: "dept",      perm: "system:dept:add",        order: 1, on: true },
  { code: "b-dept-edit",    name: "编辑部门",   type: "按钮", parent: "dept",      perm: "system:dept:edit",       order: 2, on: true },
  { code: "b-dept-remove",  name: "删除部门",   type: "按钮", parent: "dept",      perm: "system:dept:remove",     order: 3, on: true },
  { code: "b-user-add",     name: "新增用户",   type: "按钮", parent: "sysuser",   perm: "system:user:add",        order: 1, on: true },
  { code: "b-user-pwd",     name: "重置密码",   type: "按钮", parent: "sysuser",   perm: "system:user:resetPwd",   order: 2, on: true },
  { code: "b-user-disable", name: "停用用户",   type: "按钮", parent: "sysuser",   perm: "system:user:disable",    order: 3, on: true },
  { code: "b-role-add",     name: "新增角色",   type: "按钮", parent: "role",      perm: "system:role:add",        order: 1, on: true },
  { code: "b-role-auth",    name: "分配权限",   type: "按钮", parent: "role",      perm: "system:role:auth",       order: 2, on: true },
  { code: "b-menu-add",     name: "新增菜单",   type: "按钮", parent: "menu",      perm: "system:menu:add",        order: 1, on: true },
  { code: "b-menu-edit",    name: "编辑菜单",   type: "按钮", parent: "menu",      perm: "system:menu:edit",       order: 2, on: true },
  { code: "b-menu-remove",  name: "删除菜单",   type: "按钮", parent: "menu",      perm: "system:menu:remove",     order: 3, on: true }
];

var DEPT_BY_CODE = {};
var ROLE_BY_CODE = {};
var USER_BY_LOGIN = {};
DEPTS.forEach(function (d) { DEPT_BY_CODE[d.code] = d; });
USERS.forEach(function (u) { USER_BY_LOGIN[u[1]] = u; });
ROLES.forEach(function (r) { ROLE_BY_CODE[r.code] = r; r.granted = r.menus.slice(); });

var MENU_BY_CODE = {};
MENUS.forEach(function (m) { MENU_BY_CODE[m.code] = m; });
/* 角色页只授予「菜单」级权限：目录是容器，按钮由菜单自身携带。 */
var MENU_TYPE_COUNT = MENUS.filter(function (m) { return m.type === "菜单"; }).length;

var USER_STATUS = {
  ok:   { label: "正常",   cls: "ok" },
  off:  { label: "已停用", cls: "idle" },
  lock: { label: "已锁定", cls: "warn" }
};

/* 有下级才渲染成按钮；没有下级的渲染成纯占位——否则会留下一个看不见
   却能被 Tab 聚焦的控件。 */
var CARET_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>';

function caretHTML(code, name, open, attr, hasKids) {
  if (!hasKids) return '<span class="m-caret is-leaf" aria-hidden="true">' + CARET_SVG + "</span>";
  return '<button class="m-caret" type="button" ' + attr + '="' + code +
    '" aria-expanded="' + (open ? "true" : "false") + '" aria-label="展开或收起 ' + name + ' 的下级">' +
    CARET_SVG + "</button>";
}

function fmt(n) {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/* ---------- 部门树的读数 ----------
   人数一律从 USERS 现算，不缓存汇总值。 */
function deptChildren(code) {
  return DEPTS.filter(function (d) { return d.parent === code; });
}

function deptDescendants(code) {
  var out = [code], grew = true;
  while (grew) {
    grew = false;
    DEPTS.forEach(function (d) {
      if (d.parent && out.indexOf(d.parent) !== -1 && out.indexOf(d.code) === -1) {
        out.push(d.code);
        grew = true;
      }
    });
  }
  return out;
}

function deptCount(code) {
  var codes = deptDescendants(code);
  return USERS.filter(function (u) { return codes.indexOf(u[2]) !== -1; }).length;
}

function deptDirect(code) {
  return USERS.filter(function (u) { return u[2] === code; }).length;
}

function deptPath(code) {
  var parts = [], d = DEPT_BY_CODE[code];
  while (d) {
    parts.unshift(d.name);
    d = d.parent ? DEPT_BY_CODE[d.parent] : null;
  }
  return parts.join(" / ");
}

function roleMembers(code) {
  return USERS.filter(function (u) { return u[3] === code; }).length;
}

function statRow(label, value) {
  return '<div class="row between"><span class="meta">' + label + '</span><span class="num">' + value + "</span></div>";
}

function menuEnabled(code) {
  var m = MENU_BY_CODE[code];
  while (m) {
    if (!m.on) return false;
    m = m.parent ? MENU_BY_CODE[m.parent] : null;
  }
  return true;
}

function menuHasChildren(code) {
  return MENUS.some(function (x) { return x.parent === code; });
}

/* ---------- 跨文档状态的读写 ----------
     每个文档各有一份数据副本，所以真正的风险是"入口改了、某个视图还
     不知道"。做法是：入口持有权威副本，任何视图改动都先发给入口，由
     入口落定后再广播；视图就绪时入口把整份状态推过去对齐。

     accountStateMap / menuStateMap 返回全量而非增量——视图拿它无条件
     覆盖自己的副本，重复投递也是幂等的。 */

  function setAccountStatus(login, status) {
    var u = USER_BY_LOGIN[login];
    if (u) u[4] = status;
  }

  function accountStateMap() {
    var map = {};
    USERS.forEach(function (u) { map[u[1]] = u[4]; });
    return map;
  }

  function applyAccountState(map) {
    if (!map) return;
    Object.keys(map).forEach(function (login) {
      var u = USER_BY_LOGIN[login];
      if (u) u[4] = map[login];
    });
  }

  function setMenuOn(code, on) {
    var m = MENU_BY_CODE[code];
    if (m) m.on = !!on;
  }

  function menuStateMap() {
    var map = {};
    MENUS.forEach(function (m) { map[m.code] = m.on; });
    return map;
  }

  function applyMenuState(map) {
    if (!map) return;
    Object.keys(map).forEach(function (code) {
      var m = MENU_BY_CODE[code];
      if (m) m.on = !!map[code];
    });
  }

  window.OrbitData = {
    DEPTS: DEPTS,
    ROLES: ROLES,
    USERS: USERS,
    MENUS: MENUS,
    DEPT_BY_CODE: DEPT_BY_CODE,
    ROLE_BY_CODE: ROLE_BY_CODE,
    USER_BY_LOGIN: USER_BY_LOGIN,
    MENU_BY_CODE: MENU_BY_CODE,
    MENU_TYPE_COUNT: MENU_TYPE_COUNT,
    USER_STATUS: USER_STATUS,

    caretHTML: caretHTML,
    fmt: fmt,
    statRow: statRow,

    deptChildren: deptChildren,
    deptDescendants: deptDescendants,
    deptCount: deptCount,
    deptDirect: deptDirect,
    deptPath: deptPath,
    roleMembers: roleMembers,

    menuEnabled: menuEnabled,
    menuHasChildren: menuHasChildren,
    setMenuOn: setMenuOn,
    menuStateMap: menuStateMap,
    applyMenuState: applyMenuState,

    setAccountStatus: setAccountStatus,
    accountStateMap: accountStateMap,
    applyAccountState: applyAccountState
  };
})();
