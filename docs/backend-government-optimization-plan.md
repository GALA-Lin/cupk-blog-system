# 政务宣传网站后端优化方案

版本：v0.1  
日期：2026-07-01  
范围：仅后端接口、权限、数据模型与实施顺序；前端政务风格后续单独设计。

## 1. 背景与目标

当前项目是 Spring Boot 3 + MyBatis-Plus + Redis + RabbitMQ + MinIO 的博客系统，已有文章、评论、点赞、收藏、通知、文件等模块。此次改造目标是将其收敛为“政务宣传网站”后端，优先服务游客浏览、栏目化内容管理、热点推荐与后台人工运营。

主要输入：

- `E:\Downloads\Post API_OpenAPI.json`：文章接口，目前包含 `/posts`、`/posts/{id}`、发布、创建、更新、删除。
- `E:\Downloads\Notification API_OpenAPI.json`：通知接口，保持登录用户与管理员场景。
- `E:\Downloads\File API_OpenAPI.json`：文件接口，继续支撑文章封面、附件、富文本图片。
- 现有代码：`src/main/java/com/blog/module/post`、`src/main/java/com/blog/module/comment`、`src/main/java/com/blog/config/SecurityConfig.java`。

本阶段后端目标：

1. 暂时断开评论 API，不删除表与历史数据。
2. 降低文章访问鉴权，游客可访问已发布文章。
3. 完善文章分类/栏目能力。
4. 增加热点文章能力，并支持管理员手动调整排序。
5. 为后续政务风格前端提供稳定、清晰、可缓存的公开接口。

## 2. 现状判断

### 2.1 已具备能力

- `posts` 表已有 `status`、`is_top`、`view_count`、`like_count`、`favorite_count`、`comment_count`、`published_at` 等字段。
- `categories`、`post_categories` 已存在，可承载栏目分类。
- `PostCreateDTO` / `PostUpdateDTO` 已包含 `categoryIds`。
- 文件上传与通知模块接口较完整，可继续作为后台编辑与系统消息能力。

### 2.2 需要修正的问题

- `SecurityConfig` 当前只放行精确路径 `/posts`，`GET /posts/{id}` 仍会被全局鉴权拦截。
- `GET /posts` 当前允许游客传 `status=0` 查询草稿，政务公开场景存在内容泄露风险。
- `PostServiceImpl#createPost` 在 `postMapper.insert(post)` 之前保存分类/标签，`post.getId()` 此时为空，文章分类关系可能无法正确保存。
- 评论接口虽然部分读取接口未加 `@PreAuthorize`，但全局鉴权仍可能拦截；如果要“暂时断开”，应从统一开关或路由层处理，而不是零散删除代码。
- 分类实体存在，但缺少面向前台与后台的分类 Controller / Service API。
- `is_top` 只能表达置顶，无法表达“热点排序、手动运营位、栏目内排序、推荐有效期”等运营需求。

## 3. 总体设计原则

- **公开只读，后台受控**：游客仅访问已发布、可公开内容；写操作、草稿、排序、推荐配置均需后台角色。
- **临时断开不破坏数据**：评论模块采用功能开关禁用入口，保留数据库、实体、Service 与历史数据，方便未来恢复。
- **栏目优先**：政务网站以栏目为主线，文章列表、热点、推荐均支持栏目维度。
- **自动热度 + 人工干预**：热度算法提供默认排序，管理员可通过置顶/推荐/排序权重覆盖。
- **接口向前端友好**：公开接口稳定、分页清晰、默认只返回发布态，便于缓存与 SEO。

## 4. 评论 API 暂时断开方案

### 4.1 推荐方式：功能开关

新增配置：

```yaml
features:
  comment:
    enabled: false
```

实现策略：

- 给 `CommentController` 增加 `@ConditionalOnProperty(prefix = "features.comment", name = "enabled", havingValue = "true")`。
- 当开关关闭时，`/comments/**` 不注册 Controller。
- 新增统一兜底 Controller 或异常处理，针对 `/comments/**` 返回明确响应：
  - HTTP 状态：`410 Gone` 或 `503 Service Unavailable`。
  - 业务消息：`评论功能暂未开放`。
- 同步禁用评论点赞入口：
  - `/likes/comment/**`
  - `/likes/comments/batch-check`
- 通知模块暂停产生 `COMMENT`、`REPLY` 类型通知；历史通知可继续展示，或在列表中保留但不跳转评论详情。

### 4.2 不建议方式

- 不建议直接删除 `comment` 包、表、Mapper 或 SQL。
- 不建议只在前端隐藏评论入口，因为 API 仍可被直接调用。
- 不建议仅修改 SecurityConfig 拦截评论，因为返回语义不清晰，后续恢复也不方便。

### 4.3 受影响接口

| 模块 | 接口 | 处理方式 |
| --- | --- | --- |
| 评论 | `/comments/**` | 统一返回“评论功能暂未开放” |
| 评论点赞 | `/likes/comment/**` | 同步禁用 |
| 批量评论点赞检查 | `/likes/comments/batch-check` | 同步禁用 |
| 文章详情 | `commentCount` | 保留字段，前端可显示为 0 或隐藏 |
| 文章创建/更新 | `allowComment` | 默认置 0，暂不开放编辑入口 |
| 通知 | `COMMENT` / `REPLY` | 暂停新增，历史可读 |

## 5. 文章访问鉴权降级方案

### 5.1 公开访问范围

游客允许访问：

- `GET /posts`
- `GET /posts/{id}`
- `GET /posts/hot`
- `GET /posts/recommendations`
- `GET /categories`
- `GET /categories/tree`
- `GET /categories/{id}/posts`
- 必要时放行 `GET /files/{fileId}`，用于公开附件详情；文件真实访问优先使用 `fileUrl`。

游客不允许访问：

- 创建、更新、删除、发布文章。
- 查询草稿、审核中、删除态文章。
- 后台排序、推荐位配置。
- 文件上传、删除、关联操作。
- 通知私有接口。

### 5.2 SecurityConfig 调整建议

将文章公开读取按 HTTP Method 精确放行：

```java
.requestMatchers(HttpMethod.GET, "/posts", "/posts/**").permitAll()
.requestMatchers(HttpMethod.GET, "/categories", "/categories/**").permitAll()
.requestMatchers(HttpMethod.GET, "/files/{fileId}").permitAll() // 可选
```

保留写接口权限：

```java
.requestMatchers(HttpMethod.POST, "/posts").hasAuthority("post:create")
.requestMatchers(HttpMethod.PUT, "/posts/**").hasAnyAuthority("post:update", "post:publish")
.requestMatchers(HttpMethod.DELETE, "/posts/**").hasAuthority("post:delete")
```

同时继续保留方法级权限，形成“双层保护”：

- `@PreAuthorize("hasAuthority('post:create')")`
- `@PreAuthorize("hasAuthority('post:update') or hasRole('ADMIN')")`
- `@PreAuthorize("hasAuthority('post:publish')")`

### 5.3 Service 层强制公开规则

不能只依赖 SecurityConfig。`PostService` 必须区分公开查询与后台查询：

- 公开列表：强制 `status = 1`，按 `is_top desc`、`sort_order desc`、`published_at desc` 排序。
- 公开详情：只允许 `status = 1` 的文章；不存在或未发布统一返回 `POST_NOT_FOUND`，避免泄露草稿存在性。
- 后台列表：允许按 `status`、`categoryId`、`keyword`、`publishedAt` 查询。
- 后台详情：管理员/编辑/作者可预览草稿与审核中内容。

建议拆分接口：

| 场景 | 接口 | 权限 | 说明 |
| --- | --- | --- | --- |
| 公开文章列表 | `GET /posts` | 游客 | 默认仅发布态 |
| 公开文章详情 | `GET /posts/{id}` | 游客 | 仅发布态，自动增加阅读量 |
| 后台文章列表 | `GET /admin/posts` | 编辑/管理员 | 支持所有状态 |
| 后台文章详情 | `GET /admin/posts/{id}` | 作者/编辑/管理员 | 支持预览 |
| 创建文章 | `POST /posts` 或 `POST /admin/posts` | 编辑/管理员 | 建议后续迁移到 `/admin/posts` |
| 更新文章 | `PUT /posts/{id}` 或 `PUT /admin/posts/{id}` | 作者/编辑/管理员 | 保留兼容 |
| 发布文章 | `PUT /posts/{id}/publish` | 发布权限 | 保留兼容 |

## 6. 文章分类/栏目方案

### 6.1 政务栏目建议

可初始化以下一级栏目：

- 政务动态
- 通知公告
- 政策解读
- 信息公开
- 专题专栏
- 便民服务

如后续需要更强政务门户结构，可扩展二级栏目：

- 信息公开 / 机构职能
- 信息公开 / 财政预决算
- 政策解读 / 文字解读
- 政策解读 / 图文解读
- 专题专栏 / 重点工作

### 6.2 数据模型

复用现有表：

- `categories`
  - `parent_id`：父栏目。
  - `name`：栏目名称。
  - `slug`：前端路由友好标识。
  - `description`：栏目说明。
  - `icon`：栏目图标或政务风格图标名。
  - `sort_order`：栏目排序。
  - `post_count`：发布文章数。
  - `status`：启用状态。
- `post_categories`
  - 支持一篇文章绑定多个栏目。

建议补充约束与索引：

```sql
ALTER TABLE categories
  ADD INDEX idx_category_parent_status_sort (parent_id, status, sort_order);

ALTER TABLE post_categories
  ADD INDEX idx_pc_category_post (category_id, post_id);
```

### 6.3 创建/更新文章时的分类修正

必须先插入文章，再保存分类/标签关系：

1. `postMapper.insert(post)`。
2. 使用生成后的 `post.getId()` 保存 `post_categories`、`post_tags`。
3. 更新文章时先删除旧关系，再插入新关系。
4. 对 `categoryIds` 做存在性、启用状态校验。
5. 维护 `categories.post_count`，只统计 `status = 1` 的发布文章。

### 6.4 分类接口设计

公开接口：

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/categories` | 获取启用栏目列表，按 `sort_order asc` |
| GET | `/categories/tree` | 获取栏目树 |
| GET | `/categories/{id}` | 获取栏目详情 |
| GET | `/categories/{id}/posts` | 获取栏目下发布文章 |

后台接口：

| 方法 | 路径 | 权限 | 说明 |
| --- | --- | --- | --- |
| POST | `/admin/categories` | `category:create` | 新增栏目 |
| PUT | `/admin/categories/{id}` | `category:update` | 更新栏目 |
| DELETE | `/admin/categories/{id}` | `category:delete` | 禁用栏目，不物理删除 |
| PUT | `/admin/categories/sort` | `category:update` | 批量调整栏目排序 |

## 7. 热点文章与手动排序方案

### 7.1 热点排序目标

政务宣传网站的“热点”不应完全等同于用户互动热度，因为评论暂时关闭、点赞收藏可能不是核心指标。建议采用：

- 默认热度：阅读量 + 发布时间衰减 + 点赞/收藏轻权重。
- 人工干预：管理员可置顶、推荐、调整排序、设置有效期。
- 栏目维度：支持全站热点、栏目热点、首页推荐。

### 7.2 数据模型方案 A：轻量字段扩展

在 `posts` 表增加：

```sql
ALTER TABLE posts
  ADD COLUMN sort_order int NOT NULL DEFAULT 0 COMMENT '人工排序，越大越靠前',
  ADD COLUMN manual_weight int NOT NULL DEFAULT 0 COMMENT '人工热度权重',
  ADD COLUMN hot_score decimal(12,2) NOT NULL DEFAULT 0 COMMENT '计算热度分',
  ADD COLUMN hot_updated_at datetime NULL COMMENT '热度更新时间',
  ADD INDEX idx_post_public_sort (status, is_top, sort_order, published_at),
  ADD INDEX idx_post_hot (status, hot_score, published_at);
```

优点：实现快，改动小。  
缺点：难以支持多个运营场景，如首页轮播、栏目推荐、专题推荐。

### 7.3 数据模型方案 B：推荐位表（推荐）

新增 `post_recommendations` 表：

```sql
CREATE TABLE post_recommendations (
  id bigint NOT NULL AUTO_INCREMENT,
  scene varchar(50) NOT NULL COMMENT 'HOME_HOT, HOME_TOP, CATEGORY_HOT, CAROUSEL, SPECIAL',
  category_id bigint NULL COMMENT '栏目维度，NULL 表示全站',
  post_id bigint NOT NULL COMMENT '文章ID',
  sort_order int NOT NULL DEFAULT 0 COMMENT '越大越靠前',
  manual_weight int NOT NULL DEFAULT 0 COMMENT '人工权重',
  status tinyint NOT NULL DEFAULT 1 COMMENT '1=启用, 0=禁用',
  start_at datetime NULL COMMENT '推荐开始时间',
  end_at datetime NULL COMMENT '推荐结束时间',
  created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_scene_category_post (scene, category_id, post_id),
  KEY idx_scene_status_sort (scene, status, sort_order),
  KEY idx_post_id (post_id)
);
```

推荐采用方案 B，并保留 `posts.is_top` 作为文章自身置顶标记。

### 7.4 热度计算建议

初版热度公式：

```text
hotScore =
  viewCount * 1.0
  + likeCount * 5.0
  + favoriteCount * 8.0
  + manualWeight * 20.0
  + topBonus
  - ageHours * 0.5
```

说明：

- `topBonus`：`is_top = 1` 时增加固定分值，例如 1000。
- `ageHours`：从 `published_at` 到当前时间的小时数，避免旧文长期霸榜。
- 评论暂停后，暂不纳入 `commentCount`。
- 热度分可定时任务每 5 分钟或 15 分钟刷新，也可查询时实时计算；初期推荐定时刷新到 `posts.hot_score`。

### 7.5 公开接口

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/posts/hot` | 全站热点文章，默认 `size=10` |
| GET | `/posts/hot?categoryId=1` | 栏目热点文章 |
| GET | `/posts/recommendations?scene=HOME_TOP` | 指定推荐场景 |
| GET | `/categories/{id}/posts?sort=hot` | 栏目文章按热度排序 |

返回字段建议扩展：

- `isTop`
- `sortOrder`
- `hotScore`
- `categoryNames`
- `publishedAt`

### 7.6 管理员接口

| 方法 | 路径 | 权限 | 说明 |
| --- | --- | --- | --- |
| PUT | `/admin/posts/{id}/top` | `post:recommend` | 设置/取消置顶 |
| PUT | `/admin/posts/{id}/sort` | `post:recommend` | 设置文章人工排序 |
| POST | `/admin/post-recommendations` | `post:recommend` | 新增推荐位文章 |
| PUT | `/admin/post-recommendations/{id}` | `post:recommend` | 更新场景、排序、有效期 |
| PUT | `/admin/post-recommendations/reorder` | `post:recommend` | 批量拖拽排序 |
| DELETE | `/admin/post-recommendations/{id}` | `post:recommend` | 移除推荐位 |

## 8. 文件与通知模块适配

### 8.1 文件模块

保留现有文件 API 作为后台编辑能力：

- 上传：仍需登录，建议限制为编辑/管理员。
- 获取文件详情：可按需开放 `GET /files/{fileId}`，但公开文章中优先直接使用 `fileUrl`。
- 文件关联：继续支持文章封面、附件、富文本图片，`relatedType` 建议统一使用 `POST`、`CATEGORY`、`SYSTEM`。
- 安全建议：限制 MIME、大小、扩展名；政务网站附件建议支持 PDF、DOC/DOCX、XLS/XLSX、图片。

### 8.2 通知模块

保留通知 API，但定位为后台用户与系统消息：

- 普通游客无通知能力。
- 管理员可通过 `/notifications/system` 发送系统通知。
- 评论关闭期间暂停 COMMENT / REPLY 通知生产。
- 如果后续新增审核流，可增加 `POST_REVIEW`、`POST_PUBLISH` 类型。

## 9. 权限与角色建议

建议角色：

| 角色 | 说明 |
| --- | --- |
| `ROLE_ADMIN` | 系统管理员，管理栏目、用户、推荐位、全部文章 |
| `ROLE_EDITOR` | 内容编辑，创建/更新/发布文章，上传文件 |
| `ROLE_AUTHOR` | 作者，可创建草稿与编辑本人文章，是否可发布由权限控制 |
| 游客 | 仅访问公开文章、公开栏目、公开文件 |

建议新增/确认权限：

- `post:create`
- `post:update`
- `post:delete`
- `post:publish`
- `post:recommend`
- `category:create`
- `category:update`
- `category:delete`
- `file:upload`
- `notification:system`

## 10. 实施顺序

### 阶段一：公开访问与评论断开

1. 增加 `features.comment.enabled=false` 配置。
2. 条件化禁用 `CommentController` 与评论点赞接口。
3. 放行 `GET /posts`、`GET /posts/{id}`。
4. 在 Service 层强制游客只能访问 `status = 1`。
5. 修复文章创建时分类/标签保存顺序。

验收：

- 游客可访问发布文章列表与详情。
- 游客访问草稿文章返回不存在或无权限。
- `/comments/**` 返回明确“暂未开放”。
- 写文章接口仍需权限。

### 阶段二：栏目分类完善

1. 新增 Category Service / Controller。
2. 增加公开栏目树与栏目文章接口。
3. 增加后台栏目 CRUD 与排序接口。
4. 初始化政务栏目数据。
5. 更新文章创建/更新逻辑，正确维护分类关系与 `post_count`。

验收：

- 前端可获取栏目树。
- 可按栏目查询发布文章。
- 后台可调整栏目顺序。
- 文章分类关系保存正确。

### 阶段三：热点与推荐位

1. 新增 `post_recommendations` 表。
2. 增加热点计算任务或查询逻辑。
3. 增加 `/posts/hot` 与 `/posts/recommendations` 公开接口。
4. 增加后台推荐位 CRUD 与批量排序。
5. 对列表接口增加 `sort=latest|hot|manual`。

验收：

- 首页可获取热点文章。
- 管理员可手动置顶/推荐/拖拽排序。
- 人工推荐优先于自动热度。
- 过期推荐不再展示。

### 阶段四：后台接口规范化

1. 将后台文章接口逐步迁移到 `/admin/posts`。
2. 完善 OpenAPI 文档分组：公开接口、后台接口、系统接口。
3. 补充接口测试与权限测试。
4. 梳理错误码与响应语义。

验收：

- 公开接口与后台接口边界清晰。
- OpenAPI 文档可直接提供给前端联调。
- 关键接口有权限测试覆盖。

## 11. 推荐接口清单

### 公开接口

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/posts` | 发布文章列表 |
| GET | `/posts/{id}` | 发布文章详情 |
| GET | `/posts/hot` | 热点文章 |
| GET | `/posts/recommendations` | 推荐位文章 |
| GET | `/categories` | 栏目列表 |
| GET | `/categories/tree` | 栏目树 |
| GET | `/categories/{id}/posts` | 栏目文章 |
| GET | `/files/{fileId}` | 文件详情，可选公开 |

### 后台接口

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/admin/posts` | 后台文章列表 |
| GET | `/admin/posts/{id}` | 后台文章详情/预览 |
| POST | `/admin/posts` | 创建文章 |
| PUT | `/admin/posts/{id}` | 更新文章 |
| PUT | `/admin/posts/{id}/publish` | 发布文章 |
| DELETE | `/admin/posts/{id}` | 删除文章 |
| PUT | `/admin/posts/{id}/top` | 置顶文章 |
| POST | `/admin/categories` | 创建栏目 |
| PUT | `/admin/categories/{id}` | 更新栏目 |
| PUT | `/admin/categories/sort` | 栏目排序 |
| POST | `/admin/post-recommendations` | 新增推荐 |
| PUT | `/admin/post-recommendations/reorder` | 推荐排序 |

## 12. 数据迁移建议

### 12.1 默认关闭评论

```sql
UPDATE posts SET allow_comment = 0 WHERE allow_comment <> 0;
```

### 12.2 初始化政务栏目

```sql
INSERT INTO categories (parent_id, name, slug, description, sort_order, status)
VALUES
  (NULL, '政务动态', 'government-news', '政务动态与工作进展', 10, 1),
  (NULL, '通知公告', 'notices', '通知公告与公示信息', 20, 1),
  (NULL, '政策解读', 'policy-interpretation', '政策文件解读', 30, 1),
  (NULL, '信息公开', 'information-disclosure', '政府信息公开', 40, 1),
  (NULL, '专题专栏', 'special-topics', '专题宣传与重点工作', 50, 1),
  (NULL, '便民服务', 'public-services', '便民服务信息', 60, 1);
```

### 12.3 推荐位表

优先新增 `post_recommendations` 表；如排期紧张，可先采用 `posts.sort_order + posts.manual_weight + posts.hot_score` 轻量字段方案。

## 13. 风险与注意事项

- 放行文章详情后，必须在 Service 层校验发布态，不能只依赖 Controller。
- 评论 API 关闭时，评论点赞、评论通知也要同步关闭，否则会留下半开放入口。
- 文章创建分类关系保存顺序必须修复，否则栏目页数据会不完整。
- 手动排序需要明确“全站排序”和“栏目排序”边界，推荐位表可避免后续返工。
- 政务内容通常需要审核流程，如后续有需求，可在 `status=2 under_review` 基础上扩展审核记录表。
- 文件公开访问要注意附件权限，涉内部材料不能仅凭 URL 暴露。

## 14. 建议本轮最小交付

第一轮只做后端基础收口：

1. 评论功能开关关闭。
2. 游客可访问发布文章列表和详情。
3. 修复文章分类保存。
4. 新增栏目公开列表/树/栏目文章接口。
5. 新增热点文章公开接口，先按 `is_top desc, view_count desc, published_at desc` 实现。

第二轮再做推荐位表、后台拖拽排序、热度定时计算与完整 `/admin/**` 接口迁移。
