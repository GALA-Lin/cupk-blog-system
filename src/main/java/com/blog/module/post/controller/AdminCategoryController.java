package com.blog.module.post.controller;

import com.blog.DTO.post.CategoryCreateDTO;
import com.blog.DTO.post.CategorySortDTO;
import com.blog.DTO.post.CategoryUpdateDTO;
import com.blog.VO.post.CategoryTreeVO;
import com.blog.common.Result;
import com.blog.module.post.service.CategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/admin/categories")
@RequiredArgsConstructor
@Tag(name = "后台栏目管理", description = "后台栏目分类管理接口")
public class AdminCategoryController {

    private final CategoryService categoryService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('category:update')")
    @Operation(summary = "获取后台栏目树")
    public Result<List<CategoryTreeVO>> getAdminCategoryTree() {
        return Result.success(categoryService.getAdminCategoryTree());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('category:create')")
    @Operation(summary = "创建栏目")
    public Result<CategoryTreeVO> createCategory(@Valid @RequestBody CategoryCreateDTO dto) {
        return Result.success("栏目创建成功", categoryService.createCategory(dto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('category:update')")
    @Operation(summary = "更新栏目")
    public Result<CategoryTreeVO> updateCategory(@PathVariable Long id,
                                                 @Valid @RequestBody CategoryUpdateDTO dto) {
        return Result.success("栏目更新成功", categoryService.updateCategory(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('category:delete')")
    @Operation(summary = "禁用栏目")
    public Result<Void> disableCategory(@PathVariable Long id) {
        categoryService.disableCategory(id);
        return Result.success("栏目已禁用");
    }

    @PutMapping("/sort")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('category:update')")
    @Operation(summary = "批量调整栏目排序")
    public Result<Void> updateCategorySort(@Valid @RequestBody CategorySortDTO dto) {
        categoryService.updateCategorySort(dto);
        return Result.success("栏目排序已更新");
    }
}
