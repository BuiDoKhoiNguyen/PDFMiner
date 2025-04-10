package com.rs.pdfminer.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.elasticsearch.annotations.CompletionField;
import org.springframework.data.elasticsearch.annotations.DateFormat;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;
import org.springframework.data.elasticsearch.core.suggest.Completion;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Document(indexName = "documents")
@JsonIgnoreProperties(ignoreUnknown = true)
public class DocumentEntity {
    @Id
    private String id;

    @Field(type = FieldType.Keyword)
    private String documentNumber;

    @Field(type = FieldType.Keyword)
    private String documentName;

    @Field(type = FieldType.Text, analyzer = "standard")
    private String title;

    @Field(type = FieldType.Text, analyzer = "standard")
    private String content;

    @Field(type = FieldType.Keyword)
    private String documentType;

    @Field(type = FieldType.Keyword)
    private String issuingAgency;

    @Field(type = FieldType.Keyword)
    private String signer;

    @Field(type = FieldType.Date, format = DateFormat.date)
    private LocalDate issueDate;

    @Field(type = FieldType.Keyword)
    private String status;

    @Field(type = FieldType.Keyword)
    private String fileLink;

    @Field(type = FieldType.Text, analyzer = "standard")
    private String searchText;

//    @CompletionField
//    private CompletionField suggest;

//    public void setSuggest() {
//        List<String> suggestInput = new ArrayList<>();
//
//        if (title != null && !title.isEmpty()) {
//            suggestInput.add(title);
//        }
//        if (documentNumber != null && !documentNumber.isEmpty()) {
//            suggestInput.add(documentNumber);
//        }
//
//        if (!suggestInput.isEmpty()) {
//            this.suggest = new Completion(suggestInput.toArray(new String[0]));
//        } else {
//            this.suggest = new Completion(new String[]{"default_suggestion"});
//        }
//    }
}