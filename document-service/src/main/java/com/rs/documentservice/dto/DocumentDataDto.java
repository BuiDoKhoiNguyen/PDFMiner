package com.rs.documentservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DocumentDataDto {
    private String documentId;
    private String documentNumber;
    private String title;
    private String content;
    private String documentType;
    private String issuingAgency;
    private String signer;
    private LocalDate issueDate;
    private String status;
    private String fileUrl;
}
