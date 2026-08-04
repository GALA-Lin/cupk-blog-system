/* ============ 栏目列表页逻辑 ============ */

const params = new URLSearchParams(location.search);
const categoryId = params.get("id") ? Number(params.get("id")) : null;
let currentPage = 1;
let currentSort = "latest";
let currentCategory = null;

function renderList(records) {
  const list = document.getElementById("post-list");
  if (!records || !records.length) {
    showState(list, "暂无内容", false);
    return;
  }

  list.innerHTML = "";
  records.forEach(p => {
    const li = document.createElement("li");
    li.innerHTML =
      '<div class="thumb"><a href="' + postUrl(p.id) + '"><img src="' + coverUrl(p) + '" alt="' + escapeHtml(p.title) + '" loading="lazy"></a></div>' +
      '<div class="info">' +
      '<h3><a href="' + postUrl(p.id) + '" title="' + escapeHtml(p.title) + '">' +
      (p.isTop === 1 ? '<span class="flag">置顶</span> ' : "") + escapeHtml(p.title) +
      "</a></h3>" +
      (p.summary ? '<p class="summary">' + escapeHtml(p.summary) + "</p>" : "") +
      "</div>" +
      '<div class="meta"><span>' + formatDate(p.publishedAt, true) + "</span>" +
      '<div class="views">' + (p.viewCount || 0) + " 阅读</div></div>";
    list.appendChild(li);
  });
}

async function loadList(page, sort) {
  currentPage = page;
  currentSort = sort;

  const list = document.getElementById("post-list");
  list.innerHTML = '<div class="state"><span class="loading-spinner"></span>加载中…</div>';

  try {
    const pageResult = categoryId
      ? await fetchCategoryPosts(categoryId, page, SITE_CONFIG.pageSize, sort)
      : await fetchAllPosts(page, SITE_CONFIG.pageSize);
    renderList(pageResult.records);
    renderPager(document.getElementById("pager"), pageResult, p => loadList(p, currentSort));
  } catch (e) {
    console.error(e);
    showState(list, "内容加载失败：" + e.message, true);
  }
}

function initSortTabs() {
  const tabs = document.querySelectorAll("#sort-tabs .tab");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      loadList(1, tab.dataset.sort);
    });
  });
  // “全部资讯”接口不支持热点排序，隐藏热点 Tab
  if (!categoryId) {
    const hotTab = document.querySelector('#sort-tabs .tab[data-sort="hot"]');
    if (hotTab) hotTab.style.display = "none";
  }
}

async function renderSidebar() {
  const sideCat = document.getElementById("side-cat");
  const sideHot = document.getElementById("side-hot");

  try {
    const categories = await fetchCategories();
    sideCat.innerHTML = "";
    const allLink = document.createElement("a");
    allLink.href = "category.html" + (SITE_CONFIG.demo ? "?demo=1" : "");
    allLink.className = categoryId ? "" : "active";
    allLink.innerHTML = "<span>全部资讯</span><span class='count'>全部</span>";
    sideCat.appendChild(allLink);

    categories.filter(c => !c.parentId).forEach(cat => {
      const a = document.createElement("a");
      a.href = categoryUrl(cat.id);
      a.className = String(cat.id) === String(categoryId) ? "active" : "";
      a.innerHTML = "<span>" + escapeHtml(cat.name) + "</span>" +
        "<span class='count'>" + (cat.postCount || 0) + "</span>";
      sideCat.appendChild(a);
    });
  } catch (e) {
    showState(sideCat, "栏目加载失败", true);
  }

  try {
    const hot = await fetchHotPosts(categoryId);
    const records = hot.records || [];
    sideHot.innerHTML = "";
    if (!records.length) {
      showState(sideHot, "暂无热点", false);
      return;
    }
    records.slice(0, 8).forEach(p => {
      const li = document.createElement("li");
      const rank = document.createElement("i");
      rank.className = "rank" + (sideHot.children.length < 3 ? " top" : "");
      rank.textContent = sideHot.children.length + 1;
      const a = document.createElement("a");
      a.href = postUrl(p.id);
      a.title = p.title;
      a.textContent = p.title;
      li.appendChild(rank);
      li.appendChild(a);
      sideHot.appendChild(li);
    });
  } catch (e) {
    showState(sideHot, "热点加载失败", true);
  }
}

async function initCategory() {
  const yearEl = document.getElementById("footer-year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const title = categoryId ? "栏目资讯" : "全部资讯";
  setTitle(title);
  await renderNav(categoryId);

  if (categoryId) {
    try {
      currentCategory = await fetchCategory(categoryId);
      document.getElementById("crumb-cur").textContent = currentCategory.name;
      document.title = currentCategory.name + " - " + SITE_CONFIG.orgName + SITE_CONFIG.siteName;
    } catch (e) {
      document.getElementById("crumb-cur").textContent = "栏目不存在";
    }
  }

  initSortTabs();
  loadList(1, "latest");
  renderSidebar();
}

initCategory();
