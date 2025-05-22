package com.rs.userservice.kafka;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@Service
public class KafkaProducerService {
    
    private static final Logger logger = LoggerFactory.getLogger(KafkaProducerService.class);
    
    private final KafkaTemplate<String, Object> kafkaTemplate;
    
    public KafkaProducerService(KafkaTemplate<String, Object> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }
    
    /**
     * Send user created event
     * 
     * @param userId User ID
     * @param userData User data
     */
    public void sendUserCreatedEvent(String userId, Map<String, Object> userData) {
        sendEvent("user-created", userId, enrichWithMetadata(userData));
    }
    
    /**
     * Send user updated event
     * 
     * @param userId User ID
     * @param userData Updated user data
     */
    public void sendUserUpdatedEvent(String userId, Map<String, Object> userData) {
        sendEvent("user-updated", userId, enrichWithMetadata(userData));
    }
    
    /**
     * Send user login event
     * 
     * @param userId User ID
     * @param loginData Login data
     */
    public void sendUserLoginEvent(String userId, Map<String, Object> loginData) {
        sendEvent("user-login", userId, enrichWithMetadata(loginData));
    }
    
    /**
     * Send role changed event
     * 
     * @param userId User ID
     * @param roleData Role change data
     */
    public void sendRoleChangedEvent(String userId, Map<String, Object> roleData) {
        sendEvent("role-changed", userId, enrichWithMetadata(roleData));
    }
    
    /**
     * Helper method to add metadata to events
     * 
     * @param data Event data
     * @return Enriched data
     */
    private Map<String, Object> enrichWithMetadata(Map<String, Object> data) {
        Map<String, Object> enrichedData = new HashMap<>(data);
        enrichedData.put("timestamp", LocalDateTime.now().toString());
        enrichedData.put("service", "user-service");
        return enrichedData;
    }
    
    /**
     * Send event to Kafka topic
     * 
     * @param topic Kafka topic
     * @param key Message key
     * @param data Event data
     */
    private void sendEvent(String topic, String key, Object data) {
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
}
