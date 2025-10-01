package com.rs.documentservice.service;

import com.google.genai.Client;
import com.google.genai.types.GenerateContentResponse;
import com.rs.documentservice.dto.ChatbotRequestDto;
import com.rs.documentservice.dto.ChatbotResponseDto;
import com.rs.documentservice.model.Document;
import com.rs.documentservice.repository.DocumentRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class ChatbotService {

    @Value("${gemini.api.key}")
    private String googleAiApiKey;

    private Client googleAiChatClient;

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private DocumentService documentService;
    
    @PostConstruct
    public void init() {
        log.info("Initializing Google AI client with API key: {}", googleAiApiKey != null ? "API key present" : "API key is NULL");
        if (googleAiApiKey == null) {
            log.error("Google AI API key is not configured. Make sure 'gemini.api.key' is set in the configuration.");
        } else {
            googleAiChatClient = Client.builder().apiKey(googleAiApiKey).build();
            log.info("Google AI client initialized successfully");
        }
    }

    public ChatbotResponseDto processQuery(ChatbotRequestDto request) {
        log.info("Processing chatbot query: {}", request.getQuery());

        // Search for relevant documents based on the query
        List<Document> relevantDocuments = searchDocuments(request.getQuery());
        if (relevantDocuments.isEmpty()) {
            return ChatbotResponseDto.builder()
                    .answer("Không tìm thấy tài liệu nào liên quan đến câu hỏi của bạn. Vui lòng thử với từ khóa khác.")
                    .documentIds(new ArrayList<>())
                    .build();
        }

        // Build context with document information
        String context = buildContext(relevantDocuments);

        // Call Gemini API with context and query
        String answer = callGeminiApi(context, request.getQuery());
        
        // Process the answer to make it more readable and handle document references
        answer = postProcessAnswer(answer);

        // Extract document IDs for displaying links
        List<String> documentIds = extractDocumentIds(relevantDocuments);
        
        // Tạo map chứa thông tin tóm tắt về các tài liệu
        Map<String, ChatbotResponseDto.DocumentSummary> documentSummaries = new java.util.HashMap<>();
        for (int i = 0; i < relevantDocuments.size(); i++) {
            Document doc = relevantDocuments.get(i);
            String docIndex = String.valueOf(i + 1); // Chỉ số hiển thị cho người dùng (1-based)
            
            documentSummaries.put(docIndex, ChatbotResponseDto.DocumentSummary.builder()
                    .id(doc.getDocumentId())
                    .title(doc.getTitle())
                    .documentNumber(doc.getDocumentNumber())
                    .documentType(doc.getDocumentType())
                    .issuingAgency(doc.getIssuingAgency())
                    .build());
        }

        return ChatbotResponseDto.builder()
                .answer(answer)
                .documentIds(documentIds)
                .documentSummaries(documentSummaries)
                .build();
    }

    private List<Document> searchDocuments(String query) {
        // First try to find exact matches
        Pageable pageable = PageRequest.of(0, 5);
        List<Document> documents = documentService.searchDocuments(query, 0, 5);
        
        // If not enough documents found, try a more fuzzy search
        if (documents.size() < 2) {
            String[] keywords = query.split("\\s+");
            for (String keyword : keywords) {
                if (keyword.length() > 3) {  // Only use meaningful keywords
                    List<Document> additionalDocs = documentService.searchDocuments(keyword, 0, 5);
                    for (Document doc : additionalDocs) {
                        if (!documents.contains(doc)) {
                            documents.add(doc);
                        }
                        // Stop when we have enough documents
                        if (documents.size() >= 5) {
                            break;
                        }
                    }
                }
                
                if (documents.size() >= 5) {
                    break;
                }
            }
        }
        
        return documents;
    }

    private String buildContext(List<Document> documents) {
        StringBuilder context = new StringBuilder();
        context.append("Dưới đây là thông tin từ các tài liệu liên quan đến câu hỏi:\n\n");

        for (int i = 0; i < documents.size(); i++) {
            Document doc = documents.get(i);
            
            context.append("[Document ").append(i + 1).append("]\\n");
            context.append("ID: ").append(doc.getDocumentId()).append("\\n");
            context.append("Số hiệu: ").append(doc.getDocumentNumber() != null ? doc.getDocumentNumber() : "Không có").append("\\n");
            context.append("Tiêu đề: ").append(doc.getTitle() != null ? doc.getTitle() : "Không có tiêu đề").append("\\n");
            context.append("Loại tài liệu: ").append(doc.getDocumentType() != null ? doc.getDocumentType() : "Không rõ").append("\\n");
            context.append("Cơ quan ban hành: ").append(doc.getIssuingAgency() != null ? doc.getIssuingAgency() : "Không rõ").append("\\n");
            
            if (doc.getIssueDate() != null) {
                context.append("Ngày ban hành: ").append(doc.getIssueDate()).append("\\n");
            } else {
                context.append("Ngày ban hành: Không rõ\\n");
            }
            
            // Limit content length to avoid exceeding token limits
            String content = doc.getContent();
            if (content != null) {
                if (content.length() > 50000) {
                    content = content.substring(0, 50000) + "...";
                }
                context.append("Nội dung: ").append(content).append("\\n\\n");
            } else {
                context.append("Nội dung: Không có nội dung\\n\\n");
            }
        }

        return context.toString();
    }

    private String callGeminiApi(String context, String query) {
        try {
            if (googleAiChatClient == null) {
                log.error("Google AI client is not initialized. Check if the API key is correctly set.");
                return "Hệ thống chưa được cấu hình đúng. Vui lòng liên hệ quản trị viên.";
            }
            
            String prompt = buildPrompt(context, query);

            // Using Google Generative AI client directly
            GenerateContentResponse response = googleAiChatClient.models.generateContent(
                    "gemini-2.0-flash", 
                    prompt,
                    null
            );

            return response.text();
        } catch (Exception e) {
            log.error("Error calling Gemini API", e);
            return "Đã xảy ra lỗi khi tạo phản hồi: " + e.getMessage();
        }
    }

    private String buildPrompt(String context, String query) {
        return "Bạn là trợ lý thông minh đang hỗ trợ tra cứu thông tin từ các tài liệu văn bản chính thức của Việt Nam. " +
                "Dựa vào thông tin từ các tài liệu được cung cấp dưới đây, hãy trả lời câu hỏi một cách chi tiết và chính xác. " +
                "Nếu thông tin không được đề cập trong tài liệu, hãy nói rằng bạn không tìm thấy thông tin liên quan. " +
                "Đảm bảo trích dẫn số hiệu văn bản và tiêu đề cụ thể khi đưa ra thông tin. " +
                "Khi đề cập đến tài liệu trong câu trả lời, hãy sử dụng cú pháp [Document X: Số hiệu - Tiêu đề]. " +
                "Ở cuối câu trả lời, tạo một mục TÀI LIỆU THAM KHẢO và liệt kê chi tiết các tài liệu đã dùng, " +
                "bao gồm số thứ tự, số hiệu văn bản, tiêu đề, và cơ quan ban hành (nếu có).\n\n" +
                "THÔNG TIN TÀI LIỆU:\n" + 
                context + 
                "\n\nCÂU HỎI: " + query + 
                "\n\nTRẢ LỜI:";
    }
    
    /**
     * Post-process the answer from Gemini to improve readability and handle document references
     */
    private String postProcessAnswer(String answer) {
        if (answer == null || answer.isEmpty()) {
            return "Không thể tạo phản hồi.";
        }
        
        // Break long paragraphs
        StringBuilder processedAnswer = new StringBuilder();
        String[] paragraphs = answer.split("\n{2,}");
        
        for (String paragraph : paragraphs) {
            if (paragraph.length() > 300) {
                String[] sentences = paragraph.split("(?<=[.!?])\\s+");
                int sentenceCount = 0;
                StringBuilder newParagraph = new StringBuilder();
                
                for (String sentence : sentences) {
                    newParagraph.append(sentence).append(" ");
                    sentenceCount++;
                    
                    if (sentenceCount >= 3) {
                        newParagraph.append("\n\n");
                        sentenceCount = 0;
                    }
                }
                
                processedAnswer.append(newParagraph.toString().trim()).append("\n\n");
            } else {
                processedAnswer.append(paragraph).append("\n\n");
            }
        }
        
        // Ensure document references are properly formatted
        String result = processedAnswer.toString().trim();
        
        // Check if document references section exists, if not try to add it
        if (!result.contains("TÀI LIỆU THAM KHẢO") && result.contains("[Document ")) {
            result += "\n\nTÀI LIỆU THAM KHẢO:\n";
            
            // Try to extract document references from the text
            java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("\\[Document (\\d+)(?::|\\]|\\s)");
            java.util.regex.Matcher matcher = pattern.matcher(result);
            
            // Create a set to store unique document numbers
            java.util.Set<String> documentNumbers = new java.util.HashSet<>();
            
            // Find all document references
            while (matcher.find()) {
                documentNumbers.add(matcher.group(1));
            }
            
            // Add them to the references section
            for (String docNumber : documentNumbers) {
                result += "\n- Document " + docNumber;
            }
        }
        
        return result;
    }

    /**
     * Extract document IDs for building links
     */
    private List<String> extractDocumentIds(List<Document> documents) {
        List<String> documentIds = new ArrayList<>();
        for (Document document : documents) {
            documentIds.add(document.getDocumentId());
        }
        return documentIds;
    }
}
