package com.rs.userservice.kafka;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class KafkaConsumerService {
    
    private static final Logger logger = LoggerFactory.getLogger(KafkaConsumerService.class);
    
    /**
     * Listen for user permission change events
     * 
     * @param payload Event payload
     * @param key Message key (user ID)
     * @param acknowledgment Acknowledgment
     */
    @KafkaListener(topics = "permission-changed", groupId = "${spring.kafka.consumer.group-id}")
    public void handlePermissionChangedEvent(
            @Payload Map<String, Object> payload,
            @Header(KafkaHeaders.RECEIVED_KEY) String key,
            Acknowledgment acknowledgment) {
        
        try {
            logger.info("Received permission change event for user: {}", key);
            
            // Process permission change
            // For example, update user permissions in database
            
            // Acknowledge the message
            acknowledgment.acknowledge();
            logger.info("Successfully processed permission change for user: {}", key);
            
        } catch (Exception e) {
            logger.error("Error processing permission change event for user {}: {}", 
                    key, e.getMessage(), e);
            // Not acknowledging will cause redelivery according to retry policy
            throw e;
        }
    }
    
    /**
     * Listen for global security policy updates
     * 
     * @param payload Event payload
     * @param key Message key
     * @param acknowledgment Acknowledgment
     */
    @KafkaListener(topics = "security-policy-update", groupId = "${spring.kafka.consumer.group-id}")
    public void handleSecurityPolicyUpdate(
            @Payload Map<String, Object> payload,
            @Header(KafkaHeaders.RECEIVED_KEY) String key,
            Acknowledgment acknowledgment) {
        
        try {
            logger.info("Received security policy update: {}", key);
            
            // Process security policy update
            // For example, update security settings
            
            // Acknowledge the message
            acknowledgment.acknowledge();
            logger.info("Successfully processed security policy update: {}", key);
            
        } catch (Exception e) {
            logger.error("Error processing security policy update {}: {}", 
                    key, e.getMessage(), e);
            throw e;
        }
    }
}
