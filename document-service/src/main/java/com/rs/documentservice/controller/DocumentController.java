package com.rs.documentservice.controller;

import com.rs.documentservice.dto.DocumentDataDto;
import com.rs.documentservice.dto.DocumentSuggestResponse;
import com.rs.documentservice.model.Document;
import com.rs.documentservice.repository.DocumentRepository;
import com.rs.documentservice.service.DocumentService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
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

    private static final Logger logger = LoggerFactory.getLogger(DocumentController.class);

    @Autowired
    private DocumentService documentService;
    
    @Autowired
    private DocumentRepository documentRepository;

    @Value("${storage-service.url}")
    private String storageServiceUrl;

    @GetMapping("/dashboard")
    @PreAuthorize("hasAuthority('DOCUMENT_READ')")
    public ResponseEntity<?> getDashboardDocuments() {
        logger.info("Fetching dashboard documents");
        
        try {
            List<Document> documents = documentService.findDashboardDocuments();
            return ResponseEntity.ok(documents);
        } catch (Exception e) {
            logger.error("Error fetching dashboard documents", e);
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", "Không thể tải tài liệu dashboard: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    @GetMapping
    @PreAuthorize("hasAuthority('DOCUMENT_READ')")
    public ResponseEntity<?> getAllDocuments(@RequestParam(defaultValue = "0") int page,
                                            @RequestParam(defaultValue = "9") int size) {
        logger.info("Fetching all documents");
        
        try {
            List<Document> documents = documentService.findAll(page, size);
            return ResponseEntity.ok(documents);
        } catch (Exception e) {
            logger.error("Error fetching documents", e);
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", "Không thể tải danh sách tài liệu: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }


    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('DOCUMENT_UPDATE')")
    public ResponseEntity<Map<String, String>> updateDocument(@PathVariable String id) {
        logger.info("Updating document with id: {}", id);
        Map<String, String> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "Tài liệu " + id + " được cập nhật bởi người dùng có quyền DOCUMENT_UPDATE");
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('DOCUMENT_DELETE')")
    public ResponseEntity<Void> deleteDocument(@PathVariable String id) {
        logger.info("Deleting document with id: {}", id);
        documentService.deleteDocument(id);
        return ResponseEntity.ok().build();
    }


    @GetMapping("/search")
    @PreAuthorize("hasAuthority('DOCUMENT_SEARCH')")
    public List<Document> searchDocuments(@RequestParam String keyword, 
                                          @RequestParam(defaultValue = "0") int page,
                                          @RequestParam(defaultValue = "6") int size) {
        logger.info("Searching documents with keyword: {}", keyword);
        return documentService.searchDocuments(keyword, page, size);
    }

    /**
     * Upload a document and process asynchronously via Kafka
     * 
     * @param file The document file to upload
     * @return Processing status
     */
    @PostMapping("/upload")
    @PreAuthorize("hasAuthority('DOCUMENT_CREATE')")
    public ResponseEntity<?> uploadDocument(@RequestParam("file") MultipartFile file) {
        try {
            logger.info("Uploading document asynchronously: {}", file.getOriginalFilename());

            Map<String, Object> result = documentService.uploadDocumentWithKafka(file);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            logger.error("Error uploading document", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Failed to upload document: " + e.getMessage(),
                    "fileName", file.getOriginalFilename()
            ));
        }
    }

    @GetMapping("/suggest")
    public List<DocumentSuggestResponse> getSuggestions(@RequestParam String query, @RequestParam(defaultValue = "6") int limit) throws IOException {
        logger.info("Getting suggestions for query: {}", query);
        return documentService.getSuggestions(query, limit);
    }

    @GetMapping("/{documentId}/status")
    public ResponseEntity<Map<String, Object>> getDocumentStatus(@PathVariable String documentId) {
        try {
            logger.info("Checking status for document with ID: {}", documentId);

            var document = documentRepository
                    .findDocumentByDocumentId(documentId)
                    .orElse(null);

            if (document == null) {
                return ResponseEntity.ok(Map.of(
                        "documentId", documentId,
                        "status", "processing",
                        "message", "Document is still being processed or not found"
                ));
            }

            return ResponseEntity.ok(Map.of(
                    "documentId", documentId,
                    "status", "completed",
                    "document", document
            ));

        } catch (Exception e) {
            logger.error("Error checking document status", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "documentId", documentId,
                    "status", "error",
                    "message", e.getMessage()
            ));
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('DOCUMENT_READ')")
    public ResponseEntity<Document> getDocumentById(@PathVariable String id) {
        logger.info("Fetching document with id: {}", id);
        Document document = documentService.getDocumentById(id);
        if (document != null) {
            return ResponseEntity.ok(document);
        }
        return ResponseEntity.notFound().build();
    }

    /**
     * API để nhận dữ liệu đã xử lý từ document-process-service (nếu Kafka không hoạt động)
     */
    @PostMapping("/process")
    public ResponseEntity<?> processDocument(@RequestBody DocumentDataDto documentData) {
        try {
            logger.info("Received processed document data for ID: {}", documentData.getDocumentId());
            Document document = documentService.processNormalizedDocument(documentData);
            
            return ResponseEntity.ok(Map.of(
                    "documentId", document.getDocumentId(),
                    "status", "completed",
                    "message", "Document processed successfully"
            ));
        } catch (Exception e) {
            logger.error("Error processing document data", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Failed to process document: " + e.getMessage(),
                    "documentId", documentData.getDocumentId()
            ));
        }
    }
}