package com.rs.pdfminer.controller;

import com.rs.pdfminer.service.S3Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;

@RestController
@RequestMapping("/files")
public class S3FileController {

    @Autowired
    private S3Service s3Service;

    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(@RequestParam("file") MultipartFile file) throws Exception {
        String fileUrl = s3Service.uploadFile(file);

        return ResponseEntity.ok(Map.of("url", fileUrl));
    }

    @GetMapping("/download")
    public void downloadFile(@RequestParam("key") String key, @RequestParam("path") String downloadFilePath) {
        s3Service.downloadFile(key, downloadFilePath);
    }
}