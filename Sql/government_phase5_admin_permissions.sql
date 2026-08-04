-- 政务宣传网站阶段五：补齐后台栏目管理权限
-- 说明：AdminCategoryController 使用 category:create / category:update / category:delete
-- 做方法级鉴权，但初始权限表中仅有 category:manage，导致管理员调用栏目管理接口被 403。
-- 本脚本新增三个权限并授予 ROLE_ADMIN。幂等，可重复执行。

INSERT INTO permissions (name, code, resource, action, description)
VALUES
  ('新增栏目', 'category:create', 'category', 'create', '创建栏目'),
  ('更新栏目', 'category:update', 'category', 'update', '更新栏目与排序'),
  ('禁用栏目', 'category:delete', 'category', 'delete', '禁用栏目')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  resource = VALUES(resource),
  action = VALUES(action),
  description = VALUES(description);

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
INNER JOIN permissions p ON p.code IN ('category:create', 'category:update', 'category:delete')
WHERE r.code = 'ROLE_ADMIN';
