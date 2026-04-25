package com.example.demo.interfacehub.model;

public record InterfaceConfig(
        String endpoint,
        String sourceSystem,
        String targetSystem,
        String authType,
        String payloadFormat,
        String retryPolicy,
        String scheduleExpression,
        String ownerTeam
) {
}
