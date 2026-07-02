package com.blog.DTO.post;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class PostBatchSortDTO {

    @Valid
    @NotEmpty(message = "排序文章列表不能为空")
    private List<PostSortItemDTO> posts;

    @Data
    public static class PostSortItemDTO {

        @NotNull(message = "文章ID不能为空")
        private Long id;

        @Min(value = 0, message = "排序值不能小于0")
        private Integer sortOrder;

        @Min(value = 0, message = "人工权重不能小于0")
        private Integer manualWeight;

        @Min(value = 0, message = "置顶状态只能为0或1")
        @Max(value = 1, message = "置顶状态只能为0或1")
        private Integer isTop;
    }
}
