package com.blog.module.post.service;

import com.blog.DTO.post.PostCreateDTO;
import com.blog.DTO.post.PostBatchSortDTO;
import com.blog.DTO.post.PostSortDTO;
import com.blog.DTO.post.PostTopDTO;
import com.blog.DTO.post.PostUpdateDTO;
import com.blog.VO.post.PostDetailVO;
import com.blog.VO.post.PostListVO;
import com.blog.common.PageResult;

/**
 * @Author: GALA_Lin
 * @Date: 2025-10-08-13:36
 * @Description:
 */
public interface PostService {
    /**
     * 创建文章
     * @param dto 文章创建DTO
     * @return 文章ID
     */
    Long createPost(PostCreateDTO dto);

    /**
     * 根据文章ID获取文章详情
     * @param id 文章ID
     * @return 文章详情
     */
    PostDetailVO getPostById(Long id);

    /**
     * 获取文章列表
     * @param page 页码
     * @param size 每页大小
     * @param status 文章状态
     * @return 文章列表
     */
    PageResult<PostListVO> getPostList(Integer page, Integer size, Integer status);

    PageResult<PostListVO> getHotPosts(Integer page, Integer size, Long categoryId);

    /**
     * 更新文章
     * @param dto 文章更新DTO
     */
    void updatePost(PostUpdateDTO dto);

    /**
     * 删除文章
     * @param id 文章ID
     */
    void deletePost(Long id);

    /**
     * 发布文章
     * @param id 文章ID
     */
    void publishPost(Long id);

    void updatePostTop(Long id, PostTopDTO dto);

    void updatePostSort(Long id, PostSortDTO dto);

    void batchUpdatePostSort(PostBatchSortDTO dto);

    /**
     * 浏览量自增
     * @param id 文章ID
     */
    void incrementViewCount(Long id);

}
