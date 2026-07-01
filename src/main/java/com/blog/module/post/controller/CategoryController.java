package com.blog.module.post.controller;

import com.blog.VO.post.CategorySimpleVO;
import com.blog.VO.post.CategoryTreeVO;
import com.blog.VO.post.PostListVO;
import com.blog.common.PageResult;
import com.blog.common.Result;
import com.blog.module.post.service.CategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/categories")
@RequiredArgsConstructor
@Tag(name = "栏目分类", description = "公开栏目分类接口")
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    @Operation(summary = "获取启用栏目列表")
    public Result<List<CategorySimpleVO>> getCategories() {
        return Result.success(categoryService.getActiveCategories());
    }

    @GetMapping("/tree")
    @Operation(summary = "获取启用栏目树")
    public Result<List<CategoryTreeVO>> getCategoryTree() {
        return Result.success(categoryService.getActiveCategoryTree());
    }

    @GetMapping("/{id}")
    @Operation(summary = "获取栏目详情")
    public Result<CategoryTreeVO> getCategoryDetail(@PathVariable Long id) {
        return Result.success(categoryService.getActiveCategoryDetail(id));
    }

    @GetMapping("/{id}/posts")
    @Operation(summary = "获取栏目文章")
    public Result<PageResult<PostListVO>> getCategoryPosts(
            @PathVariable Long id,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(defaultValue = "latest") String sort) {
        return Result.success(categoryService.getCategoryPosts(id, page, size, sort));
    }
}
