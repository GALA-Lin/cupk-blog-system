package com.blog.module.post.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.blog.entity.Category;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Update;

/**
 * @Author: GALA_Lin
 * @Date: 2025-10-08-13:27
 * @Description:
 */
@Mapper
public interface CategoryMapper extends BaseMapper<Category> {

    @Update("UPDATE categories SET post_count = (" +
            "SELECT COUNT(DISTINCT pc.post_id) " +
            "FROM post_categories pc " +
            "INNER JOIN posts p ON p.id = pc.post_id " +
            "WHERE pc.category_id = #{categoryId} AND p.status = 1" +
            ") WHERE id = #{categoryId}")
    void refreshPostCount(@Param("categoryId") Long categoryId);
}
