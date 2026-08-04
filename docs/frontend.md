# 政务风格前端说明（社会实践宣传平台）

版本：v1.1
日期：2026-08-04
范围：游客门户（首页轮播、分栏目、列表、详情）+ 管理后台（文章发布、栏目管理）。

## 1. 总体说明

前端为**纯静态页面**，由 Spring Boot 直接托管（`src/main/resources/static`），
不依赖 Node 构建和额外服务。启动后端后访问：

- 首页：`http://localhost:8080/api/`
- 栏目页：`http://localhost:8080/api/category.html?id=1`
- 文章页：`http://localhost:8080/api/post.html?id=1`
- 管理后台：`http://localhost:8080/api/admin.html`

> 后端上下文路径为 `/api`，静态资源也挂在该路径下。

## 2. 目录结构

```text
src/main/resources/static/
├── index.html                 # 首页：轮播图 + 通知公告 + 分栏目 + 热点关注
├── category.html              # 栏目列表页（最新/热点排序、分页）
├── post.html                  # 文章详情页（Markdown 渲染）
├── admin.html                 # 管理后台：登录 + 文章发布 + 栏目管理
├── css/style.css              # 政务红主题样式（含响应式）
├── css/admin.css              # 管理后台样式
├── img/                       # SVG 素材：站徽、横幅背景、轮播占位图
└── js/
    ├── api.js                 # 站点配置、接口封装、通用工具
    ├── mock-data.js           # 演示数据（仅 ?demo=1 时使用）
    ├── index.js / category.js / post.js
    ├── admin.js               # 管理后台逻辑（登录、发布、栏目管理）
    └── marked.min.js          # Markdown 渲染库（vendored）
```

## 3. 游客门户页面与接口映射

| 页面 | 数据来源 |
| --- | --- |
| 首页轮播图 | `GET /api/posts/hot?size=10`（置顶 + 人工排序 + 热度优先） |
| 首页通知公告 | `GET /api/categories/{id}/posts`（slug 为 `notices` 的栏目） |
| 首页分栏目 | `GET /api/categories` + 各栏目 `GET /api/categories/{id}/posts?size=5` |
| 首页热点关注 | `GET /api/posts/hot?size=10` |
| 栏目页列表 | `GET /api/categories/{id}/posts?page=&size=&sort=latest|hot` |
| 全部资讯 | `GET /api/posts?page=&size=` |
| 文章详情 | `GET /api/posts/{id}`（content 为 Markdown） |

响应统一为 `{ code, message, data, timestamp }`，`code = 200` 表示成功。

## 4. 管理后台（管理员发布文章）

管理后台同样由静态页面承载，登录后即可发布内容。

### 4.1 登录

打开 `http://localhost:8080/api/admin.html`，使用管理员账号登录
（默认用户名为 `admin`，密码为部署时设置的管理员密码）。
登录令牌保存在浏览器 localStorage，退出登录会清除。

### 4.2 发布流程

1. 进入「文章管理」→ 点击「+ 新建文章」；
2. 填写标题、摘要、封面（可点击「上传封面」存到 MinIO）、选择所属栏目（可多选）；
3. 在「正文内容」中输入 Markdown（支持预览；点「上传图片/附件」可上传图片、视频、
   音频、文档，上传成功后按类型自动插入到光标所在位置：图片用 Markdown 图片语法，
   视频（MP4/WebM/OGG）用 HTML5 播放器标签、音频用播放条，FLV/MOV/AVI 等浏览器
   不支持的视频格式以及其他文件用下载链接；建议在线播放统一使用 MP4）；
4. 点击「保存草稿」或「保存并发布」。

发布后首页轮播、栏目块与列表页自动展示；置顶且人工排序靠前的文章进入首页轮播。

### 4.3 运营能力

- 文章管理：按状态筛选（全部/草稿/审核中/已发布）、编辑、发布、置顶/取消置顶、
  人工排序（sortOrder + manualWeight）、删除（软删除）；
- 栏目管理：新增/编辑栏目、启用/禁用、调整排序（影响首页分栏与导航顺序）；
- 附件上传：封面走图片上传接口（`POST /api/files/upload/image`）；正文走通用上传接口
  （`POST /api/files/upload`），支持图片、视频（mp4/webm/mov/avi/mkv）、音频
  （mp3/wav/aac/ogg）与文档（pdf/doc/docx/xls/xlsx/txt/md），单文件上限 200MB。

### 4.4 涉及的管理接口

| 操作 | 接口 |
| --- | --- |
| 登录 | `POST /api/auth/login` |
| 文章列表（含草稿） | `GET /api/posts?status=&page=&size=` |
| 创建文章 | `POST /api/posts` |
| 更新文章 | `PUT /api/posts/{id}` |
| 发布文章 | `PUT /api/posts/{id}/publish` |
| 删除文章 | `DELETE /api/posts/{id}` |
| 置顶 | `PUT /api/admin/posts/{id}/top` |
| 人工排序 | `PUT /api/admin/posts/{id}/sort` |
| 栏目树（后台） | `GET /api/admin/categories` |
| 栏目新增/更新/禁用/排序 | `POST|PUT|DELETE /api/admin/categories/**` |
| 图片上传 | `POST /api/files/upload/image` |
| 附件上传 | `POST /api/files/upload` |

### 4.5 权限说明

- 发布文章需要 `post:create` / `post:publish` 权限，且发布接口仅允许文章作者本人操作；
- 栏目管理接口需要 `category:create/update/delete` 权限。
  初始数据库只有 `category:manage`，请执行 `Sql/government_phase5_admin_permissions.sql`
  为管理员补齐，否则栏目管理会被 403 拦截。

## 5. 运行方式

### 5.1 有后端环境

1. 启动 MySQL / Redis / RabbitMQ（`docker-compose up -d`）；
2. 导入数据库脚本：
   - `Sql/blog_system.sql`（基础库）
   - `Sql/government_phase2_categories.sql`（政务栏目）
   - `Sql/government_phase3_hot_posts.sql`（热点排序字段）
   - `Sql/government_phase5_admin_permissions.sql`（后台栏目权限）
   - `Sql/government_frontend_seed_posts.sql`（示例文章，可选）
3. 启动后端：`mvn spring-boot:run`；
4. 浏览器访问 `http://localhost:8080/api/`。

### 5.2 无后端预览（演示模式）

后端未启动时，页面 URL 加 `?demo=1` 使用内置演示数据：

- `http://localhost:8080/api/index.html?demo=1`
- 或直接双击打开 `src/main/resources/static/index.html?demo=1`

> 演示模式仅覆盖游客门户；管理后台需要真实后端与登录账号。

## 6. 自定义配置

站点名称、机构名称、接口地址统一在 `js/api.js` 的 `SITE_CONFIG` 中修改：

```js
const SITE_CONFIG = {
  orgName: "中国石油大学（北京）克拉玛依校区",
  siteName: "大学生社会实践宣传平台",
  apiBase: "/api"
};
```

## 7. 内容运营说明

- **轮播图**：取置顶（`is_top=1`）且人工排序靠前的发布文章；无封面的文章自动使用
  `img/slide*.svg` 渐变占位图。后台可用「置顶」和「排序/权重」调整轮播内容。
- **分栏目**：以启用栏目为准，首页自动按 `sort_order` 排列；后台「栏目管理」可调整。
- **通知公告**：首页右侧面板固定展示 slug 为 `notices`（或名称为“通知公告”）的栏目文章。
- **文章封面**：`coverImage` 支持完整 URL 或相对路径，未设置时前端自动使用默认封面。

## 8. 注意事项

- 游客接口默认只返回 `status = 1` 的发布文章，草稿/审核中文章不会出现在前台。
- 评论功能已按后端配置关闭（`features.comment.enabled=false`），前台无评论入口。
- 文章内容按 Markdown 渲染（`content_type = MARKDOWN`）。
- 管理后台是纯前端登录校验，真正的权限由后端接口强制（未登录/无权限会 401/403）。
