package com.rs.pdfminer.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class DocumentSuggestResponse {
    private String id;
    private String textSearch;
}
