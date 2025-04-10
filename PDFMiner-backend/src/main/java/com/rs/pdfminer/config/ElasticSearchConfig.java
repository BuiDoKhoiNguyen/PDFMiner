package com.rs.pdfminer.config;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.json.jackson.JacksonJsonpMapper;
import co.elastic.clients.transport.ElasticsearchTransport;
import co.elastic.clients.transport.rest_client.RestClientTransport;
import lombok.NonNull;
import org.apache.http.HttpHost;
import org.elasticsearch.client.RestClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.elasticsearch.client.ClientConfiguration;
import org.springframework.data.elasticsearch.client.elc.ElasticsearchConfiguration;
import org.springframework.data.elasticsearch.repository.config.EnableElasticsearchRepositories;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

import java.time.Duration;

import javax.net.ssl.SSLContext;

//@Configuration
//@EnableElasticsearchRepositories(basePackages = "com.rs.pdfminer.repository")
//public class ElasticSearchConfig extends ElasticsearchConfiguration {
//
//    @Value("${spring.elasticsearch.username}")
//    private String username;
//
//    @Value("${spring.elasticsearch.username}")
//    private String password;
//
//    @Override
//    @NonNull
//    public ClientConfiguration clientConfiguration() {
//        return ClientConfiguration.builder()
//                .connectedToLocalhost()
//                .usingSsl(builSSLContext())
//                .withBasicAuth(username, password)
//                .build();
//    }
//
//    private static SSLContext builSSLContext() {
//        try {
//            return new SSLContextBuilder().loadTrustMaterial(null, TrustAllStrategy.INSTANCE).build();
//        } catch (Exception e) {
//            throw new RuntimeException(e);
//        }
//    }
//}

@Configuration
@EnableElasticsearchRepositories(basePackages = "com.rs.pdfminer.repository")
public class ElasticSearchConfig extends ElasticsearchConfiguration {
    @Override
    @NonNull
    public ClientConfiguration clientConfiguration() {
        return ClientConfiguration.builder()
                .connectedToLocalhost()
                .build();
    }

    @Bean
    public ElasticsearchClient elasticsearchClient() {
        RestClient restClient = RestClient.builder(
                new HttpHost("localhost", 9200, "http")
        ).build();

        RestClientTransport transport = new RestClientTransport(
                restClient, new JacksonJsonpMapper());

        return new ElasticsearchClient(transport);
    }
}