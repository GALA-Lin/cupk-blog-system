/**
 * 演示数据：当以 ?demo=1 打开页面时使用，用于在没有后端/数据库的环境下预览前端效果。
 * 真实运行时（不带 demo 参数）不会加载本文件中的数据。
 */
const MOCK_CATEGORIES = [
  { id: 1, parentId: null, name: "政务动态", slug: "government-news", description: "政务动态与工作进展", icon: "🏛️", sortOrder: 10, postCount: 8, status: 1 },
  { id: 2, parentId: null, name: "通知公告", slug: "notices", description: "通知公告与公示信息", icon: "📢", sortOrder: 20, postCount: 6, status: 1 },
  { id: 3, parentId: null, name: "政策解读", slug: "policy-interpretation", description: "政策文件解读", icon: "📖", sortOrder: 30, postCount: 5, status: 1 },
  { id: 4, parentId: null, name: "信息公开", slug: "information-disclosure", description: "政府信息公开", icon: "📊", sortOrder: 40, postCount: 5, status: 1 },
  { id: 5, parentId: null, name: "专题专栏", slug: "special-topics", description: "专题宣传与重点工作", icon: "🎯", sortOrder: 50, postCount: 5, status: 1 },
  { id: 6, parentId: null, name: "便民服务", slug: "public-services", description: "便民服务信息", icon: "🤝", sortOrder: 60, postCount: 5, status: 1 },
  { id: 7, parentId: 5, name: "暑期三下乡", slug: "summer-practice", description: "暑期社会实践专题", icon: "🌾", sortOrder: 10, postCount: 3, status: 1 },
  { id: 8, parentId: 5, name: "返家乡实践", slug: "hometown-practice", description: "返家乡社会实践专题", icon: "🏠", sortOrder: 20, postCount: 2, status: 1 }
];

function mockPost(id, overrides) {
  return Object.assign({
    id,
    title: "示例文章标题",
    slug: "demo-post-" + id,
    summary: "这是示例文章摘要，用于在没有后端数据时预览页面布局效果。",
    coverImage: "",
    authorName: "社会实践工作办公室",
    authorAvatar: "",
    status: 1,
    isTop: 0,
    sortOrder: 0,
    manualWeight: 0,
    hotScore: 0,
    viewCount: 100,
    likeCount: 5,
    favoriteCount: 2,
    commentCount: 0,
    publishedAt: "2026-07-28 09:30:00",
    categoryIds: [1],
    content: ""
  }, overrides);
}

function mockMarkdown(title) {
  return `## ${title}

**为深入学习贯彻党的二十届三中全会精神，引导青年学生投身社会实践，在实践中受教育、长才干、作贡献**，学校组织开展系列社会实践活动。

### 活动安排

1. 实践报名：即日起至规定日期，登录平台完成报名；
2. 岗前培训：围绕安全教育、调研方法、报告撰写开展专题培训；
3. 实地实践：深入基层一线开展调研、宣讲与服务；
4. 成果提交：实践结束后提交总结报告与影像资料。

> 温馨提示：参与实践的同学请注意人身与财产安全，服从带队教师统一安排。

### 成果展示

活动期间，平台将陆续展示各实践团队的风采：

| 序号 | 团队名称 | 实践地点 |
| ---- | ---- | ---- |
| 1 | “油城星火”实践团 | 克拉玛依区 |
| 2 | “青春筑梦”实践团 | 独山子区 |
| 3 | “薪火相传”实践团 | 白碱滩区 |

实践过程中拍摄的照片、视频可上传至本平台专栏，经审核后择优展示。`;
}

const MOCK_POSTS = [
  mockPost(101, {
    title: "学校召开2026年暑期社会实践工作部署会",
    summary: "会议围绕实践主题、安全保障、组织动员等方面进行了全面部署，确保暑期社会实践安全有序开展。",
    coverImage: "img/slide1.svg",
    viewCount: 2386, likeCount: 32, favoriteCount: 15,
    publishedAt: "2026-07-30 10:20:00", isTop: 1, sortOrder: 100, categoryIds: [1],
    content: mockMarkdown("学校召开2026年暑期社会实践工作部署会")
  }),
  mockPost(102, {
    title: "我校社会实践团队走进社区开展便民志愿服务",
    summary: "实践团队结合专业特长，为社区居民提供知识宣讲、便民维修等志愿服务，受到社区群众好评。",
    coverImage: "img/slide2.svg",
    viewCount: 1982, likeCount: 27, favoriteCount: 12,
    publishedAt: "2026-07-28 15:40:00", isTop: 1, sortOrder: 90, categoryIds: [1, 6],
    content: mockMarkdown("我校社会实践团队走进社区开展便民志愿服务")
  }),
  mockPost(103, {
    title: "关于2026年大学生暑期社会实践报名工作的通知",
    summary: "现将2026年大学生暑期社会实践报名工作有关事项通知如下，请各学院做好组织动员。",
    coverImage: "img/slide3.svg",
    viewCount: 3210, likeCount: 18, favoriteCount: 20,
    publishedAt: "2026-07-26 09:00:00", isTop: 1, sortOrder: 80, categoryIds: [2],
    content: mockMarkdown("关于2026年大学生暑期社会实践报名工作的通知")
  }),
  mockPost(104, {
    title: "实践归来话成长：优秀社会实践成果展示（第一期）",
    summary: "本期展示三支优秀实践团队的调研成果与心得体会，一起听听他们的实践故事。",
    coverImage: "img/slide4.svg",
    viewCount: 1756, likeCount: 41, favoriteCount: 18,
    publishedAt: "2026-07-24 11:30:00", isTop: 1, sortOrder: 70, categoryIds: [5, 7],
    content: mockMarkdown("实践归来话成长：优秀社会实践成果展示（第一期）")
  }),
  mockPost(105, {
    title: "《关于进一步加强大学生社会实践工作的实施方案》解读",
    summary: "围绕方案的总体要求、重点任务和保障措施三个方面进行详细解读。",
    viewCount: 1502, likeCount: 22, favoriteCount: 9,
    publishedAt: "2026-07-22 14:00:00", isTop: 0, sortOrder: 60, categoryIds: [3],
    content: mockMarkdown("《关于进一步加强大学生社会实践工作的实施方案》解读")
  }),
  mockPost(106, {
    title: "社会实践安全须知：这些事项要牢记",
    summary: "外出实践期间，安全始终是第一位的。请同学们认真阅读并遵守安全须知。",
    coverImage: "img/slide2.svg",
    viewCount: 2988, likeCount: 35, favoriteCount: 22,
    publishedAt: "2026-07-20 08:50:00", isTop: 0, sortOrder: 50, categoryIds: [6],
    content: mockMarkdown("社会实践安全须知：这些事项要牢记")
  }),
  mockPost(107, {
    title: "2026年上半年社会实践工作总结",
    summary: "上半年共组织实践团队120余支，参与学生3000余人次，成果丰硕。",
    viewCount: 1288, likeCount: 16, favoriteCount: 8,
    publishedAt: "2026-07-18 16:20:00", isTop: 0, sortOrder: 40, categoryIds: [1],
    content: mockMarkdown("2026年上半年社会实践工作总结")
  }),
  mockPost(108, {
    title: "暑期社会实践专项培训讲座预告",
    summary: "讲座围绕调研方法、报告撰写与影像记录开展，欢迎同学们报名参加。",
    viewCount: 1105, likeCount: 12, favoriteCount: 6,
    publishedAt: "2026-07-16 10:10:00", isTop: 0, sortOrder: 30, categoryIds: [2],
    content: mockMarkdown("暑期社会实践专项培训讲座预告")
  }),
  mockPost(109, {
    title: "“返家乡”社会实践岗位征集公告",
    summary: "现面向各地用人单位征集社会实践岗位，欢迎用人单位积极参与。",
    coverImage: "img/slide3.svg",
    viewCount: 1560, likeCount: 20, favoriteCount: 14,
    publishedAt: "2026-07-14 09:30:00", isTop: 0, sortOrder: 25, categoryIds: [5, 8],
    content: mockMarkdown("“返家乡”社会实践岗位征集公告")
  }),
  mockPost(110, {
    title: "社会实践优秀调研报告评选结果公示",
    summary: "经专家评审，共评选出一等奖3项、二等奖6项、三等奖10项，现予以公示。",
    viewCount: 2244, likeCount: 29, favoriteCount: 11,
    publishedAt: "2026-07-12 15:00:00", isTop: 0, sortOrder: 20, categoryIds: [4],
    content: mockMarkdown("社会实践优秀调研报告评选结果公示")
  }),
  mockPost(111, {
    title: "实践团队风采：油城青年在行动",
    summary: "跟随镜头，一起看看各实践团队在基层一线的青春身影。",
    coverImage: "img/slide4.svg",
    viewCount: 1877, likeCount: 45, favoriteCount: 25,
    publishedAt: "2026-07-10 13:40:00", isTop: 0, sortOrder: 15, categoryIds: [5, 7],
    content: mockMarkdown("实践团队风采：油城青年在行动")
  }),
  mockPost(112, {
    title: "社会实践报告撰写规范与模板下载",
    summary: "提供社会实践报告撰写规范及参考模板，供各实践团队下载使用。",
    viewCount: 3420, likeCount: 24, favoriteCount: 30,
    publishedAt: "2026-07-08 09:15:00", isTop: 0, sortOrder: 10, categoryIds: [3],
    content: mockMarkdown("社会实践报告撰写规范与模板下载")
  }),
  mockPost(113, {
    title: "校地合作共建大学生社会实践基地",
    summary: "学校与克拉玛依市多个单位签署合作协议，共建大学生社会实践基地。",
    viewCount: 1420, likeCount: 19, favoriteCount: 10,
    publishedAt: "2026-07-06 11:00:00", isTop: 0, sortOrder: 5, categoryIds: [1],
    content: mockMarkdown("校地合作共建大学生社会实践基地")
  }),
  mockPost(114, {
    title: "实践专项经费使用管理办法",
    summary: "为规范和加强社会实践专项经费管理，提高资金使用效益，制定本办法。",
    viewCount: 980, likeCount: 8, favoriteCount: 5,
    publishedAt: "2026-07-04 10:30:00", isTop: 0, sortOrder: 0, categoryIds: [4],
    content: mockMarkdown("实践专项经费使用管理办法")
  }),
  mockPost(115, {
    title: "暑期实践：赴新疆油田开展实地调研",
    summary: "实践团走进油田一线，围绕能源产业转型升级开展专题调研。",
    coverImage: "img/slide1.svg",
    viewCount: 1690, likeCount: 33, favoriteCount: 16,
    publishedAt: "2026-07-02 14:20:00", isTop: 0, sortOrder: 0, categoryIds: [5, 7],
    content: mockMarkdown("暑期实践：赴新疆油田开展实地调研")
  }),
  mockPost(116, {
    title: "社会实践成果征集与展示活动通知",
    summary: "面向全体实践团队征集图文、视频成果，优秀成果将在平台专栏展示。",
    viewCount: 1345, likeCount: 15, favoriteCount: 9,
    publishedAt: "2026-06-30 09:40:00", isTop: 0, sortOrder: 0, categoryIds: [2],
    content: mockMarkdown("社会实践成果征集与展示活动通知")
  })
];

function mockCategories() {
  return MOCK_CATEGORIES.filter(c => c.status === 1).map(c => ({ ...c }));
}

function mockCategoryTree() {
  const map = new Map();
  MOCK_CATEGORIES.forEach(c => map.set(c.id, { ...c, children: [] }));
  const roots = [];
  map.forEach(c => {
    if (c.parentId && map.has(c.parentId)) {
      map.get(c.parentId).children.push(c);
    } else {
      roots.push(c);
    }
  });
  return roots;
}

function mockCategoryDetail(id) {
  const c = MOCK_CATEGORIES.find(x => x.id === Number(id));
  return c ? { ...c, children: [] } : null;
}

function mockPostsInCategory(categoryId) {
  const ids = [categoryId];
  MOCK_CATEGORIES.filter(c => c.parentId === categoryId).forEach(c => ids.push(c.id));
  return MOCK_POSTS.filter(p => p.categoryIds.some(id => ids.includes(id)));
}

function mockPage(records, page, size) {
  const total = records.length;
  const pages = Math.max(1, Math.ceil(total / size));
  const start = (page - 1) * size;
  return {
    records: records.slice(start, start + size),
    total,
    pageNum: page,
    pageSize: size,
    totalPages: pages,
    hasPrevious: page > 1,
    hasNext: page < pages,
    size,
    current: page,
    pages
  };
}

function mockSort(posts, sort) {
  const list = [...posts];
  if (sort === "hot") {
    list.sort((a, b) => b.viewCount - a.viewCount || (b.publishedAt < a.publishedAt ? -1 : 1));
  } else {
    list.sort((a, b) => b.isTop - a.isTop || b.sortOrder - a.sortOrder || (b.publishedAt < a.publishedAt ? -1 : 1));
  }
  return list;
}

async function mockGet(path) {
  const url = new URL(path, location.origin);
  const basePath = url.pathname;
  const page = Number(url.searchParams.get("page") || 1);
  const size = Number(url.searchParams.get("size") || 10);
  const sort = url.searchParams.get("sort") || "latest";
  const categoryId = url.searchParams.get("categoryId");

  if (basePath.startsWith("/categories/tree")) return mockCategoryTree();
  if (basePath.startsWith("/categories/")) {
    const m = basePath.match(/^\/categories\/(\d+)\/posts$/);
    if (m) {
      return mockPage(mockSort(mockPostsInCategory(Number(m[1])), sort), page, size);
    }
    const d = basePath.match(/^\/categories\/(\d+)$/);
    if (d) return mockCategoryDetail(d[1]);
  }
  if (basePath.startsWith("/categories")) return mockCategories();

  if (basePath.startsWith("/posts/hot")) {
    let list = mockSort(MOCK_POSTS, "hot");
    if (categoryId) list = mockSort(mockPostsInCategory(Number(categoryId)), "hot");
    return mockPage(list, page, size);
  }
  if (basePath.startsWith("/posts/recommendations")) {
    return mockPage(mockSort(MOCK_POSTS.filter(p => p.isTop === 1), "hot"), page, size);
  }
  const postM = basePath.match(/^\/posts\/(\d+)$/);
  if (postM) {
    const p = MOCK_POSTS.find(x => x.id === Number(postM[1]));
    if (!p) return null;
    return {
      ...p,
      categories: MOCK_CATEGORIES.filter(c => p.categoryIds.includes(c.id)).map(c => ({ id: c.id, name: c.name, slug: c.slug })),
      tags: [],
      createdAt: p.publishedAt
    };
  }
  if (basePath.startsWith("/posts")) {
    return mockPage(mockSort(MOCK_POSTS, "latest"), page, size);
  }
  return null;
}
