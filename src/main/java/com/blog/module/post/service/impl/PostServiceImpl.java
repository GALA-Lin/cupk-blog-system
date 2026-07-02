package com.blog.module.post.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.blog.DTO.post.PostBatchSortDTO;
import com.blog.DTO.post.PostCreateDTO;
import com.blog.DTO.post.PostSortDTO;
import com.blog.DTO.post.PostTopDTO;
import com.blog.DTO.post.PostUpdateDTO;
import com.blog.VO.post.CategoryVO;
import com.blog.VO.post.PostDetailVO;
import com.blog.VO.post.PostListVO;
import com.blog.VO.post.TagVO;
import com.blog.entity.*;

import com.blog.common.BusinessException;
import com.blog.common.PageResult;
import com.blog.common.ResultCode;
import com.blog.module.auth.mapper.UserMapper;
import com.blog.module.post.mapper.*;
import com.blog.module.post.service.PostService;
import com.blog.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * @Author: GALA_Lin
 * @Date: 2025-10-08-13:42
 * @Description:
 */
@Service
@RequiredArgsConstructor
public class PostServiceImpl implements PostService {

    private final PostMapper postMapper;
    private final PostCategoryMapper postCategoryMapper;
    private final PostTagMapper postTagMapper;
    private final UserMapper userMapper;
    private final TagMapper tagMapper;
    private final CategoryMapper categoryMapper;
    /**
     * 创建文章
     * @param dto 文章创建DTO
     * @return id 文章ID
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long createPost(PostCreateDTO dto) {
        // 校验用户是否登录
        Long userId = SecurityUtil.getCurrentUserId();
        if (userId == null) {
            throw new BusinessException(ResultCode.UNAUTHORIZED);
        }
        Post post = new Post();
        post.setUserId(userId);
        post.setTitle(dto.getTitle());
        post.setSummary(dto.getSummary());
        post.setContent(dto.getContent());
        post.setCoverImage(dto.getCoverImage());
        post.setStatus(dto.getStatus());
        post.setContentType("MARKDOWN");
        post.setSlug(generateSlug(dto.getTitle()));// 从标题生成 slug（URL 友好型字符串 / URL 别名）
        post.setIsTop(0);
        post.setSortOrder(0);
        post.setManualWeight(0);

        // 设置发布时间
        if (dto.getStatus() == 1){
            post.setPublishedAt(LocalDateTime.now());
        }
        postMapper.insert(post);

        // 处理分类与标签
        List<Long> categoryIds = distinctIds(dto.getCategoryIds());
        replaceCategoriesForPost(post.getId(), categoryIds);
        replaceTagsForPost(post.getId(), dto.getTagIds());
        refreshCategoryPostCounts(categoryIds);

        return post.getId();
    }
    private String generateSlug(String title) {
        // 保留中文、字母、数字、横线、下划线，其他字符替换为横线
        String processed = title.replaceAll("[^\\u4e00-\\u9fa5a-zA-Z0-9_-]", "-")
                // 多个横线合并为一个
                .replaceAll("-+", "-")
                // 移除首尾横线
                .replaceAll("^-|-$", "");

        // 安全截取（避免过长，比如最多100个字符）
        int maxLength = Math.min(processed.length(), 50);
        String baseSlug = processed.substring(0, maxLength);

        // 确保唯一性（和之前逻辑一致）
        return ensureUniqueSlug(baseSlug);
    }
    private String ensureUniqueSlug(String baseSlug) {
        if (!postMapper.existsBySlug(baseSlug)) {
            return baseSlug;
        }
        // 重复时追加时间戳或随机数（示例用时间戳，避免并发冲突）
        long timestamp = System.currentTimeMillis() / 1000; // 秒级时间戳
        return baseSlug + "-" + timestamp;
    }
    private void saveCategoriesForPost(Long postId, List<Long> categoryIds) {
        if (categoryIds == null || categoryIds.isEmpty()) {
            return;
        }
        for (Long categoryId : categoryIds) {
            validateCategory(categoryId);
            PostCategory postCategory = new PostCategory();
            postCategory.setPostId(postId);
            postCategory.setCategoryId(categoryId);
            postCategoryMapper.insert(postCategory);
        }
    }

    // 辅助方法：保存文章标签关联
    private void saveTagsForPost(Long postId, List<Long> tagIds) {
        if (tagIds == null || tagIds.isEmpty()) {
            return;
        }
        for (Long tagId : tagIds) {
            validateTag(tagId);
            PostTag postTag = new PostTag();
            postTag.setPostId(postId);
            postTag.setTagId(tagId);
            postTagMapper.insert(postTag);
        }
    }

    private void replaceCategoriesForPost(Long postId, List<Long> categoryIds) {
        postCategoryMapper.delete(new LambdaQueryWrapper<PostCategory>()
                .eq(PostCategory::getPostId, postId));
        saveCategoriesForPost(postId, distinctIds(categoryIds));
    }

    private void replaceTagsForPost(Long postId, List<Long> tagIds) {
        postTagMapper.delete(new LambdaQueryWrapper<PostTag>()
                .eq(PostTag::getPostId, postId));
        saveTagsForPost(postId, distinctIds(tagIds));
    }

    private List<Long> distinctIds(List<Long> ids) {
        if (ids == null) {
            return List.of();
        }
        return ids.stream()
                .filter(id -> id != null)
                .distinct()
                .toList();
    }

    private void validateCategory(Long categoryId) {
        Category category = categoryMapper.selectById(categoryId);
        if (category == null || category.getStatus() == null || category.getStatus() != 1) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "分类不存在或已禁用");
        }
    }

    private void validateTag(Long tagId) {
        Tag tag = tagMapper.selectById(tagId);
        if (tag == null) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "标签不存在");
        }
    }

    private List<Long> loadCategoryIdsForPost(Long postId) {
        return postCategoryMapper.selectList(new LambdaQueryWrapper<PostCategory>()
                        .eq(PostCategory::getPostId, postId))
                .stream()
                .map(PostCategory::getCategoryId)
                .filter(id -> id != null)
                .distinct()
                .toList();
    }

    private List<Long> mergeCategoryIds(List<Long> oldCategoryIds, List<Long> newCategoryIds) {
        Set<Long> ids = new LinkedHashSet<>();
        if (oldCategoryIds != null) {
            ids.addAll(oldCategoryIds);
        }
        if (newCategoryIds != null) {
            ids.addAll(newCategoryIds);
        }
        return new ArrayList<>(ids);
    }

    private void refreshCategoryPostCounts(List<Long> categoryIds) {
        if (categoryIds == null || categoryIds.isEmpty()) {
            return;
        }
        for (Long categoryId : categoryIds) {
            categoryMapper.refreshPostCount(categoryId);
        }
    }

    /**
     * 获取文章详情
     * @param id 文章ID
     * @return 文章详情VO
     */
    @Override
    public PostDetailVO getPostById(Long id) {
        Post post = postMapper.selectById(id);
        if (post == null) {
            throw new BusinessException(ResultCode.POST_NOT_FOUND);
        }
        if (!Integer.valueOf(1).equals(post.getStatus()) && !canAccessUnpublishedPost(post)) {
            throw new BusinessException(ResultCode.POST_NOT_FOUND);
        }
        // 加载文章信息
        PostDetailVO vo = new PostDetailVO();
        BeanUtils.copyProperties(post, vo);
        // 加载作者信息
        User author = userMapper.selectById(post.getUserId());
        if (author != null){
            vo.setAuthorName(author.getNickname() != null ? author.getNickname() : author.getUsername());
            vo.setAuthorAvatar(author.getAvatarUrl());
        }
        // 加载分类
        List<CategoryVO> categories = loadCategoriesForPost(id);
        vo.setCategories(categories);
        // 加载标签
        List<TagVO> tags = loadTagsForPost(id);
        vo.setTags(tags);
        return vo;
    }

    private List<CategoryVO> loadCategoriesForPost(Long postId) {

        LambdaQueryWrapper<PostCategory> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(PostCategory::getPostId, postId);
        List<PostCategory> postCategories = postCategoryMapper.selectList(wrapper);

        List<CategoryVO> categoryVOs = new ArrayList<>();
        for (PostCategory pc : postCategories) {
            Category category = categoryMapper.selectById(pc.getCategoryId());
            if (category != null) {
                CategoryVO vo = new CategoryVO();
                vo.setId(category.getId());
                vo.setName(category.getName());
                vo.setSlug(category.getSlug());
                categoryVOs.add(vo);
            }
        }
        return categoryVOs;
    }
    private List<TagVO> loadTagsForPost(Long postId) {
        LambdaQueryWrapper<PostTag> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(PostTag::getPostId, postId);
        List<PostTag> postTags = postTagMapper.selectList(wrapper);

        List<TagVO> tagVOs = new ArrayList<>();
        for (PostTag pt : postTags) {
            Tag tag = tagMapper.selectById(pt.getTagId());
            if (tag != null) {
                TagVO vo = new TagVO();
                vo.setId(tag.getId());
                vo.setName(tag.getName());
                vo.setSlug(tag.getSlug());
                tagVOs.add(vo);
            }
        }
        return tagVOs;
    }


    /**
     * 获取文章列表
     * @param page 页码
     * @param size 每页大小
     * @param status 文章状态
     * @return 文章列表分页
     */
    @Override
    public PageResult<PostListVO> getPostList(Integer page, Integer size, Integer status) {
        // 创建查询条件
        LambdaQueryWrapper<Post> wrapper = new LambdaQueryWrapper<>();
        if (!canManagePosts()) {
            wrapper.eq(Post::getStatus, 1);
        } else if (status != null) {
            wrapper.eq(Post::getStatus, status);
        }
        applyDefaultSort(wrapper);
        // 分页查询文章列表
        Page<Post> pageParam = new Page<>(page, size);
        Page<Post> pageResult = postMapper.selectPage(pageParam, wrapper);

        // 转换成 VO 并返回
        List<PostListVO> voList = pageResult.getRecords().stream()
                .map(this::toPostListVO)
                .toList();

        return PageResult.of(pageResult.getTotal(), pageResult.getSize(), pageResult.getCurrent(), voList);
    }

    @Override
    public PageResult<PostListVO> getHotPosts(Integer page, Integer size, Long categoryId) {
        LambdaQueryWrapper<Post> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Post::getStatus, 1);

        if (categoryId != null) {
            List<Long> categoryIds = getActiveCategoryAndDescendantIds(categoryId);
            List<Long> postIds = postCategoryMapper.selectList(new LambdaQueryWrapper<PostCategory>()
                            .in(PostCategory::getCategoryId, categoryIds))
                    .stream()
                    .map(PostCategory::getPostId)
                    .filter(id -> id != null)
                    .distinct()
                    .toList();

            if (postIds.isEmpty()) {
                return PageResult.empty(page, size);
            }
            wrapper.in(Post::getId, postIds);
        }

        applyHotSort(wrapper);
        Page<Post> pageResult = postMapper.selectPage(new Page<>(page, size), wrapper);
        List<PostListVO> voList = pageResult.getRecords().stream()
                .map(this::toPostListVO)
                .toList();
        return PageResult.of(pageResult.getTotal(), pageResult.getSize(), pageResult.getCurrent(), voList);
    }

    /**
     * 更新文章
     * @param dto 文章更新DTO
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updatePost(PostUpdateDTO dto) {
        // 校验文章是否存在
        Post post = postMapper.selectById(dto.getId());
        if (post == null) {
            throw new BusinessException(ResultCode.POST_NOT_FOUND);
        }
        List<Long> oldCategoryIds = loadCategoryIdsForPost(post.getId());
        List<Long> newCategoryIds = dto.getCategoryIds() != null
                ? distinctIds(dto.getCategoryIds())
                : oldCategoryIds;
        // 校验用户是否有权限修改
        Long currentUserId = SecurityUtil.getCurrentUserId();
        if (!post.getUserId().equals(currentUserId) &&
                !SecurityUtil.hasRole("ROLE_ADMIN")) {
            throw new BusinessException(ResultCode.FORBIDDEN);
        }
        // 更新文章
        if (dto.getTitle() != null) {
            post.setTitle(dto.getTitle());
            post.setSlug(generateSlug(dto.getTitle()));
        }
        if (dto.getSummary() != null) {
            post.setSummary(dto.getSummary());
        }
        if (dto.getContent() != null) {
            post.setContent(dto.getContent());
        }
        if (dto.getCoverImage() != null) {
            post.setCoverImage(dto.getCoverImage());
        }
        if (dto.getStatus() != null) {
            if (dto.getStatus() == 1 && !Integer.valueOf(1).equals(post.getStatus())) {
                post.setPublishedAt(LocalDateTime.now());
            }
            post.setStatus(dto.getStatus());
        }
        postMapper.updateById(post);

        if (dto.getCategoryIds() != null) {
            replaceCategoriesForPost(post.getId(), newCategoryIds);
        }
        if (dto.getTagIds() != null) {
            replaceTagsForPost(post.getId(), dto.getTagIds());
        }
        refreshCategoryPostCounts(mergeCategoryIds(oldCategoryIds, newCategoryIds));
    }

    /**
     * 删除文章
     * @param id 文章ID
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deletePost(Long id) {
        // 检查文章是否存在
        Post post = postMapper.selectById(id);
        if (post == null) {
            throw new BusinessException(ResultCode.POST_NOT_FOUND);
        }
        List<Long> categoryIds = loadCategoryIdsForPost(id);

        // 校验用户是否有权限删除
        Long currentUserId = SecurityUtil.getCurrentUserId();
        if (!post.getUserId().equals(currentUserId) &&
                !SecurityUtil.hasRole("ROLE_ADMIN")) {
            throw new BusinessException(ResultCode.FORBIDDEN);
        }

        // 软删除文章：将状态设置为 -1
        post.setStatus(-1);
        postMapper.updateById(post);
        refreshCategoryPostCounts(categoryIds);
    }

    /**
     * 发布文章
     * @param id 文章ID
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public void publishPost(Long id) {
        Post post = postMapper.selectById(id);
        // 校验文章是否存在
        if (post == null) {
            throw new BusinessException(ResultCode.POST_NOT_FOUND);
        }
        List<Long> categoryIds = loadCategoryIdsForPost(id);
        // 校验用户是否有权限发布
        Long currentUserId = SecurityUtil.getCurrentUserId();
        if (!post.getUserId().equals(currentUserId)) {
            throw new BusinessException(ResultCode.FORBIDDEN);
        }
        // 发布文章：将状态设置为 1，设置发布时间
        post.setStatus(1);
        post.setPublishedAt(LocalDateTime.now());
        postMapper.updateById(post);
        refreshCategoryPostCounts(categoryIds);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updatePostTop(Long id, PostTopDTO dto) {
        Post post = getPostOrThrow(id);
        post.setIsTop(dto.getIsTop());
        if (dto.getSortOrder() != null) {
            post.setSortOrder(dto.getSortOrder());
        }
        postMapper.updateById(post);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updatePostSort(Long id, PostSortDTO dto) {
        Post post = getPostOrThrow(id);
        if (dto.getSortOrder() != null) {
            post.setSortOrder(dto.getSortOrder());
        }
        if (dto.getManualWeight() != null) {
            post.setManualWeight(dto.getManualWeight());
        }
        postMapper.updateById(post);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void batchUpdatePostSort(PostBatchSortDTO dto) {
        for (PostBatchSortDTO.PostSortItemDTO item : dto.getPosts()) {
            Post post = getPostOrThrow(item.getId());
            if (item.getSortOrder() != null) {
                post.setSortOrder(item.getSortOrder());
            }
            if (item.getManualWeight() != null) {
                post.setManualWeight(item.getManualWeight());
            }
            if (item.getIsTop() != null) {
                post.setIsTop(item.getIsTop());
            }
            postMapper.updateById(post);
        }
    }

    /**
     * 增加文章阅读量
     * @param id 文章ID
     */
    @Override
    public void incrementViewCount(Long id) {
        postMapper.incrementViewCount(id);
    }

    private Post getPostOrThrow(Long id) {
        Post post = postMapper.selectById(id);
        if (post == null) {
            throw new BusinessException(ResultCode.POST_NOT_FOUND);
        }
        return post;
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

    private void applyDefaultSort(LambdaQueryWrapper<Post> wrapper) {
        wrapper.orderByDesc(Post::getIsTop)
                .orderByDesc(Post::getSortOrder)
                .orderByDesc(Post::getPublishedAt);
    }

    private void applyHotSort(LambdaQueryWrapper<Post> wrapper) {
        wrapper.orderByDesc(Post::getIsTop)
                .orderByDesc(Post::getSortOrder)
                .orderByDesc(Post::getManualWeight)
                .orderByDesc(Post::getViewCount)
                .orderByDesc(Post::getFavoriteCount)
                .orderByDesc(Post::getLikeCount)
                .orderByDesc(Post::getPublishedAt);
    }

    private List<Long> getActiveCategoryAndDescendantIds(Long categoryId) {
        Category category = categoryMapper.selectById(categoryId);
        if (category == null || !Integer.valueOf(1).equals(category.getStatus())) {
            throw new BusinessException(ResultCode.RESOURCE_NOT_FOUND);
        }

        List<Category> categories = categoryMapper.selectList(new LambdaQueryWrapper<Category>()
                .eq(Category::getStatus, 1));
        Map<Long, List<Long>> childrenMap = new LinkedHashMap<>();
        for (Category item : categories) {
            if (item.getParentId() != null) {
                childrenMap.computeIfAbsent(item.getParentId(), key -> new ArrayList<>()).add(item.getId());
            }
        }

        List<Long> categoryIds = new ArrayList<>();
        categoryIds.add(categoryId);
        collectDescendantIds(categoryId, childrenMap, categoryIds, new HashSet<>());
        return categoryIds;
    }

    private void collectDescendantIds(Long categoryId,
                                      Map<Long, List<Long>> childrenMap,
                                      List<Long> categoryIds,
                                      Set<Long> visited) {
        if (!visited.add(categoryId)) {
            return;
        }
        List<Long> children = childrenMap.get(categoryId);
        if (children == null) {
            return;
        }
        for (Long childId : children) {
            categoryIds.add(childId);
            collectDescendantIds(childId, childrenMap, categoryIds, visited);
        }
    }

    private boolean canAccessUnpublishedPost(Post post) {
        Long currentUserId = SecurityUtil.getCurrentUserId();
        return post.getUserId().equals(currentUserId) || canManagePosts();
    }

    private boolean canManagePosts() {
        return SecurityUtil.hasRole("ROLE_ADMIN")
                || SecurityUtil.hasRole("ROLE_EDITOR")
                || SecurityUtil.hasPermission("post:update")
                || SecurityUtil.hasPermission("post:publish");
    }

}
