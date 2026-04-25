package com.example.demo.interfacehub.api;

public record InterfaceUpsertRequest(
        String name,
        String organization,
        String protocol,
        String direction,
        String schedule,
        String description,
        String endpoint,
        String sourceSystem,
        String targetSystem,
        String authType,
        String payloadFormat,
        String retryPolicy,
        String scheduleExpression,
        String ownerTeam,
        String operatorNote
) {
}
