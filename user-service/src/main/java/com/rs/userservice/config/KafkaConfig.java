package com.rs.userservice.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaConfig {

    // Define Kafka topics
    @Bean
    public NewTopic userCreatedTopic() {
        return TopicBuilder.name("user-created")
                .partitions(3)
                .replicas(1)
                .build();
    }
    
    @Bean
    public NewTopic userUpdatedTopic() {
        return TopicBuilder.name("user-updated")
                .partitions(3)
                .replicas(1)
                .build();
    }
    
    @Bean
    public NewTopic userLoginTopic() {
        return TopicBuilder.name("user-login")
                .partitions(3)
                .replicas(1)
                .build();
    }
    
    @Bean
    public NewTopic roleChangedTopic() {
        return TopicBuilder.name("role-changed")
                .partitions(3)
                .replicas(1)
                .build();
    }
}
