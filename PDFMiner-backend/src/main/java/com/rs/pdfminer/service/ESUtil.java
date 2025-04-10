package com.rs.pdfminer.service;

import co.elastic.clients.elasticsearch._types.query_dsl.MatchQuery;
import co.elastic.clients.elasticsearch._types.query_dsl.Query;
import co.elastic.clients.elasticsearch._types.query_dsl.TextQueryType;
import lombok.val;

import java.util.function.Supplier;

public class ESUtil {
    public static Supplier<Query> createSupplierAutoSuggest(String query) {
        return () -> Query.of(q ->
                q.multiMatch(m -> m
                        .query(query)
                        .fields("documentNumber^3", "title^2", "documentType^1", "content")
                        .type(TextQueryType.PhrasePrefix)
                )
        );
    }
}
