package com.rs.pdfminer.service;


import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch._types.query_dsl.Query;
import co.elastic.clients.elasticsearch.core.SearchResponse;
import co.elastic.clients.elasticsearch.core.search.Hit;
import com.rs.pdfminer.model.DocumentEntity;
import com.rs.pdfminer.repository.DocumentRepository;
import com.rs.pdfminer.response.DocumentSuggestResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;


import java.io.IOException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class DocumentService { ;

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private ElasticsearchClient elasticsearchClient;


    private final String PYTHON_SERVER_URL = "http://localhost:8000/upload/";

    public Map<String, Object> processDocument(MultipartFile file) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            ByteArrayResource fileAsResource = new ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    return file.getOriginalFilename();
                }
            };

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", fileAsResource);

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

            RestTemplate restTemplate = new RestTemplate();
            ResponseEntity<Map> response = restTemplate.postForEntity(
                    PYTHON_SERVER_URL, requestEntity, Map.class
            );

            return response.getBody();
        } catch (IOException e) {
            throw new RuntimeException("Error when read file " + e.getMessage(), e);
        } catch (Exception e) {
            throw new RuntimeException("Error when sent file to python " + e.getMessage(), e);
        }
    }

    public DocumentEntity saveDocument(Map<String, Object> extractedData) {
        DocumentEntity document = new DocumentEntity();

        document.setDocumentNumber((String) extractedData.get("documentNumber"));
        document.setDocumentName((String) extractedData.get("documentName"));
        String temp = (String) extractedData.get("title");
        if (temp != null && temp.startsWith("V/v")) {
            temp = temp.substring(3).trim();
        }
        document.setTitle(temp);
        document.setContent((String) extractedData.get("content"));
        document.setDocumentType((String) extractedData.get("documentType"));
        document.setIssuingAgency((String) extractedData.get("issuingAgency"));
        document.setSigner((String) extractedData.get("signer"));
        document.setFileLink((String) extractedData.get("fileLink"));
        document.setStatus((String) extractedData.get("status"));

        String issueDateStr = (String) extractedData.get("issueDate");
        if (issueDateStr != null && !issueDateStr.isEmpty()) {
            try {
                document.setIssueDate(LocalDate.parse(issueDateStr));
            } catch (Exception e) {
                document.setIssueDate(LocalDate.now());
            }
        } else {
            document.setIssueDate(LocalDate.now());
        }

        document.setSearchText(document.getDocumentType() + " " +
                document.getDocumentNumber() + " năm " +
                document.getIssueDate().getYear() + " về " +
                document.getTitle());
        return documentRepository.save(document);
    }

    public List<DocumentEntity> searchDocuments(String keyword) {
        return documentRepository.searchDocuments(keyword);
    }

    public List<DocumentSuggestResponse> getSuggestions(String query, int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        List<DocumentSuggestResponse> suggestions = new ArrayList<>();
        List<DocumentEntity> documents = documentRepository.findBySearchTextContaining(query, pageable);

        for (DocumentEntity document : documents) {
            suggestions.add(new DocumentSuggestResponse(document.getId(), document.getSearchText()));
        }

        return suggestions;
    }

    public List<DocumentSuggestResponse> getAutoSuggestions(String query) throws IOException {
        SearchResponse<DocumentEntity> searchResponse = elasticsearchClient.search(s -> s
                        .index("documents")
                        .query(q -> q.match(m -> m
                                .field("title")
                                .query(query)
                        )),
                DocumentEntity.class
        );

        return searchResponse.hits().hits().stream()
                .map(hit -> {
                    DocumentEntity doc = hit.source();
                    return new DocumentSuggestResponse(doc.getId(), doc.getTitle());
                })
                .collect(Collectors.toList());
    }
}