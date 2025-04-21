package com.rs.documentservice.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.DateFormat;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;

import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
@org.springframework.data.elasticsearch.annotations.Document(indexName = "documents")
public class Document {
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
}