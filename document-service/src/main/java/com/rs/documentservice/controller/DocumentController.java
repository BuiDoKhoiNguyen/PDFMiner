package com.rs.documentservice.controller;

import com.rs.documentservice.dto.DocumentSuggestResponse;
import com.rs.documentservice.model.Document;
import com.rs.documentservice.service.DocumentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {

    @Autowired
    private DocumentService documentService;

    @GetMapping
    @PreAuthorize("hasAuthority('DOCUMENT_READ')")
    public ResponseEntity<Map<String, String>> getAllDocuments() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "Danh sách tài liệu được truy cập bởi người dùng có quyền DOCUMENT_READ");
        return ResponseEntity.ok(response);
    }

    @PostMapping
    @PreAuthorize("hasAuthority('DOCUMENT_CREATE')")
    public ResponseEntity<Map<String, String>> createDocument() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "Tài liệu được tạo bởi người dùng có quyền DOCUMENT_CREATE");
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('DOCUMENT_UPDATE')")
    public ResponseEntity<Map<String, String>> updateDocument(@PathVariable String id) {
        Map<String, String> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "Tài liệu " + id + " được cập nhật bởi người dùng có quyền DOCUMENT_UPDATE");
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('DOCUMENT_DELETE')")
    public ResponseEntity<Void> deleteDocument(@PathVariable String id) {
        documentService.deleteDocument(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAuthority('DOCUMENT_APPROVE')")
    public ResponseEntity<Map<String, String>> approveDocument(@PathVariable String id) {
        Map<String, String> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "Tài liệu " + id + " được phê duyệt bởi người dùng có quyền DOCUMENT_APPROVE");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/download")
    @PreAuthorize("hasAuthority('DOCUMENT_DOWNLOAD')")
    public ResponseEntity<Map<String, String>> downloadDocument(@PathVariable String id) {
        Map<String, String> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "Tài liệu " + id + " được tải xuống bởi người dùng có quyền DOCUMENT_DOWNLOAD");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/search")
    @PreAuthorize("hasAuthority('DOCUMENT_SEARCH')")
    public List<Document> searchDocuments(@RequestParam String keyword) {
        return documentService.searchDocuments(keyword);
    }

    @PostMapping("/upload")
    @PreAuthorize("hasAuthority('DOCUMENT_CREATE')")
    public ResponseEntity<Document> uploadDocument(@RequestParam("file") MultipartFile file) {
        Map<String, Object> extractedData = documentService.processDocument(file);
        Document document = documentService.saveDocument(extractedData);
        return ResponseEntity.ok(document);
    }

    @GetMapping("/suggest")
    public List<DocumentSuggestResponse> getSuggestions(@RequestParam String query, @RequestParam(defaultValue = "6") int limit) throws IOException {
        return documentService.getSuggestions(query, limit);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('DOCUMENT_READ')")
    public ResponseEntity<Document> getDocumentById(@PathVariable String id) {
        Document document = documentService.getDocumentById(id);
        if (document != null) {
            return ResponseEntity.ok(document);
        }
        return ResponseEntity.notFound().build();
    }

    // API công khai không cần xác thực
    @GetMapping("/public/info")
    public ResponseEntity<Map<String, String>> getPublicInfo() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "Thông tin công khai về hệ thống tài liệu");
        return ResponseEntity.ok(response);
    }
}