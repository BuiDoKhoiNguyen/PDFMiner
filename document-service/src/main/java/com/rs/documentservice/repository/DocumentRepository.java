package com.rs.documentservice.repository;

import com.rs.documentservice.model.Document;
import org.springframework.data.domain.Pageable;
import org.springframework.data.elasticsearch.annotations.Query;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;

import java.util.List;
import java.util.Optional;

public interface DocumentRepository extends ElasticsearchRepository<Document, String> {

    Optional<Document> findDocumentByDocumentId(String documentId);
    
    @Query("{\"match_all\": {}}")
    List<Document> findAll();
    
    @Query("{\"bool\": {\"should\": ["
            + "{\"match\": {\"documentNumber\": \"?0\"}},"
            + "{\"match\": {\"content\": \"?0\"}},"
            + "{\"term\": {\"title\": \"?0\"}}"
            + "]}}")
    List<Document> searchDocumentsByTitle(String keyword);

    @Query("{\"bool\": {\"should\": ["
            + "{\"match\": {\"title\": {\"query\": \"?0\", \"fuzziness\": \"AUTO\", \"boost\": 3}}},"
            + "{\"match\": {\"content\": {\"query\": \"?0\", \"minimum_should_match\": \"70%\"}}},"
            + "{\"term\": {\"documentNumber\": \"?0\"}}"
            + "]}}")
    List<Document> searchDocuments(String keyword);

    Document getDocumentEntityByDocumentId(String id);

    void deleteDocumentEntityByDocumentId(String id);

    @Query("{\"match\": {\"searchText\": {\"query\": \"?0\", \"fuzziness\": \"AUTO\"}}}")
    List<Document> findBySearchTextContaining(String query, Pageable pageable);
}