/**
 * 站点配置与公开接口封装
 * - 后端运行于 Spring Boot，上下文路径为 /api，静态页面由后端直接托管
 * - 页面 URL 带 ?demo=1 时启用内置演示数据（见 mock-data.js），无需后端即可预览
 */
const SITE_CONFIG = {
  orgName: "中国石油大学（北京）克拉玛依校区",
  siteName: "大学生社会实践宣传平台",
  apiBase: "/api",
  demo: new URLSearchParams(location.search).has("demo"),
  pageSize: 8
};

const DEMO_PARAM = SITE_CONFIG.demo ? "demo=1&" : "";

async function apiGet(path) {
  if (SITE_CONFIG.demo) {
    const data = await mockGet(path);
    if (data === null) throw new Error("未找到相关数据");
    return data;
  }

  const resp = await fetch(SITE_CONFIG.apiBase + path, {
    headers: { Accept: "application/json" }
  });
  if (!resp.ok) {
    throw new Error("请求失败（HTTP " + resp.status + "）");
  }
  const body = await resp.json();
  if (body.code !== 200) {
    throw new Error(body.message || "服务暂不可用");
  }
  return body.data;
}

/* ---------- 公开接口 ---------- */
function fetchCategories() {
  return apiGet("/categories");
}

function fetchCategoryTree() {
  return apiGet("/categories/tree");
}

function fetchCategory(id) {
  return apiGet("/categories/" + id);
}

function fetchHotPosts(categoryId) {
  const q = categoryId ? "categoryId=" + categoryId : "";
  return apiGet("/posts/hot?size=10" + (q ? "&" + q : ""));
}

function fetchCategoryPosts(categoryId, page, size, sort) {
  const params = new URLSearchParams({ page, size, sort });
  return apiGet("/categories/" + categoryId + "/posts?" + params.toString());
}

function fetchAllPosts(page, size) {
  const params = new URLSearchParams({ page, size });
  return apiGet("/posts?" + params.toString());
}

function fetchPost(id) {
  return apiGet("/posts/" + id);
}

/* ---------- 通用工具 ---------- */
function escapeHtml(text) {
  if (text == null) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDate(value, withTime) {
  if (!value) return "";
  const str = String(value);
  if (withTime) return str.slice(0, 16);
  return str.slice(0, 10);
}

function categoryUrl(id) {
  return "category.html?" + DEMO_PARAM + "id=" + id;
}

function postUrl(id) {
  return "post.html?" + DEMO_PARAM + "id=" + id;
}

function coverUrl(post) {
  if (post && post.coverImage) {
    if (/^(https?:)?\/\//.test(post.coverImage)) return post.coverImage;
    return post.coverImage;
  }
  return "img/default-cover.svg";
}

function setTitle(suffix) {
  document.title = suffix
    ? suffix + " - " + SITE_CONFIG.orgName + SITE_CONFIG.siteName
    : SITE_CONFIG.orgName + "·" + SITE_CONFIG.siteName;
}

function initTopbarDate() {
  const el = document.getElementById("topbar-date");
  if (!el) return;
  const now = new Date();
  const weeks = ["日", "一", "二", "三", "四", "五", "六"];
  const pad = n => String(n).padStart(2, "0");
  el.textContent =
    now.getFullYear() + "年" + (now.getMonth() + 1) + "月" + now.getDate() + "日" +
    " 星期" + weeks[now.getDay()];
}

/** 渲染主导航（首页 + 栏目），activeId 用于高亮当前栏目 */
async function renderNav(activeId) {
  const nav = document.getElementById("main-nav");
  if (!nav) return;
  const ul = nav.querySelector("ul");
  ul.innerHTML = "";

  const homeLi = document.createElement("li");
  const homeA = document.createElement("a");
  homeA.href = "index.html" + (SITE_CONFIG.demo ? "?demo=1" : "");
  homeA.textContent = "首页";
  if (activeId == null) homeA.classList.add("active");
  homeLi.appendChild(homeA);
  ul.appendChild(homeLi);

  try {
    const tree = await fetchCategoryTree();
    tree.forEach(cat => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = categoryUrl(cat.id);
      a.textContent = cat.name;
      a.dataset.catId = cat.id;
      if (String(activeId) === String(cat.id)) a.classList.add("active");
      li.appendChild(a);
      ul.appendChild(li);
    });
  } catch (e) {
    // 接口不可用时仅保留首页，不阻塞页面渲染
    console.warn("栏目加载失败:", e);
  }
}

/** 渲染通用空状态 / 错误状态 */
function showState(container, message, isError) {
  if (!container) return;
  container.innerHTML =
    '<div class="state">' +
    '<div class="state-icon">' + (isError ? "⚠️" : "📄") + "</div>" +
    "<div" + (isError ? ' class="error-msg"' : "") + ">" + escapeHtml(message) + "</div>" +
    "</div>";
}

/** 渲染分页条 */
function renderPager(container, pageResult, onPage) {
  if (!container) return;
  const page = pageResult.pageNum || pageResult.current || 1;
  const pages = pageResult.totalPages || pageResult.pages || 1;
  if (pages <= 1 && !pageResult.total) {
    container.innerHTML = "";
    return;
  }

  const html = [];
  html.push('<button data-p="' + (page - 1) + '" ' + (page <= 1 ? "disabled" : "") + '>上一页</button>');

  let start = Math.max(1, page - 2);
  let end = Math.min(pages, start + 4);
  start = Math.max(1, end - 4);
  if (start > 1) {
    html.push('<span class="page-num" data-p="1">1</span>');
    if (start > 2) html.push('<span class="ellipsis">…</span>');
  }
  for (let i = start; i <= end; i++) {
    html.push('<span class="page-num' + (i === page ? " active" : "") + '" data-p="' + i + '">' + i + "</span>");
  }
  if (end < pages) {
    if (end < pages - 1) html.push('<span class="ellipsis">…</span>');
    html.push('<span class="page-num" data-p="' + pages + '">' + pages + "</span>");
  }
  html.push('<button data-p="' + (page + 1) + '" ' + (page >= pages ? "disabled" : "") + '>下一页</button>');
  html.push('<span class="total-info">共 ' + (pageResult.total || 0) + " 条</span>");

  container.innerHTML = html.join("");
  container.querySelectorAll("[data-p]").forEach(el => {
    el.addEventListener("click", () => {
      const p = Number(el.dataset.p);
      if (p >= 1 && p <= pages && p !== page) onPage(p);
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initTopbarDate();
});
