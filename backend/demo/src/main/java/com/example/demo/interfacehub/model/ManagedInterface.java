package com.example.demo.interfacehub.model;

public record ManagedInterface(
        String id,
        String name,
        String organization,
        ProtocolType protocol,
        DirectionType direction,
        String schedule,
        InterfaceStatus status,
        double successRate,
        double slaPercent,
        int avgLatencyMs,
        double avgProcessMinutes,
        int todayCount,
        int retryCount,
        int queueDepth,
        String lastRunAt,
        String lastResult,
        String errorSummary,
        String operatorNote,
        String description,
        InterfaceConfig config
) {
}
