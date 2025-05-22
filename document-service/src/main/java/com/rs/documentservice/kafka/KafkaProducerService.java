package com.rs.documentservice.kafka;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;

@Service
public class KafkaProducerService {
    private static final Logger logger = LoggerFactory.getLogger(KafkaProducerService.class);
    
    private final KafkaTemplate<String, Object> kafkaTemplate;
    
    public KafkaProducerService(KafkaTemplate<String, Object> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }
    
    /**
     * Send an event to a Kafka topic
     * 
     * @param topic The Kafka topic
     * @param key The message key (usually document ID)
     * @param data The payload to send
     */
    public void sendDocumentEvent(String topic, String key, Object data) {
        logger.info("Sending message to topic: {} with key: {}", topic, key);
        
        CompletableFuture<SendResult<String, Object>> future = kafkaTemplate.send(topic, key, data);
        
        future.whenComplete((result, ex) -> {
            if (ex == null) {
                logger.info("Message sent successfully to topic: {} with offset: {}", 
                        topic, result.getRecordMetadata().offset());
            } else {
                logger.error("Unable to send message to topic: {} due to: {}", topic, ex.getMessage(), ex);
            }
        });
    }
    
    /**
     * Send a file uploaded event
     * 
     * @param documentId The document ID
     * @param data The document data
     */
    public void sendFileUploadedEvent(String documentId, Object data) {
        sendDocumentEvent("file-uploaded", documentId, data);
    }
    
    /**
     * Send a file text extracted event
     * 
     * @param documentId The document ID
     * @param data The processed document data
     */
    public void sendFileTextExtractedEvent(String documentId, Object data) {
        sendDocumentEvent("file-text-extracted", documentId, data);
    }
}
