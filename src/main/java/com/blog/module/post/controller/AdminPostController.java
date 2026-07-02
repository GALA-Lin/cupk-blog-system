package com.blog.module.post.controller;

import com.blog.DTO.post.PostBatchSortDTO;
import com.blog.DTO.post.PostSortDTO;
import com.blog.DTO.post.PostTopDTO;
import com.blog.common.Result;
import com.blog.module.post.service.PostService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/posts")
@RequiredArgsConstructor
@Tag(name = "后台文章运营", description = "后台文章热点与排序接口")
public class AdminPostController {

    private final PostService postService;

    @PutMapping("/{id}/top")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('post:recommend')")
    @Operation(summary = "设置文章置顶")
    public Result<Void> updatePostTop(@PathVariable Long id,
                                      @Valid @RequestBody PostTopDTO dto) {
        postService.updatePostTop(id, dto);
        return Result.success("文章置顶状态已更新");
    }

    @PutMapping("/{id}/sort")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('post:recommend')")
    @Operation(summary = "设置文章人工排序")
    public Result<Void> updatePostSort(@PathVariable Long id,
                                       @Valid @RequestBody PostSortDTO dto) {
        postService.updatePostSort(id, dto);
        return Result.success("文章排序已更新");
    }

    @PutMapping("/reorder")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('post:recommend')")
    @Operation(summary = "批量调整文章排序")
    public Result<Void> batchUpdatePostSort(@Valid @RequestBody PostBatchSortDTO dto) {
        postService.batchUpdatePostSort(dto);
        return Result.success("文章排序已批量更新");
    }
}
