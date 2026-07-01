package com.blog.DTO.post;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CategoryUpdateDTO {

    private Long parentId;

    @Size(max = 50, message = "分类名称长度不能超过50个字符")
    private String name;

    @Size(max = 50, message = "分类标识长度不能超过50个字符")
    private String slug;

    @Size(max = 200, message = "分类描述长度不能超过200个字符")
    private String description;

    @Size(max = 100, message = "图标长度不能超过100个字符")
    private String icon;

    private Integer sortOrder;

    private Integer status;
}
