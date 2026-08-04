/* ============ 后台管理（登录 / 文章发布 / 栏目管理） ============ */

const ADMIN_API = "/api";
const TOKEN_KEY = "blog_admin_token";
const USER_KEY = "blog_admin_user";

const state = {
  token: localStorage.getItem(TOKEN_KEY) || "",
  user: JSON.parse(localStorage.getItem(USER_KEY) || "null"),
  postStatus: "",
  postPage: 1,
  pageSize: 10,
  editorId: null,
  categories: [],
  categoriesLoaded: false
};

function hasRole(role) {
  return !!(state.user && state.user.roles && state.user.roles.includes(role));
}

function hasPerm(code) {
  return !!(state.user && state.user.permissions && state.user.permissions.includes(code));
}

/* ---------- API 封装 ---------- */
async function adminFetch(path, options = {}) {
  const headers = Object.assign({}, options.headers || {});
  if (state.token) headers["Authorization"] = "Bearer " + state.token;
  const resp = await fetch(ADMIN_API + path, Object.assign({}, options, { headers }));
  if (resp.status === 401) {
    doLogout();
    throw new Error("登录已过期，请重新登录");
  }
  const body = await resp.json().catch(() => null);
  if (!body || body.code !== 200) {
    throw new Error((body && body.message) || "请求失败（HTTP " + resp.status + "）");
  }
  return body.data;
}

function escapeHtml(text) {
  if (text == null) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function fmtDate(value) {
  return value ? String(value).slice(0, 16) : "-";
}

function showMsg(elId, text, ok) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.textContent = text || "";
  el.className = "form-msg" + (ok ? " ok" : text ? " error" : "");
}

/* ---------- 视图切换 ---------- */
function showView(name) {
  ["login", "dashboard", "editor"].forEach(v => {
    document.getElementById("view-" + v).classList.toggle("hidden", v !== name);
  });
}

function renderHeader() {
  const name = state.user ? (state.user.nickname || state.user.username) : "";
  document.getElementById("user-name").textContent = "欢迎，" + name;
  document.getElementById("user-name").classList.remove("hidden");
  document.getElementById("logout-btn").classList.remove("hidden");
}

function doLogout() {
  const token = state.token;
  state.token = "";
  state.user = null;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  if (token) {
    fetch(ADMIN_API + "/auth/logout", {
      method: "POST",
      headers: { Authorization: "Bearer " + token }
    }).catch(() => {});
  }
  showView("login");
}

/* ---------- 登录 ---------- */
async function doLogin() {
  const username = document.getElementById("login-username").value.trim();
  const password = document.getElementById("login-password").value;
  showMsg("login-msg", "");
  if (!username || !password) {
    showMsg("login-msg", "请输入用户名和密码");
    return;
  }
  try {
    const data = await adminFetch("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    state.token = data.token;
    state.user = data.userInfo || null;
    localStorage.setItem(TOKEN_KEY, state.token);
    localStorage.setItem(USER_KEY, JSON.stringify(state.user || {}));
    renderHeader();
    showView("dashboard");
    switchTab("posts");
  } catch (e) {
    showMsg("login-msg", "登录失败：" + e.message);
  }
}

/* ---------- Tab ---------- */
function switchTab(panel) {
  document.querySelectorAll(".admin-tabs .tab").forEach(t => {
    t.classList.toggle("active", t.dataset.panel === panel);
  });
  document.getElementById("panel-posts").classList.toggle("hidden", panel !== "posts");
  document.getElementById("panel-categories").classList.toggle("hidden", panel !== "categories");
  if (panel === "posts") {
    loadPosts();
  } else {
    loadCategories();
  }
}

/* ============ 文章管理 ============ */
function statusBadge(status) {
  if (status === 1) return '<span class="badge badge-published">已发布</span>';
  if (status === 0) return '<span class="badge badge-draft">草稿</span>';
  if (status === 2) return '<span class="badge badge-review">审核中</span>';
  return '<span class="badge badge-deleted">已删除</span>';
}

async function loadPosts() {
  const tbody = document.getElementById("post-tbody");
  tbody.innerHTML = '<tr><td colspan="9" class="empty-tip">加载中…</td></tr>';

  try {
    const params = new URLSearchParams({ page: state.postPage, size: state.pageSize });
    if (state.postStatus !== "") params.set("status", state.postStatus);
    const page = await adminFetch("/posts?" + params.toString());
    let records = page.records || [];
    if (state.postStatus === "") records = records.filter(p => p.status !== -1);

    if (!records.length) {
      tbody.innerHTML = '<tr><td colspan="9" class="empty-tip">暂无文章</td></tr>';
    } else {
      tbody.innerHTML = "";
      records.forEach(p => {
        const tr = document.createElement("tr");
        tr.innerHTML =
          "<td>" + p.id + "</td>" +
          '<td class="title-cell"><a href="post.html?id=' + p.id + '" target="_blank" title="' + escapeHtml(p.title) + '">' + escapeHtml(p.title) + "</a></td>" +
          "<td>" + escapeHtml(p.authorName || "-") + "</td>" +
          "<td>" + statusBadge(p.status) + "</td>" +
          "<td>" + (p.isTop === 1 ? '<span class="badge badge-top">置顶</span>' : "-") + "</td>" +
          '<td class="op-group">' +
          '<input class="sort-input" type="number" min="0" value="' + (p.sortOrder || 0) + '" data-sort-field="sortOrder" data-id="' + p.id + '">' +
          '<input class="sort-input" type="number" min="0" value="' + (p.manualWeight || 0) + '" data-sort-field="manualWeight" data-id="' + p.id + '">' +
          '<button class="btn btn-sm btn-secondary" data-save-sort="' + p.id + '">存</button>' +
          "</td>" +
          "<td>" + (p.viewCount || 0) + "</td>" +
          "<td>" + fmtDate(p.publishedAt) + "</td>" +
          '<td class="op-group">' +
          '<button class="btn btn-sm btn-secondary" data-edit="' + p.id + '">编辑</button>' +
          (p.status !== 1 ? '<button class="btn btn-sm btn-success" data-publish="' + p.id + '">发布</button>' : "") +
          '<button class="btn btn-sm btn-secondary" data-top="' + p.id + '">' + (p.isTop === 1 ? "取消置顶" : "置顶") + "</button>" +
          '<button class="btn btn-sm btn-danger" data-delete="' + p.id + '">删除</button>' +
          "</td>";
        tbody.appendChild(tr);
      });
    }
    renderPostPager(page);
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="9" class="empty-tip error-msg">加载失败：' + escapeHtml(e.message) + "</td></tr>";
  }
}

function renderPostPager(page) {
  const box = document.getElementById("post-pager");
  const current = page.pageNum || 1;
  const pages = page.totalPages || 1;
  box.innerHTML =
    '<button class="btn btn-sm btn-secondary" data-pg="' + (current - 1) + '" ' + (current <= 1 ? "disabled" : "") + '>上一页</button>' +
    '<span>第 ' + current + ' / ' + pages + ' 页，共 ' + (page.total || 0) + ' 条</span>' +
    '<button class="btn btn-sm btn-secondary" data-pg="' + (current + 1) + '" ' + (current >= pages ? "disabled" : "") + '>下一页</button>';
  box.querySelectorAll("[data-pg]").forEach(btn => {
    btn.addEventListener("click", () => {
      const p = Number(btn.dataset.pg);
      if (p >= 1 && p <= pages) {
        state.postPage = p;
        loadPosts();
      }
    });
  });
}

async function publishPost(id) {
  try {
    await adminFetch("/posts/" + id + "/publish", { method: "PUT" });
    alert("文章已发布，前台栏目页与轮播将展示该文章");
    loadPosts();
  } catch (e) {
    alert("发布失败：" + e.message);
  }
}

async function toggleTop(id, current) {
  try {
    await adminFetch("/admin/posts/" + id + "/top", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isTop: current ? 0 : 1 })
    });
    loadPosts();
  } catch (e) {
    alert("操作失败：" + e.message);
  }
}

async function savePostSort(id, sortOrder, manualWeight) {
  try {
    await adminFetch("/admin/posts/" + id + "/sort", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sortOrder: Number(sortOrder) || 0, manualWeight: Number(manualWeight) || 0 })
    });
    loadPosts();
  } catch (e) {
    alert("保存排序失败：" + e.message);
  }
}

async function deletePost(id, title) {
  if (!confirm("确定删除文章《" + title + "》吗？删除后前台将不再展示。")) return;
  try {
    await adminFetch("/posts/" + id, { method: "DELETE" });
    loadPosts();
  } catch (e) {
    alert("删除失败：" + e.message);
  }
}

/* ============ 文章编辑器 ============ */
function flattenTree(nodes, depth, out) {
  (nodes || []).forEach(n => {
    out.push(Object.assign({}, n, { depth: depth || 0 }));
    flattenTree(n.children, (depth || 0) + 1, out);
  });
  return out;
}

async function ensureCategories() {
  if (!state.categories.length) {
    state.categories = await adminFetch("/categories/tree");
  }
  return state.categories;
}

async function renderCategoryCheckboxes(selectedIds) {
  const tree = await ensureCategories();
  const flat = flattenTree(tree, 0, []);
  const box = document.getElementById("cat-checkboxes");
  box.innerHTML = "";
  if (!flat.length) {
    box.innerHTML = '<span class="hint">暂无栏目，请先在「栏目管理」中创建</span>';
    return;
  }
  flat.forEach(c => {
    const label = document.createElement("label");
    if (c.depth > 0) label.classList.add("child-cat");
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.value = c.id;
    cb.checked = !!(selectedIds && selectedIds.includes(c.id));
    label.appendChild(cb);
    label.appendChild(document.createTextNode(c.name + (c.status === 1 ? "" : "（已禁用）")));
    box.appendChild(label);
  });
}

async function openEditor(id) {
  state.editorId = id || null;
  showMsg("editor-msg", "");
  document.getElementById("editor-title").textContent = id ? "编辑文章" : "新建文章";
  document.getElementById("post-title").value = "";
  document.getElementById("post-summary").value = "";
  document.getElementById("post-cover").value = "";
  document.getElementById("cover-preview").src = "img/default-cover.svg";
  document.getElementById("post-content").value = "";
  document.querySelector('input[name="post-status"][value="0"]').checked = true;
  document.getElementById("content-preview").classList.add("hidden");
  document.getElementById("content-preview").innerHTML = "";
  document.getElementById("preview-toggle-btn").textContent = "预览正文";

  try {
    if (id) {
      const d = await adminFetch("/posts/" + id);
      document.getElementById("post-title").value = d.title || "";
      document.getElementById("post-summary").value = d.summary || "";
      document.getElementById("post-cover").value = d.coverImage || "";
      if (d.coverImage) document.getElementById("cover-preview").src = d.coverImage;
      document.getElementById("post-content").value = d.content || "";
      const statusRadio = document.querySelector('input[name="post-status"][value="' + (d.status === 1 ? "1" : "0") + '"]');
      if (statusRadio) statusRadio.checked = true;
      await renderCategoryCheckboxes((d.categories || []).map(c => c.id));
    } else {
      await renderCategoryCheckboxes([]);
    }
    showView("editor");
  } catch (e) {
    alert("加载文章失败：" + e.message);
  }
}

function collectPostForm() {
  const title = document.getElementById("post-title").value.trim();
  const content = document.getElementById("post-content").value;
  if (!title) throw new Error("标题不能为空");
  if (!content.trim()) throw new Error("正文内容不能为空");
  return {
    title,
    summary: document.getElementById("post-summary").value.trim(),
    coverImage: document.getElementById("post-cover").value.trim(),
    content,
    categoryIds: Array.from(document.querySelectorAll("#cat-checkboxes input:checked")).map(el => Number(el.value))
  };
}

async function savePost(publish) {
  showMsg("editor-msg", "");
  let payload;
  try {
    payload = collectPostForm();
  } catch (e) {
    showMsg("editor-msg", e.message);
    return;
  }
  payload.status = publish ? 1 : 0;
  try {
    if (state.editorId) {
      payload.id = state.editorId;
      await adminFetch("/posts/" + state.editorId, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } else {
      await adminFetch("/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    }
    showMsg("editor-msg", publish ? "已保存并发布，可在前台查看" : "已保存为草稿", true);
    setTimeout(() => {
      state.editorId = null;
      showView("dashboard");
      switchTab("posts");
    }, 800);
  } catch (e) {
    showMsg("editor-msg", "保存失败：" + e.message);
  }
}

async function uploadFile(file) {
  if (!file) return;
  const fd = new FormData();
  fd.append("file", file);
  const data = await adminFetch("/files/upload", { method: "POST", body: fd });
  return data;
}

async function uploadImage(file) {
  if (!file) return;
  if (!/^image\//.test(file.type)) {
    throw new Error("只能上传图片文件");
  }
  const fd = new FormData();
  fd.append("file", file);
  const data = await adminFetch("/files/upload/image", { method: "POST", body: fd });
  return data.fileUrl || "";
}

async function uploadCover(file) {
  try {
    const url = await uploadImage(file);
    if (!url) throw new Error("上传结果缺少图片地址");
    document.getElementById("post-cover").value = url;
    document.getElementById("cover-preview").src = url;
    alert("封面上传成功");
  } catch (e) {
    alert("上传失败：" + e.message);
  }
}

/** 正文中插入图片/附件：上传后按类型把 Markdown 或 HTML 填入光标处 */
async function insertContentFile(file) {
  if (!file) return;
  const btn = document.getElementById("content-file-btn");
  const textarea = document.getElementById("post-content");
  btn.disabled = true;
  btn.textContent = "上传中…";
  try {
    const data = await uploadFile(file);
    const url = data.fileUrl || "";
    if (!url) throw new Error("上传结果缺少文件地址");
    const mime = data.mimeType || file.type || "";
    const name = data.originalName || file.name || "附件";
    const alt = name.replace(/\.[^.]+$/, "");
    const ext = (name.split(".").pop() || "").toLowerCase();
    const playableVideo = ["flv","mp4", "webm", "ogg", "m4v"].includes(ext);
    const playableAudio = ["mp3", "wav", "aac", "ogg", "m4a", "flac"].includes(ext) || mime.indexOf("audio/") === 0;
    const unplayableVideo = mime.indexOf("video/") === 0 || [ "mov", "avi", "mkv", "wmv", "rmvb"].includes(ext);
    let markdown;
    if (mime.indexOf("image/") === 0) {
      markdown = "![图片：" + alt + "](" + url + ")\n";
    } else if (playableVideo) {
      markdown = "<video src=\"" + url + "\" controls></video>\n";
    } else if (playableAudio) {
      markdown = "<audio src=\"" + url + "\" controls></audio>\n";
    } else if (unplayableVideo) {
      markdown = "[📎 " + name + "（附件下载，该格式浏览器不支持在线播放）](" + url + ")\n";
    } else {
      markdown = "[📎 " + name + "（附件下载）](" + url + ")\n";
    }
    const start = textarea.selectionStart == null ? textarea.value.length : textarea.selectionStart;
    const end = textarea.selectionEnd == null ? textarea.value.length : textarea.selectionEnd;
    textarea.value = textarea.value.slice(0, start) + markdown + textarea.value.slice(end);
    const pos = start + markdown.length;
    textarea.setSelectionRange(pos, pos);
    textarea.focus();
  } catch (e) {
    alert("上传失败：" + e.message);
  } finally {
    btn.disabled = false;
    btn.textContent = "上传图片/附件";
  }
}

function togglePreview() {
  const textarea = document.getElementById("post-content");
  const preview = document.getElementById("content-preview");
  const btn = document.getElementById("preview-toggle-btn");
  if (preview.classList.contains("hidden")) {
    preview.innerHTML = marked.parse(textarea.value || "*（暂无内容）*");
    preview.classList.remove("hidden");
    textarea.classList.add("hidden");
    btn.textContent = "返回编辑";
  } else {
    preview.classList.add("hidden");
    textarea.classList.remove("hidden");
    btn.textContent = "预览正文";
  }
}

/* ============ 栏目管理 ============ */
async function loadCategories() {
  const tbody = document.getElementById("cat-tbody");
  tbody.innerHTML = '<tr><td colspan="7" class="empty-tip">加载中…</td></tr>';
  try {
    const tree = await adminFetch("/admin/categories");
    const flat = flattenTree(tree, 0, []);
    if (!flat.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="empty-tip">暂无栏目</td></tr>';
      return;
    }
    tbody.innerHTML = "";
    flat.forEach(c => {
      const tr = document.createElement("tr");
      tr.innerHTML =
        '<td style="padding-left:' + (16 + c.depth * 22) + 'px">' +
        (c.depth > 0 ? "└ " : "") + escapeHtml(c.name) + "</td>" +
        "<td>" + escapeHtml(c.slug) + "</td>" +
        "<td>" + escapeHtml(c.description || "-") + "</td>" +
        "<td>" + (c.postCount || 0) + "</td>" +
        '<td><input class="sort-input" type="number" min="0" value="' + (c.sortOrder || 0) + '" data-cat-sort="' + c.id + '"></td>' +
        "<td>" + (c.status === 1 ? '<span class="badge badge-published">启用</span>' : '<span class="badge badge-disabled">禁用</span>') + "</td>" +
        '<td class="op-group">' +
        '<button class="btn btn-sm btn-secondary" data-cat-edit="' + c.id + '">编辑</button>' +
        '<button class="btn btn-sm ' + (c.status === 1 ? "btn-danger" : "btn-success") + '" data-cat-toggle="' + c.id + '">' + (c.status === 1 ? "禁用" : "启用") + "</button>" +
        "</td>";
      tbody.appendChild(tr);
    });
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-tip error-msg">加载失败：' + escapeHtml(e.message) + "</td></tr>";
  }
}

function openCatForm(id) {
  document.getElementById("cat-form").classList.add("open");
  showMsg("cat-msg", "");
  const flat = flattenTree(state.categories, 0, []);
  const cat = id ? flat.find(c => c.id === id) : null;
  document.getElementById("cat-name").value = cat ? cat.name : "";
  document.getElementById("cat-slug").value = cat ? cat.slug : "";
  document.getElementById("cat-desc").value = cat ? (cat.description || "") : "";
  document.getElementById("cat-icon").value = cat ? (cat.icon || "") : "";
  document.getElementById("cat-sort").value = cat ? (cat.sortOrder || 0) : 10;
  document.getElementById("cat-status").value = cat ? String(cat.status) : "1";
  document.getElementById("cat-save-btn").dataset.id = id || "";
  document.getElementById("cat-save-btn").textContent = id ? "保存修改" : "保存栏目";

  const select = document.getElementById("cat-parent");
  select.innerHTML = '<option value="">（无，一级栏目）</option>';
  flat.forEach(c => {
    if (c.id === id) return;
    const opt = document.createElement("option");
    opt.value = c.id;
    opt.textContent = (c.depth > 0 ? "　".repeat(c.depth) + "└ " : "") + c.name;
    if (cat && cat.parentId === c.id) opt.selected = true;
    select.appendChild(opt);
  });
}

async function saveCategory() {
  const id = document.getElementById("cat-save-btn").dataset.id || null;
  const name = document.getElementById("cat-name").value.trim();
  const slug = document.getElementById("cat-slug").value.trim();
  if (!name || !slug) {
    showMsg("cat-msg", "栏目名称和标识不能为空");
    return;
  }
  const payload = {
    name,
    slug,
    description: document.getElementById("cat-desc").value.trim(),
    icon: document.getElementById("cat-icon").value.trim(),
    parentId: document.getElementById("cat-parent").value ? Number(document.getElementById("cat-parent").value) : null,
    sortOrder: Number(document.getElementById("cat-sort").value) || 0,
    status: Number(document.getElementById("cat-status").value)
  };
  try {
    if (id) {
      await adminFetch("/admin/categories/" + id, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } else {
      await adminFetch("/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    }
    showMsg("cat-msg", "保存成功", true);
    document.getElementById("cat-form").classList.remove("open");
    state.categories = [];
    loadCategories();
  } catch (e) {
    showMsg("cat-msg", "保存失败：" + e.message);
  }
}

async function toggleCategory(id, currentStatus) {
  try {
    await adminFetch("/admin/categories/" + id, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: currentStatus === 1 ? 0 : 1 })
    });
    state.categories = [];
    loadCategories();
  } catch (e) {
    alert("操作失败：" + e.message);
  }
}

async function saveCategorySort() {
  const items = Array.from(document.querySelectorAll("[data-cat-sort]")).map(input => ({
    id: Number(input.dataset.catSort),
    sortOrder: Number(input.value) || 0
  }));
  try {
    await adminFetch("/admin/categories/sort", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categories: items })
    });
    alert("栏目排序已保存");
    loadCategories();
  } catch (e) {
    alert("保存排序失败：" + e.message);
  }
}

/* ---------- 事件绑定 ---------- */
function bindEvents() {
  document.getElementById("login-btn").addEventListener("click", doLogin);
  document.getElementById("login-password").addEventListener("keydown", e => {
    if (e.key === "Enter") doLogin();
  });
  document.getElementById("logout-btn").addEventListener("click", doLogout);

  document.querySelectorAll(".admin-tabs .tab").forEach(t => {
    t.addEventListener("click", () => switchTab(t.dataset.panel));
  });

  document.getElementById("post-filters").addEventListener("click", e => {
    const btn = e.target.closest(".filter-btn");
    if (!btn) return;
    document.querySelectorAll("#post-filters .filter-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    state.postStatus = btn.dataset.status;
    state.postPage = 1;
    loadPosts();
  });

  document.getElementById("new-post-btn").addEventListener("click", () => openEditor(null));
  document.getElementById("editor-back-btn").addEventListener("click", () => {
    state.editorId = null;
    showView("dashboard");
    switchTab("posts");
  });
  document.getElementById("save-draft-btn").addEventListener("click", () => savePost(false));
  document.getElementById("save-publish-btn").addEventListener("click", () => savePost(true));
  document.getElementById("preview-toggle-btn").addEventListener("click", togglePreview);
  document.getElementById("cover-upload-btn").addEventListener("click", () => document.getElementById("cover-file").click());
  document.getElementById("cover-file").addEventListener("change", e => {
    uploadCover(e.target.files[0]);
    e.target.value = "";
  });
  document.getElementById("content-file-btn").addEventListener("click", () => document.getElementById("content-file-input").click());
  document.getElementById("content-file-input").addEventListener("change", e => {
    insertContentFile(e.target.files[0]);
    e.target.value = "";
  });

  document.getElementById("post-tbody").addEventListener("click", e => {
    const edit = e.target.closest("[data-edit]");
    const pub = e.target.closest("[data-publish]");
    const top = e.target.closest("[data-top]");
    const del = e.target.closest("[data-delete]");
    const sort = e.target.closest("[data-save-sort]");
    if (edit) openEditor(Number(edit.dataset.edit));
    else if (pub) publishPost(Number(pub.dataset.publish));
    else if (top) {
      const row = top.closest("tr");
      const isTop = row.querySelector("[data-top]").textContent.includes("取消");
      toggleTop(Number(top.dataset.top), isTop);
    }
    else if (del) {
      const row = del.closest("tr");
      deletePost(Number(del.dataset.delete), row.querySelector(".title-cell").textContent.trim());
    }
    else if (sort) {
      const row = sort.closest("tr");
      const sortOrder = row.querySelector('[data-sort-field="sortOrder"]').value;
      const manualWeight = row.querySelector('[data-sort-field="manualWeight"]').value;
      savePostSort(Number(sort.dataset.saveSort), sortOrder, manualWeight);
    }
  });

  document.getElementById("new-cat-btn").addEventListener("click", () => openCatForm(null));
  document.getElementById("cat-cancel-btn").addEventListener("click", () => document.getElementById("cat-form").classList.remove("open"));
  document.getElementById("cat-save-btn").addEventListener("click", saveCategory);
  document.getElementById("cat-sort-save-btn").addEventListener("click", saveCategorySort);
  document.getElementById("cat-tbody").addEventListener("click", e => {
    const edit = e.target.closest("[data-cat-edit]");
    const toggle = e.target.closest("[data-cat-toggle]");
    if (edit) {
      state.categories = [];
      adminFetch("/admin/categories").then(tree => {
        state.categories = tree;
        openCatForm(Number(edit.dataset.catEdit));
      });
    } else if (toggle) {
      const row = toggle.closest("tr");
      const status = row.querySelector(".badge").textContent === "启用" ? 1 : 0;
      toggleCategory(Number(toggle.dataset.catToggle), status);
    }
  });
}

/* ---------- 初始化 ---------- */
function initAdmin() {
  bindEvents();
  if (state.token && state.user) {
    renderHeader();
    showView("dashboard");
    switchTab("posts");
  } else {
    showView("login");
  }
}

initAdmin();
