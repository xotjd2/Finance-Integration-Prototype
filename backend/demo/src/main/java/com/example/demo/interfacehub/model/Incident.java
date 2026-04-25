package com.example.demo.interfacehub.model;

public record Incident(
        SeverityLevel severity,
        String title,
        String detail,
        String occurredAt
) {
}
