package com.blog.VO.post;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class CategoryTreeVO {

    private Long id;

    private Long parentId;

    private String name;

    private String slug;

    private String description;

    private String icon;

    private Integer sortOrder;

    private Integer postCount;

    private Integer status;

    private List<CategoryTreeVO> children = new ArrayList<>();
}
