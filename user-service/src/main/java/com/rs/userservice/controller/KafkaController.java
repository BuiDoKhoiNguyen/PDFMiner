package com.rs.userservice.controller;

import com.rs.userservice.kafka.KafkaProducerService;
import com.rs.userservice.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/kafka")
@RequiredArgsConstructor
public class KafkaController {

    private final UserService userService;
    
    @Autowired
    private KafkaProducerService kafkaProducer;
    
    /**
     * Endpoint to manually trigger a user event to Kafka
     * 
     * @param userId User ID
     * @param eventType Type of event
     * @param eventData Event data
     * @return Response
     */
    @PostMapping("/users/{userId}/events")
    public ResponseEntity<Map<String, Object>> sendUserEvent(
            @PathVariable String userId,
            @RequestParam String eventType,
            @RequestBody Map<String, Object> eventData) {
        
        try {
            // Verify user exists
            var userOptional = userService.getUserById(userId);
            if (userOptional.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            // Add user ID to event data
            eventData.put("userId", userId);
            
            // Send the appropriate event based on type
            switch (eventType) {
                case "created":
                    kafkaProducer.sendUserCreatedEvent(userId, eventData);
                    break;
                case "updated":
                    kafkaProducer.sendUserUpdatedEvent(userId, eventData);
                    break;
                case "login":
                    kafkaProducer.sendUserLoginEvent(userId, eventData);
                    break;
                case "role-changed":
                    kafkaProducer.sendRoleChangedEvent(userId, eventData);
                    break;
                default:
                    return ResponseEntity.badRequest().body(Map.of(
                            "error", "Unsupported event type: " + eventType,
                            "supportedTypes", "created, updated, login, role-changed"
                    ));
            }
            
            return ResponseEntity.ok(Map.of(
                    "userId", userId,
                    "eventType", eventType,
                    "status", "Event published successfully"
            ));
            
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                    "error", "Failed to publish event: " + e.getMessage(),
                    "userId", userId,
                    "eventType", eventType
            ));
        }
    }
}
