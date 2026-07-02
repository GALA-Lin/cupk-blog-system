package com.blog.module.post.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.blog.DTO.post.CategoryCreateDTO;
import com.blog.DTO.post.CategorySortDTO;
import com.blog.DTO.post.CategoryUpdateDTO;
import com.blog.VO.post.CategorySimpleVO;
import com.blog.VO.post.CategoryTreeVO;
import com.blog.VO.post.PostListVO;
import com.blog.common.BusinessException;
import com.blog.common.PageResult;
import com.blog.common.ResultCode;
import com.blog.entity.Category;
import com.blog.entity.Post;
import com.blog.entity.PostCategory;
import com.blog.entity.User;
import com.blog.module.auth.mapper.UserMapper;
import com.blog.module.post.mapper.CategoryMapper;
import com.blog.module.post.mapper.PostCategoryMapper;
import com.blog.module.post.mapper.PostMapper;
import com.blog.module.post.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

    private final CategoryMapper categoryMapper;
    private final PostCategoryMapper postCategoryMapper;
    private final PostMapper postMapper;
    private final UserMapper userMapper;

    @Override
    public List<CategorySimpleVO> getActiveCategories() {
        return selectCategories(true).stream()
                .map(this::toSimpleVO)
                .toList();
    }

    @Override
    public List<CategoryTreeVO> getActiveCategoryTree() {
        return buildTree(selectCategories(true));
    }

    @Override
    public CategoryTreeVO getActiveCategoryDetail(Long id) {
        Category category = getCategoryOrThrow(id);
        if (!Integer.valueOf(1).equals(category.getStatus())) {
            throw new BusinessException(ResultCode.RESOURCE_NOT_FOUND);
        }
        return toTreeVO(category);
    }

    @Override
    public PageResult<PostListVO> getCategoryPosts(Long categoryId, Integer page, Integer size, String sort) {
        Category category = getCategoryOrThrow(categoryId);
        if (!Integer.valueOf(1).equals(category.getStatus())) {
            throw new BusinessException(ResultCode.RESOURCE_NOT_FOUND);
        }

        List<Long> categoryIds = getActiveCategoryAndDescendantIds(categoryId);
        List<PostCategory> postCategories = postCategoryMapper.selectList(new LambdaQueryWrapper<PostCategory>()
                .in(PostCategory::getCategoryId, categoryIds));
        List<Long> postIds = postCategories.stream()
                .map(PostCategory::getPostId)
                .filter(id -> id != null)
                .distinct()
                .toList();

        if (postIds.isEmpty()) {
            return PageResult.empty(page, size);
        }

        LambdaQueryWrapper<Post> wrapper = new LambdaQueryWrapper<>();
        wrapper.in(Post::getId, postIds)
                .eq(Post::getStatus, 1);
        applyPostSort(wrapper, sort);

        Page<Post> pageResult = postMapper.selectPage(new Page<>(page, size), wrapper);
        List<PostListVO> records = pageResult.getRecords().stream()
                .map(this::toPostListVO)
                .toList();
        return PageResult.of(pageResult.getTotal(), pageResult.getSize(), pageResult.getCurrent(), records);
    }

    @Override
    public List<CategoryTreeVO> getAdminCategoryTree() {
        return buildTree(selectCategories(false));
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public CategoryTreeVO createCategory(CategoryCreateDTO dto) {
        validateParent(dto.getParentId(), null);
        validateSlug(dto.getSlug(), null);

        Category category = new Category();
        category.setParentId(dto.getParentId());
        category.setName(dto.getName());
        category.setSlug(dto.getSlug());
        category.setDescription(dto.getDescription());
        category.setIcon(dto.getIcon());
        category.setSortOrder(dto.getSortOrder() == null ? 0 : dto.getSortOrder());
        category.setPostCount(0);
        category.setStatus(dto.getStatus() == null ? 1 : dto.getStatus());
        categoryMapper.insert(category);
        return toTreeVO(category);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public CategoryTreeVO updateCategory(Long id, CategoryUpdateDTO dto) {
        Category category = getCategoryOrThrow(id);

        if (dto.getParentId() != null) {
            validateParent(dto.getParentId(), id);
            category.setParentId(dto.getParentId());
        }
        if (StringUtils.hasText(dto.getName())) {
            category.setName(dto.getName());
        }
        if (StringUtils.hasText(dto.getSlug())) {
            validateSlug(dto.getSlug(), id);
            category.setSlug(dto.getSlug());
        }
        if (dto.getDescription() != null) {
            category.setDescription(dto.getDescription());
        }
        if (dto.getIcon() != null) {
            category.setIcon(dto.getIcon());
        }
        if (dto.getSortOrder() != null) {
            category.setSortOrder(dto.getSortOrder());
        }
        if (dto.getStatus() != null) {
            category.setStatus(dto.getStatus());
        }

        categoryMapper.updateById(category);
        categoryMapper.refreshPostCount(id);
        return toTreeVO(categoryMapper.selectById(id));
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void disableCategory(Long id) {
        Category category = getCategoryOrThrow(id);
        category.setStatus(0);
        categoryMapper.updateById(category);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateCategorySort(CategorySortDTO dto) {
        for (CategorySortDTO.CategorySortItemDTO item : dto.getCategories()) {
            if (item.getId() == null) {
                throw new BusinessException(ResultCode.PARAM_ERROR, "分类ID不能为空");
            }
            Category category = getCategoryOrThrow(item.getId());
            if (item.getParentId() != null) {
                validateParent(item.getParentId(), item.getId());
                category.setParentId(item.getParentId());
            }
            if (item.getSortOrder() != null) {
                category.setSortOrder(item.getSortOrder());
            }
            categoryMapper.updateById(category);
        }
    }

    private List<Category> selectCategories(boolean onlyActive) {
        LambdaQueryWrapper<Category> wrapper = new LambdaQueryWrapper<>();
        if (onlyActive) {
            wrapper.eq(Category::getStatus, 1);
        }
        wrapper.orderByAsc(Category::getSortOrder)
                .orderByAsc(Category::getId);
        return categoryMapper.selectList(wrapper);
    }

    private Category getCategoryOrThrow(Long id) {
        if (id == null) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "分类ID不能为空");
        }
        Category category = categoryMapper.selectById(id);
        if (category == null) {
            throw new BusinessException(ResultCode.RESOURCE_NOT_FOUND);
        }
        return category;
    }

    private void validateParent(Long parentId, Long currentId) {
        if (parentId == null) {
            return;
        }
        Category parent = categoryMapper.selectById(parentId);
        if (parent == null) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "父分类不存在");
        }
        if (parentId.equals(currentId)) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "父分类不能设置为自身");
        }
        if (currentId != null && getDescendantIds(currentId, false).contains(parentId)) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "父分类不能设置为自身子分类");
        }
    }

    private void validateSlug(String slug, Long currentId) {
        if (!StringUtils.hasText(slug)) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "分类标识不能为空");
        }
        LambdaQueryWrapper<Category> wrapper = new LambdaQueryWrapper<Category>()
                .eq(Category::getSlug, slug);
        if (currentId != null) {
            wrapper.ne(Category::getId, currentId);
        }
        if (categoryMapper.selectCount(wrapper) > 0) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "分类标识已存在");
        }
    }

    private List<CategoryTreeVO> buildTree(List<Category> categories) {
        Map<Long, CategoryTreeVO> categoryMap = new LinkedHashMap<>();
        for (Category category : categories) {
            categoryMap.put(category.getId(), toTreeVO(category));
        }

        List<CategoryTreeVO> roots = new ArrayList<>();
        for (CategoryTreeVO category : categoryMap.values()) {
            if (category.getParentId() != null && categoryMap.containsKey(category.getParentId())) {
                categoryMap.get(category.getParentId()).getChildren().add(category);
            } else {
                roots.add(category);
            }
        }
        return roots;
    }

    private CategorySimpleVO toSimpleVO(Category category) {
        CategorySimpleVO vo = new CategorySimpleVO();
        BeanUtils.copyProperties(category, vo);
        return vo;
    }

    private CategoryTreeVO toTreeVO(Category category) {
        CategoryTreeVO vo = new CategoryTreeVO();
        BeanUtils.copyProperties(category, vo);
        return vo;
    }

    private PostListVO toPostListVO(Post post) {
        PostListVO vo = new PostListVO();
        BeanUtils.copyProperties(post, vo);
        vo.setHotScore(calculateHotScore(post));
        User author = userMapper.selectById(post.getUserId());
        if (author != null) {
            vo.setAuthorName(author.getNickname() != null ? author.getNickname() : author.getUsername());
            vo.setAuthorAvatar(author.getAvatarUrl());
        }
        return vo;
    }

    private Double calculateHotScore(Post post) {
        long viewCount = post.getViewCount() == null ? 0L : post.getViewCount();
        int likeCount = post.getLikeCount() == null ? 0 : post.getLikeCount();
        int favoriteCount = post.getFavoriteCount() == null ? 0 : post.getFavoriteCount();
        int manualWeight = post.getManualWeight() == null ? 0 : post.getManualWeight();
        int topBonus = Integer.valueOf(1).equals(post.getIsTop()) ? 1000 : 0;
        return viewCount + likeCount * 5.0 + favoriteCount * 8.0 + manualWeight * 20.0 + topBonus;
    }

    private void applyPostSort(LambdaQueryWrapper<Post> wrapper, String sort) {
        if ("hot".equalsIgnoreCase(sort)) {
            wrapper.orderByDesc(Post::getIsTop)
                    .orderByDesc(Post::getSortOrder)
                    .orderByDesc(Post::getManualWeight)
                    .orderByDesc(Post::getViewCount)
                    .orderByDesc(Post::getFavoriteCount)
                    .orderByDesc(Post::getLikeCount)
                    .orderByDesc(Post::getPublishedAt);
            return;
        }
        wrapper.orderByDesc(Post::getIsTop)
                .orderByDesc(Post::getSortOrder)
                .orderByDesc(Post::getPublishedAt);
    }

    private List<Long> getActiveCategoryAndDescendantIds(Long categoryId) {
        List<Long> ids = new ArrayList<>();
        ids.add(categoryId);
        ids.addAll(getDescendantIds(categoryId, true));
        return ids;
    }

    private List<Long> getDescendantIds(Long categoryId, boolean onlyActive) {
        List<Category> categories = selectCategories(onlyActive);
        Map<Long, List<Long>> childrenMap = new LinkedHashMap<>();
        for (Category category : categories) {
            if (category.getParentId() != null) {
                childrenMap.computeIfAbsent(category.getParentId(), key -> new ArrayList<>()).add(category.getId());
            }
        }

        List<Long> descendants = new ArrayList<>();
        collectDescendantIds(categoryId, childrenMap, descendants, new HashSet<>());
        return descendants;
    }

    private void collectDescendantIds(Long categoryId,
                                      Map<Long, List<Long>> childrenMap,
                                      List<Long> descendants,
                                      Set<Long> visited) {
        if (!visited.add(categoryId)) {
            return;
        }
        List<Long> children = childrenMap.get(categoryId);
        if (children == null) {
            return;
        }
        for (Long childId : children) {
            descendants.add(childId);
            collectDescendantIds(childId, childrenMap, descendants, visited);
        }
    }
}
