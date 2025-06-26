package com.rs.documentservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ChatbotResponseDto {
    private String answer;
    private List<String> documentIds;
    
    // Thông tin bổ sung về tài liệu để hiển thị trong kết quả
    @Builder.Default
    private Map<String, DocumentSummary> documentSummaries = null;
    
    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class DocumentSummary {
        private String id;
        private String title;
        private String documentNumber;
        private String documentType;
        private String issuingAgency;
    }
}
