package com.blog.module.post.service;

import com.blog.DTO.post.CategoryCreateDTO;
import com.blog.DTO.post.CategorySortDTO;
import com.blog.DTO.post.CategoryUpdateDTO;
import com.blog.VO.post.CategorySimpleVO;
import com.blog.VO.post.CategoryTreeVO;
import com.blog.VO.post.PostListVO;
import com.blog.common.PageResult;

import java.util.List;

public interface CategoryService {

    List<CategorySimpleVO> getActiveCategories();

    List<CategoryTreeVO> getActiveCategoryTree();

    CategoryTreeVO getActiveCategoryDetail(Long id);

    PageResult<PostListVO> getCategoryPosts(Long categoryId, Integer page, Integer size, String sort);

    List<CategoryTreeVO> getAdminCategoryTree();

    CategoryTreeVO createCategory(CategoryCreateDTO dto);

    CategoryTreeVO updateCategory(Long id, CategoryUpdateDTO dto);

    void disableCategory(Long id);

    void updateCategorySort(CategorySortDTO dto);
}
