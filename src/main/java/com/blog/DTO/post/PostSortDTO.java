package com.blog.DTO.post;

import jakarta.validation.constraints.Min;
import lombok.Data;

@Data
public class PostSortDTO {

    @Min(value = 0, message = "排序值不能小于0")
    private Integer sortOrder;

    @Min(value = 0, message = "人工权重不能小于0")
    private Integer manualWeight;
}
