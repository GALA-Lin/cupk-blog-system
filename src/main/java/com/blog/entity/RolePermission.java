package com.blog.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import com.blog.entity.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

/**
 * @Author: GALA_Lin
 * @Date: 2025-10-07-13:43
 * @Description:
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("role_permission")
public class RolePermission extends BaseEntity {

    private Long roleId;

    private Long permissionId;
    @TableField(exist = false)
    private LocalDateTime updatedAt;
}