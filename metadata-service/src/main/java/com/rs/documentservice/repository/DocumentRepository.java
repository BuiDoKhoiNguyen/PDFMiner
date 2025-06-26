package com.rs.documentservice.repository;

import com.rs.documentservice.model.Document;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.elasticsearch.annotations.Query;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;

import java.util.List;
import java.util.Optional;

public interface DocumentRepository extends ElasticsearchRepository<Document, String> {

    Optional<Document> findDocumentByDocumentId(String documentId);
    
    Page<Document> findAll(Pageable pageable);
    
    @Query("{\"bool\": {\"should\": ["
            + "{\"match\": {\"documentNumber\": \"?0\"}},"
            + "{\"match\": {\"content\": \"?0\"}},"
            + "{\"term\": {\"title\": \"?0\"}}"
            + "]}}")
    List<Document> searchDocumentsByTitle(String keyword);

    @Query("""
        {
          "multi_match": {
            "query": "?0",
            "fields": ["title^3", "content^2", "documentNumber^3", "searchText"],
            "fuzziness": "AUTO",
            "minimum_should_match": "70%"
          }
        }
        """)
    List<Document> searchDocuments(String keyword, Pageable pageable);

    Document getDocumentEntityByDocumentId(String id);

    void deleteDocumentEntityByDocumentId(String id);

    @Query("{\"match\": {\"searchText\": {\"query\": \"?0\", \"fuzziness\": \"AUTO\"}}}")
    List<Document> findBySearchTextContaining(String query, Pageable pageable);

    List<Document> findAll();
}