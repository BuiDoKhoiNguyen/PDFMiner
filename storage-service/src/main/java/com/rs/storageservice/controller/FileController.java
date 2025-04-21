package com.rs.storageservice.controller;

import com.rs.storageservice.service.S3Service;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileController {

    private final S3Service s3Service;

    @PostMapping("/upload")
    @PreAuthorize("hasAuthority('DOCUMENT_CREATE')")
    public ResponseEntity<Map<String, String>> uploadFile(@RequestParam("file") MultipartFile file) throws IOException {
        String fileUrl = s3Service.uploadFile(file);
        return ResponseEntity.ok(Map.of(
            "url", fileUrl,
            "filename", file.getOriginalFilename(),
            "message", "File uploaded successfully"
        ));
    }

    @GetMapping("/download/{key}")
    @PreAuthorize("hasAuthority('DOCUMENT_DOWNLOAD')")
    public ResponseEntity<ByteArrayResource> downloadFile(@PathVariable String key) {
        byte[] data = s3Service.downloadFile(key);
        ByteArrayResource resource = new ByteArrayResource(data);
        
        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + key);
        
        return ResponseEntity.ok()
                .headers(headers)
                .contentLength(data.length)
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(resource);
    }

    @DeleteMapping("/{key}")
    @PreAuthorize("hasAuthority('DOCUMENT_DELETE')")
    public ResponseEntity<Map<String, String>> deleteFile(@PathVariable String key) {
        s3Service.deleteFile(key);
        return ResponseEntity.ok(Map.of(
            "message", "File deleted successfully", 
            "key", key
        ));
    }

    @GetMapping("/url/{key}")
    @PreAuthorize("hasAuthority('DOCUMENT_READ')")
    public ResponseEntity<Map<String, String>> getFileUrl(@PathVariable String key) {
        String url = s3Service.getFileUrl(key);
        return ResponseEntity.ok(Map.of("url", url));
    }
}