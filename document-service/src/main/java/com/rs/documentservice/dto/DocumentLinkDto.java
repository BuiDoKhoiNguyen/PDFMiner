package com.rs.documentservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DocumentLinkDto {
    private String id;
    private String title;
    private String documentNumber;
    private String documentType;
    private String url;
}
