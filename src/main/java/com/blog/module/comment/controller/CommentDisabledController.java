package com.blog.module.comment.controller;

import com.blog.common.Result;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Temporary fallback while comments are disabled for the government portal migration.
 */
@RestController
@RequestMapping("/comments")
@ConditionalOnProperty(prefix = "blog.comment", name = "enabled", havingValue = "false")
public class CommentDisabledController {

    @RequestMapping({"", "/**"})
    public ResponseEntity<Result<Void>> disabled() {
        return ResponseEntity
                .status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(Result.error(HttpStatus.SERVICE_UNAVAILABLE.value(), "评论功能暂未开放"));
    }
}
