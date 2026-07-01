-- 政务宣传网站阶段二：栏目初始化脚本
-- 说明：本脚本不会被项目自动执行，需要按环境手动导入。

INSERT INTO categories (parent_id, name, slug, description, sort_order, status)
VALUES
  (NULL, '政务动态', 'government-news', '政务动态与工作进展', 10, 1),
  (NULL, '通知公告', 'notices', '通知公告与公示信息', 20, 1),
  (NULL, '政策解读', 'policy-interpretation', '政策文件解读', 30, 1),
  (NULL, '信息公开', 'information-disclosure', '政府信息公开', 40, 1),
  (NULL, '专题专栏', 'special-topics', '专题宣传与重点工作', 50, 1),
  (NULL, '便民服务', 'public-services', '便民服务信息', 60, 1)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  sort_order = VALUES(sort_order),
  status = VALUES(status);

-- 可选索引：如当前库已存在同名索引，请跳过对应 ALTER。
-- ALTER TABLE categories ADD INDEX idx_category_parent_status_sort (parent_id, status, sort_order);
-- ALTER TABLE post_categories ADD INDEX idx_pc_category_post (category_id, post_id);
