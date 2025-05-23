package com.rs.documentservice.controller;

import com.rs.documentservice.dto.ChatbotRequestDto;
import com.rs.documentservice.dto.ChatbotResponseDto;
import com.rs.documentservice.dto.DocumentLinkDto;
import com.rs.documentservice.model.Document;
import com.rs.documentservice.repository.DocumentRepository;
import com.rs.documentservice.service.ChatbotService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/documents/chatbot")
@Slf4j
public class ChatbotController {

    @Autowired
    private ChatbotService chatbotService;
    
    @Autowired
    private DocumentRepository documentRepository;

    @PostMapping("/query")
    public ResponseEntity<ChatbotResponseDto> processQuery(@RequestBody ChatbotRequestDto request) {
        log.info("Received chatbot query: {}", request.getQuery());
        ChatbotResponseDto response = chatbotService.processQuery(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/document-links")
    public ResponseEntity<List<DocumentLinkDto>> getDocumentLinks(@RequestParam String ids) {
        log.info("Getting document links for IDs string: {}", ids);
        
        List<String> idList = List.of(ids.split(","));
        log.info("Split into ID list: {}", idList);
        
        List<DocumentLinkDto> links = new ArrayList<>();
        
        for (String id : idList) {
            Document document = documentRepository.getDocumentEntityByDocumentId(id);
            if (document != null) {
                DocumentLinkDto link = DocumentLinkDto.builder()
                        .id(document.getDocumentId())
                        .title(document.getTitle())
                        .documentNumber(document.getDocumentNumber())
                        .documentType(document.getDocumentType())
                        .url(document.getFileLink())
                        .build();
                links.add(link);
            }
        }
        return ResponseEntity.ok(links);
    }
}
