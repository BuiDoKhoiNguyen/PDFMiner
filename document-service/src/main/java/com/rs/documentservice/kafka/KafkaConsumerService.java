package com.rs.documentservice.kafka;

import java.time.LocalDate;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Service;

import com.rs.documentservice.dto.DocumentDataDto;
import com.rs.documentservice.service.DocumentService;

@Service
public class KafkaConsumerService {
    private static final Logger logger = LoggerFactory.getLogger(KafkaConsumerService.class);
    
    private final DocumentService documentService;
    
    public KafkaConsumerService(DocumentService documentService) {
        this.documentService = documentService;
    }
    
    /**
     * Listens to the file-text-extracted topic and processes document data after extraction
     */
    @KafkaListener(topics = "file-text-extracted", groupId = "${spring.kafka.consumer.group-id}")
    public void consumeExtractedDocumentData(
            @Payload Map<String, Object> payload,
            @Header(KafkaHeaders.RECEIVED_KEY) String key,
            Acknowledgment acknowledgment) {
        
        try {
            logger.info("Received extracted document data for ID: {}", key);
            
            // Convert map to DocumentDataDto
            DocumentDataDto documentData = convertToDocumentDataDto(payload);
            
            // Process the document data - includes both text and table data if available
            documentService.processNormalizedDocument(documentData);
            
            // Acknowledge the message
            acknowledgment.acknowledge();
            logger.info("Successfully processed document with ID: {}", key);
        } catch (Exception e) {
            logger.error("Error processing extracted document with ID: {}. Error: {}", key, e.getMessage(), e);
            // Not acknowledging will cause the message to be redelivered based on retry policy
            throw e;
        }
    }
    
    /**
     * Converts a Map to DocumentDataDto
     */
    private DocumentDataDto convertToDocumentDataDto(Map<String, Object> payload) {
        DocumentDataDto dto = new DocumentDataDto();
        
        if (payload != null) {
            dto.setDocumentId((String) payload.get("documentId"));
            dto.setDocumentNumber((String) payload.get("documentNumber"));
            dto.setTitle((String) payload.get("title"));
            dto.setContent((String) payload.get("content"));
            dto.setDocumentType((String) payload.get("documentType"));
            dto.setIssuingAgency((String) payload.get("issuingAgency"));
            dto.setSigner((String) payload.get("signer"));
            
            // Handle date conversion
            String issueDateStr = (String) payload.get("issueDate");
            if (issueDateStr != null && !issueDateStr.isEmpty()) {
                try {
                    dto.setIssueDate(LocalDate.parse(issueDateStr));
                } catch (Exception e) {
                    logger.warn("Failed to parse date: {}. Using null instead.", issueDateStr);
                }
            }
            
            dto.setStatus((String) payload.get("status"));
            dto.setFileUrl((String) payload.get("fileUrl"));
        }
        
        return dto;
    }
}
