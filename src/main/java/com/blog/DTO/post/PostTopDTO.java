package com.blog.DTO.post;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PostTopDTO {

    @NotNull(message = "置顶状态不能为空")
    @Min(value = 0, message = "置顶状态只能为0或1")
    @Max(value = 1, message = "置顶状态只能为0或1")
    private Integer isTop;

    @Min(value = 0, message = "排序值不能小于0")
    private Integer sortOrder;
}
