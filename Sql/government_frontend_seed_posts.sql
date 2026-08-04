-- 政务宣传网站：前端演示文章数据
-- 说明：本脚本不会被项目自动执行，需要按环境手动导入。
--
-- 前置条件（请先执行）：
--   1. Sql/government_phase2_categories.sql（政务栏目）
--   2. Sql/government_phase3_hot_posts.sql（sort_order / manual_weight 字段）
--   3. users 表中存在至少一个有效用户（作者默认取第一个有效用户）
--
-- 重复执行是安全的（基于 slug 唯一键幂等更新）。

-- ---------------------------------------------------------------
-- 先解析作者 ID 到会话变量：
-- posts 表存在 AFTER INSERT 触发器（tr_post_after_insert，更新 users.post_count），
-- 若 INSERT 语句本身再读取 users 表，会报错：
--   Can't update table 'users' in stored function/trigger because it is
--   already used by statement which invoked this stored function/trigger.
-- 将 users 查询提前到独立的 SET 语句即可避免该冲突。
-- ---------------------------------------------------------------
SET @seed_author_id := (SELECT id FROM users WHERE status = 1 ORDER BY id LIMIT 1);

-- ---------------------------------------------------------------
-- 示例文章（发布态）
-- ---------------------------------------------------------------
INSERT INTO posts
  (user_id, title, slug, summary, content, content_type, status, is_top, sort_order, manual_weight,
   view_count, like_count, favorite_count, comment_count, allow_comment, published_at)
SELECT
  @seed_author_id,
  '学校召开2026年暑期社会实践工作部署会',
  'gov-demo-social-practice-deploy',
  '会议围绕实践主题、安全保障、组织动员等方面进行了全面部署，确保暑期社会实践安全有序开展。',
  '## 会议概况\n\n学校召开2026年暑期社会实践工作部署会，各学院学生工作负责人、实践团队指导教师参加会议。\n\n### 会议要求\n\n1. 提高思想认识，把社会实践作为立德树人的重要环节；\n2. 压实安全责任，落实行前培训与过程管理；\n3. 注重成果转化，做好总结表彰与宣传展示。',
  'MARKDOWN', 1, 1, 100, 20, 2386, 32, 15, 0, 0, '2026-07-30 10:20:00'
ON DUPLICATE KEY UPDATE
  title = VALUES(title), summary = VALUES(summary), content = VALUES(content),
  status = VALUES(status), is_top = VALUES(is_top), sort_order = VALUES(sort_order),
  manual_weight = VALUES(manual_weight), view_count = VALUES(view_count),
  like_count = VALUES(like_count), favorite_count = VALUES(favorite_count),
  allow_comment = 0, published_at = VALUES(published_at);

INSERT INTO posts
  (user_id, title, slug, summary, content, content_type, status, is_top, sort_order, manual_weight,
   view_count, like_count, favorite_count, comment_count, allow_comment, published_at)
SELECT
  @seed_author_id,
  '关于2026年大学生暑期社会实践报名工作的通知',
  'gov-demo-practice-register-notice',
  '现将2026年大学生暑期社会实践报名工作有关事项通知如下，请各学院做好组织动员。',
  '## 通知内容\n\n根据工作安排，现启动2026年大学生暑期社会实践报名工作。\n\n### 报名时间\n\n即日起至规定日期。\n\n### 报名方式\n\n- 以团队为单位在平台完成线上报名；\n- 提交实践计划书与安全责任书；\n- 经学院审核后统一报社会实践工作办公室备案。',
  'MARKDOWN', 1, 1, 90, 15, 3210, 18, 20, 0, 0, '2026-07-26 09:00:00'
ON DUPLICATE KEY UPDATE
  title = VALUES(title), summary = VALUES(summary), content = VALUES(content),
  status = VALUES(status), is_top = VALUES(is_top), sort_order = VALUES(sort_order),
  manual_weight = VALUES(manual_weight), view_count = VALUES(view_count),
  like_count = VALUES(like_count), favorite_count = VALUES(favorite_count),
  allow_comment = 0, published_at = VALUES(published_at);

INSERT INTO posts
  (user_id, title, slug, summary, content, content_type, status, is_top, sort_order, manual_weight,
   view_count, like_count, favorite_count, comment_count, allow_comment, published_at)
SELECT
  @seed_author_id,
  '实践归来话成长：优秀社会实践成果展示（第一期）',
  'gov-demo-practice-achievements-1',
  '本期展示三支优秀实践团队的调研成果与心得体会，一起听听他们的实践故事。',
  '## 成果展示\n\n实践归来话成长，本期展示三支优秀实践团队的调研成果。\n\n| 团队名称 | 实践地点 | 调研主题 |\n| ---- | ---- | ---- |\n| 油城星火实践团 | 克拉玛依区 | 能源产业转型升级 |\n| 青春筑梦实践团 | 独山子区 | 基层社区治理 |\n| 薪火相传实践团 | 白碱滩区 | 红色文化传承 |\n\n> 更多优秀成果将持续在专题专栏展示，欢迎关注。',
  'MARKDOWN', 1, 1, 80, 25, 1756, 41, 18, 0, 0, '2026-07-24 11:30:00'
ON DUPLICATE KEY UPDATE
  title = VALUES(title), summary = VALUES(summary), content = VALUES(content),
  status = VALUES(status), is_top = VALUES(is_top), sort_order = VALUES(sort_order),
  manual_weight = VALUES(manual_weight), view_count = VALUES(view_count),
  like_count = VALUES(like_count), favorite_count = VALUES(favorite_count),
  allow_comment = 0, published_at = VALUES(published_at);

INSERT INTO posts
  (user_id, title, slug, summary, content, content_type, status, is_top, sort_order, manual_weight,
   view_count, like_count, favorite_count, comment_count, allow_comment, published_at)
SELECT
  @seed_author_id,
  '我校社会实践团队走进社区开展便民志愿服务',
  'gov-demo-community-volunteer',
  '实践团队结合专业特长，为社区居民提供知识宣讲、便民维修等志愿服务，受到社区群众好评。',
  '## 活动纪实\n\n近日，我校社会实践团队走进社区，结合专业特长开展便民志愿服务。\n\n### 服务内容\n\n- 安全知识宣讲；\n- 家电义务维修；\n- 老年群体走访慰问。\n\n本次活动服务群众300余人次，受到社区群众一致好评。',
  'MARKDOWN', 1, 1, 70, 18, 1982, 27, 12, 0, 0, '2026-07-28 15:40:00'
ON DUPLICATE KEY UPDATE
  title = VALUES(title), summary = VALUES(summary), content = VALUES(content),
  status = VALUES(status), is_top = VALUES(is_top), sort_order = VALUES(sort_order),
  manual_weight = VALUES(manual_weight), view_count = VALUES(view_count),
  like_count = VALUES(like_count), favorite_count = VALUES(favorite_count),
  allow_comment = 0, published_at = VALUES(published_at);

INSERT INTO posts
  (user_id, title, slug, summary, content, content_type, status, is_top, sort_order, manual_weight,
   view_count, like_count, favorite_count, comment_count, allow_comment, published_at)
SELECT
  @seed_author_id,
  '《关于进一步加强大学生社会实践工作的实施方案》解读',
  'gov-demo-policy-implementation',
  '围绕方案的总体要求、重点任务和保障措施三个方面进行详细解读。',
  '## 政策解读\n\n《关于进一步加强大学生社会实践工作的实施方案》围绕以下方面作出安排。\n\n### 总体要求\n\n以立德树人为根本任务，引导学生在实践中受教育、长才干、作贡献。\n\n### 重点任务\n\n1. 完善课程化、项目化、基地化建设；\n2. 加强安全教育和过程管理；\n3. 健全考核评价与激励机制。',
  'MARKDOWN', 1, 0, 60, 10, 1502, 22, 9, 0, 0, '2026-07-22 14:00:00'
ON DUPLICATE KEY UPDATE
  title = VALUES(title), summary = VALUES(summary), content = VALUES(content),
  status = VALUES(status), is_top = VALUES(is_top), sort_order = VALUES(sort_order),
  manual_weight = VALUES(manual_weight), view_count = VALUES(view_count),
  like_count = VALUES(like_count), favorite_count = VALUES(favorite_count),
  allow_comment = 0, published_at = VALUES(published_at);

INSERT INTO posts
  (user_id, title, slug, summary, content, content_type, status, is_top, sort_order, manual_weight,
   view_count, like_count, favorite_count, comment_count, allow_comment, published_at)
SELECT
  @seed_author_id,
  '社会实践安全须知：这些事项要牢记',
  'gov-demo-practice-safety',
  '外出实践期间，安全始终是第一位的。请同学们认真阅读并遵守安全须知。',
  '## 安全须知\n\n外出实践期间请务必遵守以下安全要求。\n\n### 出行安全\n\n- 乘坐正规交通工具，系好安全带；\n- 不前往未开发的区域和危险水域；\n- 遵守交通法规，夜间尽量减少外出。\n\n### 应急联络\n\n实践期间如遇突发情况，请第一时间联系带队教师和学院值班人员。',
  'MARKDOWN', 1, 0, 50, 8, 2988, 35, 22, 0, 0, '2026-07-20 08:50:00'
ON DUPLICATE KEY UPDATE
  title = VALUES(title), summary = VALUES(summary), content = VALUES(content),
  status = VALUES(status), is_top = VALUES(is_top), sort_order = VALUES(sort_order),
  manual_weight = VALUES(manual_weight), view_count = VALUES(view_count),
  like_count = VALUES(like_count), favorite_count = VALUES(favorite_count),
  allow_comment = 0, published_at = VALUES(published_at);

INSERT INTO posts
  (user_id, title, slug, summary, content, content_type, status, is_top, sort_order, manual_weight,
   view_count, like_count, favorite_count, comment_count, allow_comment, published_at)
SELECT
  @seed_author_id,
  '社会实践优秀调研报告评选结果公示',
  'gov-demo-award-publicity',
  '经专家评审，共评选出一等奖3项、二等奖6项、三等奖10项，现予以公示。',
  '## 公示\n\n经专家评审，现将社会实践优秀调研报告评选结果予以公示。\n\n- 一等奖：3项；\n- 二等奖：6项；\n- 三等奖：10项。\n\n公示期为五个工作日，如有异议请以书面形式反馈。',
  'MARKDOWN', 1, 0, 40, 6, 2244, 29, 11, 0, 0, '2026-07-12 15:00:00'
ON DUPLICATE KEY UPDATE
  title = VALUES(title), summary = VALUES(summary), content = VALUES(content),
  status = VALUES(status), is_top = VALUES(is_top), sort_order = VALUES(sort_order),
  manual_weight = VALUES(manual_weight), view_count = VALUES(view_count),
  like_count = VALUES(like_count), favorite_count = VALUES(favorite_count),
  allow_comment = 0, published_at = VALUES(published_at);

INSERT INTO posts
  (user_id, title, slug, summary, content, content_type, status, is_top, sort_order, manual_weight,
   view_count, like_count, favorite_count, comment_count, allow_comment, published_at)
SELECT
  @seed_author_id,
  '暑期社会实践专项培训讲座预告',
  'gov-demo-training-lecture',
  '讲座围绕调研方法、报告撰写与影像记录开展，欢迎同学们报名参加。',
  '## 讲座预告\n\n为提升实践质量，将举办暑期社会实践专项培训讲座。\n\n### 培训内容\n\n1. 社会调查方法与数据分析；\n2. 调研报告撰写规范；\n3. 影像记录与成果呈现。\n\n请有意参加的同学关注后续报名通知。',
  'MARKDOWN', 1, 0, 30, 4, 1105, 12, 6, 0, 0, '2026-07-16 10:10:00'
ON DUPLICATE KEY UPDATE
  title = VALUES(title), summary = VALUES(summary), content = VALUES(content),
  status = VALUES(status), is_top = VALUES(is_top), sort_order = VALUES(sort_order),
  manual_weight = VALUES(manual_weight), view_count = VALUES(view_count),
  like_count = VALUES(like_count), favorite_count = VALUES(favorite_count),
  allow_comment = 0, published_at = VALUES(published_at);

INSERT INTO posts
  (user_id, title, slug, summary, content, content_type, status, is_top, sort_order, manual_weight,
   view_count, like_count, favorite_count, comment_count, allow_comment, published_at)
SELECT
  @seed_author_id,
  '“返家乡”社会实践岗位征集公告',
  'gov-demo-hometown-jobs',
  '现面向各地用人单位征集社会实践岗位，欢迎用人单位积极参与。',
  '## 岗位征集\n\n为丰富实践资源，现面向各地用人单位征集社会实践岗位。\n\n### 征集范围\n\n- 政务实践、企业实践、公益服务等各类岗位；\n- 要求岗位内容适合大学生参与，保障措施完善。',
  'MARKDOWN', 1, 0, 20, 5, 1560, 20, 14, 0, 0, '2026-07-14 09:30:00'
ON DUPLICATE KEY UPDATE
  title = VALUES(title), summary = VALUES(summary), content = VALUES(content),
  status = VALUES(status), is_top = VALUES(is_top), sort_order = VALUES(sort_order),
  manual_weight = VALUES(manual_weight), view_count = VALUES(view_count),
  like_count = VALUES(like_count), favorite_count = VALUES(favorite_count),
  allow_comment = 0, published_at = VALUES(published_at);

INSERT INTO posts
  (user_id, title, slug, summary, content, content_type, status, is_top, sort_order, manual_weight,
   view_count, like_count, favorite_count, comment_count, allow_comment, published_at)
SELECT
  @seed_author_id,
  '社会实践报告撰写规范与模板下载',
  'gov-demo-report-guide',
  '提供社会实践报告撰写规范及参考模板，供各实践团队下载使用。',
  '## 撰写规范\n\n社会实践报告应做到内容真实、结构完整、表达规范。\n\n### 结构要求\n\n1. 实践背景与目的；\n2. 实践过程与内容；\n3. 调研分析与数据；\n4. 总结与建议。\n\n### 格式要求\n\n- 字数不少于3000字；\n- 采用标准公文格式排版；\n- 附必要的图片与佐证材料。',
  'MARKDOWN', 1, 0, 10, 3, 3420, 24, 30, 0, 0, '2026-07-08 09:15:00'
ON DUPLICATE KEY UPDATE
  title = VALUES(title), summary = VALUES(summary), content = VALUES(content),
  status = VALUES(status), is_top = VALUES(is_top), sort_order = VALUES(sort_order),
  manual_weight = VALUES(manual_weight), view_count = VALUES(view_count),
  like_count = VALUES(like_count), favorite_count = VALUES(favorite_count),
  allow_comment = 0, published_at = VALUES(published_at);

-- ---------------------------------------------------------------
-- 文章-栏目关联（按 slug 查找，避免依赖自增 ID）
-- ---------------------------------------------------------------
INSERT IGNORE INTO post_categories (post_id, category_id)
SELECT p.id, c.id
FROM posts p
JOIN categories c ON c.slug = 'government-news'
WHERE p.slug = 'gov-demo-social-practice-deploy';

INSERT IGNORE INTO post_categories (post_id, category_id)
SELECT p.id, c.id
FROM posts p
JOIN categories c ON c.slug = 'notices'
WHERE p.slug = 'gov-demo-practice-register-notice';

INSERT IGNORE INTO post_categories (post_id, category_id)
SELECT p.id, c.id
FROM posts p
JOIN categories c ON c.slug = 'special-topics'
WHERE p.slug = 'gov-demo-practice-achievements-1';

INSERT IGNORE INTO post_categories (post_id, category_id)
SELECT p.id, c.id
FROM posts p
JOIN categories c ON c.slug = 'government-news'
WHERE p.slug = 'gov-demo-community-volunteer';

INSERT IGNORE INTO post_categories (post_id, category_id)
SELECT p.id, c.id
FROM posts p
JOIN categories c ON c.slug = 'public-services'
WHERE p.slug = 'gov-demo-community-volunteer';

INSERT IGNORE INTO post_categories (post_id, category_id)
SELECT p.id, c.id
FROM posts p
JOIN categories c ON c.slug = 'policy-interpretation'
WHERE p.slug = 'gov-demo-policy-implementation';

INSERT IGNORE INTO post_categories (post_id, category_id)
SELECT p.id, c.id
FROM posts p
JOIN categories c ON c.slug = 'public-services'
WHERE p.slug = 'gov-demo-practice-safety';

INSERT IGNORE INTO post_categories (post_id, category_id)
SELECT p.id, c.id
FROM posts p
JOIN categories c ON c.slug = 'information-disclosure'
WHERE p.slug = 'gov-demo-award-publicity';

INSERT IGNORE INTO post_categories (post_id, category_id)
SELECT p.id, c.id
FROM posts p
JOIN categories c ON c.slug = 'notices'
WHERE p.slug = 'gov-demo-training-lecture';

INSERT IGNORE INTO post_categories (post_id, category_id)
SELECT p.id, c.id
FROM posts p
JOIN categories c ON c.slug = 'special-topics'
WHERE p.slug = 'gov-demo-hometown-jobs';

INSERT IGNORE INTO post_categories (post_id, category_id)
SELECT p.id, c.id
FROM posts p
JOIN categories c ON c.slug = 'policy-interpretation'
WHERE p.slug = 'gov-demo-report-guide';

-- ---------------------------------------------------------------
-- 刷新栏目文章数
-- ---------------------------------------------------------------
UPDATE categories c
SET post_count = (
  SELECT COUNT(DISTINCT pc.post_id)
  FROM post_categories pc
  JOIN posts p ON p.id = pc.post_id
  WHERE pc.category_id = c.id AND p.status = 1
);
