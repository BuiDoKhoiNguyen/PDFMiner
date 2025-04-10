package com.rs.pdfminer.controller;

import co.elastic.clients.elasticsearch.core.SearchResponse;
import co.elastic.clients.elasticsearch.core.search.CompletionSuggest;
import co.elastic.clients.elasticsearch.core.search.CompletionSuggestOption;
import co.elastic.clients.elasticsearch.core.search.Suggestion;
import com.rs.pdfminer.model.DocumentEntity;
import com.rs.pdfminer.repository.DocumentRepository;
import com.rs.pdfminer.response.DocumentSuggestResponse;
import com.rs.pdfminer.service.DocumentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/documents")
public class DocumentController {

    @Autowired
    private DocumentService documentService;

    @GetMapping("/search")
    public List<DocumentEntity> search(@RequestParam String keyword) {
        return documentService.searchDocuments(keyword);
    }

    @PostMapping("/upload")
    public ResponseEntity<DocumentEntity> uploadDocument(@RequestParam("file") MultipartFile file) {
        Map<String, Object> extractedData = documentService.processDocument(file);
        DocumentEntity document = documentService.saveDocument(extractedData);

        return ResponseEntity.ok(document);
    }

//    @GetMapping("/suggest")
//    public ResponseEntity<List<String>> getSuggestions(@RequestParam String query) {
//        List<String> suggestions = documentService.suggestDocuments(query);
//        return ResponseEntity.ok(suggestions);
//    }

    @GetMapping("/suggest")
    public List<DocumentSuggestResponse> getSuggestions(@RequestParam String query, @RequestParam(defaultValue = "6") int limit ) throws IOException {
        return documentService.getSuggestions(query, limit);
    }
}