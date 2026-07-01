package com.blog.DTO.post;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class CategorySortDTO {

    @Valid
    @NotEmpty(message = "排序列表不能为空")
    private List<CategorySortItemDTO> categories;

    @Data
    public static class CategorySortItemDTO {
        private Long id;

        private Long parentId;

        private Integer sortOrder;
    }
}
