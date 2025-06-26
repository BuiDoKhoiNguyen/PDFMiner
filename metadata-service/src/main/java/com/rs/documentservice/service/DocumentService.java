package com.rs.documentservice.service;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch.core.SearchResponse;
import co.elastic.clients.elasticsearch.core.search.CompletionSuggestOption;
import co.elastic.clients.elasticsearch.core.search.Hit;
import com.rs.documentservice.dto.DocumentDataDto;
import com.rs.documentservice.dto.DocumentSuggestResponse;
import com.rs.documentservice.kafka.KafkaProducerService;
import com.rs.documentservice.model.Document;
import com.rs.documentservice.repository.DocumentRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.elasticsearch.core.suggest.Completion;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
public class DocumentService {

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private ElasticsearchClient elasticsearchClient;
    
    @Autowired
    private KafkaProducerService kafkaProducer;

    @Autowired
    private JwtService jwtService;

    @Value("${storage-service.url}")
    private String storageServiceUrl;

    @Value("${document-process.url}")
    private String DOCUMENT_PROCESS_URL;

    public List<Document> findDashboardDocuments() {
        List<Document> documents = documentRepository.findAll();
        return documents;
    }

    public List<Document> findAll(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Document> pageResults = documentRepository.findAll(pageable);
        List<Document> results = pageResults.getContent();
        return results;
    }

    public List<Document> searchDocuments(String keyword, int page, int size) {
//        try {
//            SearchResponse<Map> response = elasticsearchClient.search(s -> s
//                            .index("documents")
//                            .from(page * size)
//                            .size(size)
//                            .query(q -> q
//                                    .multiMatch(m -> m
//                                            .fields("title^3", "content^2", "documentNumber^3", "searchText")
//                                            .query(keyword)
//                                            .fuzziness("AUTO")
//                                            .minimumShouldMatch("70%")
//                                    )
//                            ),
//                    Map.class
//            );
//            List<Document> documents = response.hits().hits().stream()
//                    .map(hit -> {
//                        Map<String, Object> source = hit.source();
//                        Document document = new Document();
//                        document.setDocumentId((String) source.get("documentId"));
//                        document.setTitle((String) source.get("title"));
//                        document.setContent((String) source.get("content"));
//                        document.setDocumentNumber((String) source.get("documentNumber"));
//                        document.setDocumentType((String) source.get("documentType"));
//                        document.setIssuingAgency((String) source.get("issuingAgency"));
//                        document.setSigner((String) source.get("signer"));
//                        document.setFileLink((String) source.get("fileLink"));
//                        document.setStatus((String) source.get("status"));
//                        // Add other fields as needed
//                        return document;
//                    })
//                    .collect(Collectors.toList());
//
//            return documents;
////            if (response.hits().hits().isEmpty()) {
////                return Collections.emptyList();
////            }
//
////            return response.hits().hits().stream()
////                    .map(Hit::source)
////                    .collect(Collectors.toList());
//
//        } catch (IOException e) {
//            // Log lỗi ra console hoặc logger (nên dùng logger thực tế trong dự án)
//            System.err.println("Error searching documents: " + e.getMessage());
//            // Trả về danh sách rỗng hoặc có thể ném RuntimeException tùy thiết kế
//            return Collections.emptyList();
//        }
        Pageable pageable = PageRequest.of(page, size);
        List<Document> documents = documentRepository.searchDocuments(keyword, pageable);
        if (documents.isEmpty()) {
            return Collections.emptyList();
        }
        // Sắp xếp kết quả theo độ liên quan (có thể tùy chỉnh theo nhu cầu)
        return documents;
    }

    public List<DocumentSuggestResponse> getSuggestions(String query, int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        List<DocumentSuggestResponse> suggestions = new ArrayList<>();
        List<Document> documents = documentRepository.findBySearchTextContaining(query, pageable);

        for (Document document : documents) {
            suggestions.add(new DocumentSuggestResponse(document.getDocumentId(), document.getSearchText()));
        }

        return suggestions;
    }

    public List<DocumentSuggestResponse> getAutoSuggestions(String query, int limit) throws IOException {
        try {
            // Sử dụng completion suggester để hiệu quả hơn cho auto-complete
            SearchResponse<Document> response = elasticsearchClient.search(s -> s
                    .index("documents")
                            .suggest(sg -> sg
                                    .text(query) // Đặt text query ở cấp độ suggester
                                    .suggesters("doc-suggest",
                                            fs -> fs.completion(
                                                    cs -> cs
                                                            .field("suggest")
                                                            .skipDuplicates(true)
                                                            .size(limit)
                                                            .fuzzy(f -> f
                                                                    .fuzziness("AUTO"))
                                            )
                                    )
                            )
                            .source(src -> src.fetch(true)), // Lấy source để có thể truy cập documentId
                    Document.class);

            if (response.suggest() == null || !response.suggest().containsKey("doc-suggest") || 
                response.suggest().get("doc-suggest").isEmpty()) {
                return new ArrayList<>(); // Trả về danh sách rỗng nếu không có gợi ý
            }

            List<CompletionSuggestOption<Document>> options = response
                    .suggest()
                    .get("doc-suggest")
                    .get(0)
                    .completion()
                    .options();

            return options.stream()
                    .map(opt -> {
                        // Lấy documentId từ source (nếu có) với kiểm tra null an toàn hơn
                        String docId = null;
                        Document source = opt.source();
                        if (source != null) {
                            docId = source.getDocumentId();
                        }
                        return new DocumentSuggestResponse(docId, opt.text());
                    })
                    .collect(Collectors.toList());
        } catch (Exception e) {
            // Log lỗi chi tiết
            e.printStackTrace();
            // Trả về danh sách rỗng để tránh lỗi cho client
            return new ArrayList<>();
        }
    }

    public Document updateDocument(Document document) {
        return documentRepository.save(document);
    }

    public Document getDocumentById(String id) {
        return documentRepository.getDocumentEntityByDocumentId(id);
    }

    public void deleteDocument(String id) {
        documentRepository.deleteDocumentEntityByDocumentId(id);
    }

    public Document processNormalizedDocument(DocumentDataDto documentData) {
        Document document = documentRepository.findById(documentData.getDocumentId())
                .orElse(new Document());

        document.setDocumentId(documentData.getDocumentId());
        document.setDocumentNumber(documentData.getDocumentNumber());
        String temp = documentData.getTitle();
        if (temp != null && temp.startsWith("V/v")) {
            temp = temp.substring(3).trim();
        }
        document.setTitle(temp);
        document.setContent(documentData.getContent());
        document.setDocumentType(documentData.getDocumentType());
        document.setIssuingAgency(documentData.getIssuingAgency());
        document.setSigner(documentData.getSigner());
        document.setIssueDate(documentData.getIssueDate());
        document.setFileLink(documentData.getFileUrl());
        document.setStatus("COMPLETED");

        document.setSearchText(document.getDocumentType() + " " +
                document.getDocumentNumber() + " năm " +
                (document.getIssueDate() != null ? document.getIssueDate().getYear() : "") + " về " +
                document.getTitle());

        List<String> suggestInputs = new ArrayList<>();
        if (document.getTitle() != null) suggestInputs.add(document.getTitle());
        if (document.getDocumentNumber() != null) suggestInputs.add(document.getDocumentNumber());
        if (document.getDocumentType() != null) suggestInputs.add(document.getDocumentType());

        if (document.getTitle() != null && document.getDocumentNumber() != null) {
            suggestInputs.add(document.getTitle() + " " + document.getDocumentNumber());
        }
        
        // Cập nhật trường suggest trong đối tượng Document
        Completion suggest = new Completion(suggestInputs.toArray(new String[0]));
        document.setSuggest(suggest);

        try {
            // Tạo Map chứa dữ liệu cần lập chỉ mục thay vì gửi trực tiếp đối tượng Document
            Map<String, Object> esDocument = new HashMap<>();
            esDocument.put("documentId", document.getDocumentId());
            esDocument.put("documentNumber", document.getDocumentNumber());
            esDocument.put("title", document.getTitle());
            esDocument.put("content", document.getContent());
            esDocument.put("documentType", document.getDocumentType());
            esDocument.put("issuingAgency", document.getIssuingAgency());
            esDocument.put("signer", document.getSigner());
            if (document.getIssueDate() != null) {
                esDocument.put("issueDate", document.getIssueDate().toString());
            } else {
                esDocument.put("issueDate", null);
            }

            esDocument.put("fileLink", document.getFileLink());
            esDocument.put("status", document.getStatus());
            esDocument.put("searchText", document.getSearchText());

            // Xử lý riêng trường suggest
            if (!suggestInputs.isEmpty()) {
                Map<String, Object> suggestMap = new HashMap<>();
                suggestMap.put("input", suggestInputs);
                esDocument.put("suggest", suggestMap);
            }

            // Lưu trực tiếp đối tượng document thay vì tạo Map
            elasticsearchClient.index(i -> i
                    .index("documents")
                    .id(document.getDocumentId())
                    .document(esDocument)
            );
            log.info("Đã lập chỉ mục thành công tài liệu ID: {}", document.getDocumentId());

        } catch (IOException e) {
            throw new RuntimeException("Lỗi khi lập chỉ mục tài liệu trong Elasticsearch: " + e.getMessage(), e);
        }

        return documentRepository.save(document);
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> uploadDocumentWithKafka(MultipartFile file) {
        try {
            HttpServletRequest currentRequest = ((ServletRequestAttributes) RequestContextHolder.getRequestAttributes()).getRequest();
            String jwtToken = currentRequest.getHeader("Authorization").substring(7);
            // Gửi file đến StorageService trước để lấy document ID và fileUrl
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);
            headers.set("Authorization", "Bearer " + jwtToken);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", new ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    return file.getOriginalFilename();
                }
            });

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

            RestTemplate restTemplate = new RestTemplate();
            ResponseEntity<Map> response = restTemplate.postForEntity(
                    storageServiceUrl + "/api/files/upload",
                    requestEntity,
                    Map.class
            );

            Map<String, Object> responseBody = response.getBody();

            if (responseBody != null && responseBody.containsKey("documentId")) {
                String documentId = (String) responseBody.get("documentId");
                String fileUrl = (String) responseBody.get("fileUrl");

                // Tạo Document với ID từ StorageService
                Document document = new Document();
                document.setDocumentId(documentId);
                document.setDocumentName(file.getOriginalFilename());
                document.setFileLink(fileUrl);
                document.setStatus("PROCESSING");
                documentRepository.save(document);

                // Chuẩn bị dữ liệu để gửi qua Kafka
                Map<String, Object> documentData = new HashMap<>();
                documentData.put("documentId", documentId);
                documentData.put("fileName", file.getOriginalFilename());
                documentData.put("fileUrl", fileUrl);
                documentData.put("mimeType", file.getContentType());
                documentData.put("uploadTime", LocalDate.now().toString());

                // Gửi sự kiện qua Kafka để xử lý bất đồng bộ
                kafkaProducer.sendFileUploadedEvent(documentId, documentData);
                log.info("Đã gửi sự kiện Kafka cho tài liệu ID: {}", documentId);

                // Trả về kết quả cho người dùng
                Map<String, Object> result = new HashMap<>();
                result.put("documentId", documentId);
                result.put("fileUrl", fileUrl);
                result.put("status", "PROCESSING");
                result.put("message", "Tài liệu đang được xử lý. Sử dụng API /api/documents/" + documentId + "/status để kiểm tra tiến độ.");
                result.put("fileName", file.getOriginalFilename());

                return result;
            } else {
                throw new RuntimeException("Không nhận được document ID từ Storage Service");
            }
        } catch (IOException e) {
            throw new RuntimeException("Lỗi khi đọc file: " + e.getMessage(), e);
        } catch (Exception e) {
            throw new RuntimeException("Lỗi khi xử lý file: " + e.getMessage(), e);
        }
    }
}
