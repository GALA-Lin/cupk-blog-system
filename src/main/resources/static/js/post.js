/* ============ 文章详情页逻辑 ============ */

const postParams = new URLSearchParams(location.search);
const postId = postParams.get("id") ? Number(postParams.get("id")) : null;

function renderArticle(detail) {
  const article = document.getElementById("article");
  if (!detail) {
    article.innerHTML =
      '<div class="state">' +
      '<div class="state-icon">📄</div>文章不存在或已下线' +
      '<div class="article-back"><a href="index.html">返回首页</a></div>' +
      "</div>";
    return;
  }

  const primaryCat = detail.categories && detail.categories.length ? detail.categories[0] : null;
  if (primaryCat) {
    const crumbCat = document.getElementById("crumb-cat");
    crumbCat.innerHTML = " › <a href=\"" + categoryUrl(primaryCat.id) + "\">" + escapeHtml(primaryCat.name) + "</a>";
  }

  let html = "";
  html += "<h1 class='article-title'>" + escapeHtml(detail.title) + "</h1>";
  html += "<div class='article-meta'>";
  if (detail.authorName) html += "<span>来源：" + escapeHtml(detail.authorName) + "</span>";
  if (detail.publishedAt) html += "<span>发布时间：" + escapeHtml(formatDate(detail.publishedAt, true)) + "</span>";
  html += "<span>阅读：" + (detail.viewCount || 0) + "</span>";
  html += "</div>";

  if (detail.content) {
    html += "<div class='article-content'>" + marked.parse(detail.content) + "</div>";
  } else {
    html += "<div class='article-content'><p>" + escapeHtml(detail.summary || "暂无内容") + "</p></div>";
  }

  if (detail.categories && detail.categories.length) {
    html += "<div class='article-tags'>所属栏目：";
    detail.categories.forEach(c => {
      html += '<a href="' + categoryUrl(c.id) + '">' + escapeHtml(c.name) + "</a>";
    });
    html += "</div>";
  }

  html += '<div class="article-back"><a href="' + (primaryCat ? categoryUrl(primaryCat.id) : "index.html") + '">返回列表</a></div>';
  article.innerHTML = html;

  // 为文章标题/正文中的图片添加懒加载
  article.querySelectorAll("img").forEach(img => {
    img.loading = "lazy";
    img.style.maxWidth = "100%";
  });
}

async function initPost() {
  const yearEl = document.getElementById("footer-year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
  setTitle("文章详情");
  await renderNav(null);

  const article = document.getElementById("article");
  if (!postId) {
    renderArticle(null);
    return;
  }

  try {
    const detail = await fetchPost(postId);
    renderArticle(detail);
    setTitle(detail.title);
  } catch (e) {
    console.error(e);
    article.innerHTML =
      '<div class="state">' +
      '<div class="state-icon">⚠️</div>' +
      '<div class="error-msg">' + escapeHtml(e.message) + "</div>" +
      '<div class="article-back"><a href="index.html">返回首页</a></div>' +
      "</div>";
  }
}

initPost();
