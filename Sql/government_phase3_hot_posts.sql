-- 政务宣传网站阶段三：热点文章与管理员排序
-- 说明：本脚本不会被项目自动执行，需要按环境手动导入。

ALTER TABLE posts
  ADD COLUMN sort_order int NOT NULL DEFAULT 0 COMMENT '人工排序，越大越靠前' AFTER is_top,
  ADD COLUMN manual_weight int NOT NULL DEFAULT 0 COMMENT '人工热度权重，越大越靠前' AFTER sort_order;

ALTER TABLE posts
  ADD INDEX idx_post_public_sort (status, is_top, sort_order, published_at),
  ADD INDEX idx_post_hot_sort (status, is_top, sort_order, manual_weight, view_count, published_at);

INSERT INTO permissions (name, code, resource, action, description)
VALUES ('文章推荐排序', 'post:recommend', 'post', 'recommend', '管理热点文章、置顶与人工排序')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  resource = VALUES(resource),
  action = VALUES(action),
  description = VALUES(description);

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
INNER JOIN permissions p ON p.code = 'post:recommend'
WHERE r.code = 'ROLE_ADMIN'
ON DUPLICATE KEY UPDATE
  role_id = VALUES(role_id),
  permission_id = VALUES(permission_id);
