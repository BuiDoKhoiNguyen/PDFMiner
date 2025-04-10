package com.rs.pdfminer.repository;


import com.rs.pdfminer.model.DocumentEntity;
import org.springframework.data.domain.Pageable;
import org.springframework.data.elasticsearch.annotations.Query;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;

import java.util.List;

public interface DocumentRepository extends ElasticsearchRepository<DocumentEntity, String> {
    @Query("{\"bool\": {\"should\": ["
            + "{\"match\": {\"documentNumber\": \"?0\"}},"
            + "{\"match\": {\"content\": \"?0\"}},"
            + "{\"term\": {\"title\": \"?0\"}}"
            + "]}}")
    List<DocumentEntity> searchDocumentsByTitle(String keyword);

    @Query("{\"bool\": {\"should\": ["
            + "{\"match\": {\"title\": {\"query\": \"?0\", \"fuzziness\": \"AUTO\", \"boost\": 3}}},"
            + "{\"match\": {\"content\": {\"query\": \"?0\", \"minimum_should_match\": \"70%\"}}},"
            + "{\"term\": {\"documentNumber\": \"?0\"}}"
            + "]}}")
    List<DocumentEntity> searchDocuments(String keyword);

    DocumentEntity getDocumentEntityById(String id);

    void deleteDocumentEntityById(String id);

    @Query("{\"bool\": {\"should\": ["
            + "{\"match\": {\"title\": \"?0\"}},"
            + "{\"match\": {\"content\": \"?0\"}},"
            + "{\"term\": {\"documentNumber\": \"?0\"}}"
            + "]}}")
    List<DocumentEntity> searchDocumentsByDocumentNumber(String keyword);

    @Query("{\"bool\": {\"should\": ["
            + "{\"term\": {\"documentType\": \"?0\"}},"
            + "{\"term\": {\"documentNumber\": \"?0\"}},"
            + "{\"match\": {\"title\": {\"query\": \"?0\", \"fuzziness\": \"AUTO\", \"boost\": 3, \"analyzer\": \"standard\"}}}"
            + "], \"minimum_should_match\": 1}}")
    List<DocumentEntity> suggestDocuments(String keyword);

    @Query("{\"match\": {\"searchText\": {\"query\": \"?0\", \"fuzziness\": \"AUTO\"}}}")
    List<DocumentEntity> findBySearchTextContaining(String query, Pageable pageable);
}
