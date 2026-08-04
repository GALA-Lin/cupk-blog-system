/* ============ 首页逻辑 ============ */

const FALLBACK_SLIDES = ["img/slide1.svg", "img/slide2.svg", "img/slide3.svg", "img/slide4.svg"];

function slideBackground(post, index) {
  if (post.coverImage) return coverUrl(post);
  return FALLBACK_SLIDES[index % FALLBACK_SLIDES.length];
}

/* ---------- 轮播图 ---------- */
function initCarousel(posts) {
  const wrap = document.getElementById("carousel-slides");
  const dots = document.getElementById("carousel-dots");
  if (!wrap) return;

  if (!posts || !posts.length) {
    showState(wrap, "暂无焦点新闻", false);
    return;
  }

  wrap.innerHTML = "";
  dots.innerHTML = "";

  posts.forEach((post, i) => {
    const slide = document.createElement("div");
    slide.className = "slide" + (i === 0 ? " active" : "");
    slide.dataset.index = i;
    slide.innerHTML =
      '<div class="slide-bg" style="background-image:url(\'' + slideBackground(post, i) + '\')"></div>' +
      '<div class="slide-caption">' +
      (post.isTop === 1 ? '<span class="slide-tag">置顶</span>' : "") +
      "<h3>" + escapeHtml(post.title) + "</h3>" +
      (post.summary ? "<p>" + escapeHtml(post.summary) + "</p>" : "") +
      "</div>";
    slide.addEventListener("click", () => {
      location.href = postUrl(post.id);
    });
    wrap.appendChild(slide);

    const dot = document.createElement("button");
    dot.className = i === 0 ? "active" : "";
    dot.setAttribute("aria-label", "第" + (i + 1) + "张");
    dot.addEventListener("click", e => {
      e.stopPropagation();
      goSlide(i);
      restartTimer();
    });
    dots.appendChild(dot);
  });

  let current = 0;
  let timer = null;

  function goSlide(index) {
    const slides = wrap.querySelectorAll(".slide");
    if (!slides.length) return;
    current = (index + slides.length) % slides.length;
    slides.forEach(s => s.classList.toggle("active", Number(s.dataset.index) === current));
    dots.querySelectorAll("button").forEach((d, i) => d.classList.toggle("active", i === current));
  }

  function next() {
    goSlide(current + 1);
  }

  function restartTimer() {
    if (timer) clearInterval(timer);
    timer = setInterval(next, 5000);
  }

  const carousel = document.getElementById("carousel");
  document.getElementById("carousel-prev").addEventListener("click", () => { goSlide(current - 1); restartTimer(); });
  document.getElementById("carousel-next").addEventListener("click", () => { goSlide(current + 1); restartTimer(); });
  carousel.addEventListener("mouseenter", () => timer && clearInterval(timer));
  carousel.addEventListener("mouseleave", restartTimer);
  restartTimer();
}

/* ---------- 通知公告 ---------- */
function renderNotices(categories, hotPosts) {
  const list = document.getElementById("notice-list");
  const noticeCat = categories.find(c => c.slug === "notices" || c.name === "通知公告");

  const fill = records => {
    list.innerHTML = "";
    if (!records || !records.length) {
      showState(list, "暂无公告", false);
      return;
    }
    records.slice(0, 6).forEach(p => {
      const li = document.createElement("li");
      li.innerHTML =
        '<span class="dot"></span>' +
        '<a href="' + postUrl(p.id) + '" title="' + escapeHtml(p.title) + '">' + escapeHtml(p.title) + "</a>" +
        '<span class="date">' + formatDate(p.publishedAt) + "</span>";
      list.appendChild(li);
    });
  };

  if (noticeCat) {
    document.getElementById("notice-more").href = categoryUrl(noticeCat.id);
    fetchCategoryPosts(noticeCat.id, 1, 6, "latest").then(fill).catch(() => fill(hotPosts));
  } else {
    document.getElementById("notice-more").style.display = "none";
    fill(hotPosts);
  }
}

/* ---------- 快捷服务 ---------- */
function renderQuickLinks(categories) {
  const box = document.getElementById("quick-links");
  const map = {};
  categories.forEach(c => { map[c.slug] = c; });

  const links = [
    ["通知公告", map["notices"]],
    ["成果展示", map["special-topics"]],
    ["政策文件", map["policy-interpretation"]],
    ["信息公开", map["information-disclosure"]],
    ["便民服务", map["public-services"]]
  ];

  box.innerHTML = "";
  links.forEach(([label, cat]) => {
    const a = document.createElement("a");
    a.textContent = label;
    a.href = cat ? categoryUrl(cat.id) : "category.html" + (SITE_CONFIG.demo ? "?demo=1" : "");
    box.appendChild(a);
  });
}

/* ---------- 分栏内容区 ---------- */
async function renderSections(tree) {
  const wrap = document.getElementById("home-sections");
  wrap.innerHTML = "";

  const topLevel = tree.filter(c => !c.parentId && c.slug !== "notices");
  if (!topLevel.length) {
    showState(wrap, "暂无栏目，请先在后台创建并启用栏目", false);
    return;
  }

  const jobs = topLevel.map(async cat => {
    let records = [];
    try {
      const page = await fetchCategoryPosts(cat.id, 1, 5, "latest");
      records = page.records || [];
    } catch (e) {
      console.warn("栏目文章加载失败:", cat.name, e);
    }

    const block = document.createElement("div");
    block.className = "column-block";
    block.innerHTML =
      '<div class="column-head">' +
      '<span class="col-icon">' + (cat.icon || "📄") + "</span>" +
      '<span class="col-name">' + escapeHtml(cat.name) + "</span>" +
      (cat.description ? '<span class="col-desc">' + escapeHtml(cat.description) + "</span>" : "") +
      '<a class="more" href="' + categoryUrl(cat.id) + '">更多 ›</a>' +
      "</div>";

    const ul = document.createElement("ul");
    ul.className = "column-list";
    if (!records.length) {
      ul.innerHTML = '<li class="state" style="border:none">该栏目暂无内容</li>';
    } else {
      records.forEach(p => {
        const li = document.createElement("li");
        li.innerHTML =
          (p.isTop === 1 ? '<span class="flag">置顶</span>' : "") +
          '<a href="' + postUrl(p.id) + '" title="' + escapeHtml(p.title) + '">' + escapeHtml(p.title) + "</a>" +
          '<span class="date">' + formatDate(p.publishedAt) + "</span>";
        ul.appendChild(li);
      });
    }
    block.appendChild(ul);
    wrap.appendChild(block);
  });

  await Promise.all(jobs);
}

/* ---------- 热点关注 ---------- */
function renderHot(posts) {
  const list = document.getElementById("hot-list");
  if (!posts || !posts.length) {
    showState(list, "暂无热点文章", false);
    return;
  }
  list.innerHTML = "";
  posts.slice(0, 10).forEach((p, i) => {
    const li = document.createElement("li");
    li.innerHTML =
      '<i class="rank' + (i < 3 ? " top" : "") + '">' + (i + 1) + "</i>" +
      '<a href="' + postUrl(p.id) + '" title="' + escapeHtml(p.title) + '">' + escapeHtml(p.title) + "</a>" +
      '<span class="views">' + (p.viewCount || 0) + " 阅读</span>";
    list.appendChild(li);
  });
}

/* ---------- 启动 ---------- */
async function initIndex() {
  setTitle();
  const yearEl = document.getElementById("footer-year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
  document.getElementById("site-title").textContent = SITE_CONFIG.siteName;
  document.getElementById("site-subtitle").textContent = SITE_CONFIG.orgName + " · 社会实践专题网站";
  document.getElementById("footer-org").textContent = SITE_CONFIG.orgName;
  document.getElementById("link-all").href = "category.html" + (SITE_CONFIG.demo ? "?demo=1" : "");

  await renderNav(null);

  let categories = [];
  let tree = [];
  let hotPage = { records: [] };
  try {
    [categories, tree, hotPage] = await Promise.all([fetchCategories(), fetchCategoryTree(), fetchHotPosts()]);
  } catch (e) {
    console.warn("数据加载失败:", e);
  }

  const hotPosts = hotPage.records || [];
  initCarousel(hotPosts);
  renderNotices(categories, hotPosts);
  renderQuickLinks(categories);
  renderHot(hotPosts);
  renderSections(tree);
}

initIndex();
