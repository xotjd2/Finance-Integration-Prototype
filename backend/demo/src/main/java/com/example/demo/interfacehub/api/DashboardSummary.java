package com.example.demo.interfacehub.api;

public record DashboardSummary(
        int totalInterfaces,
        int failed,
        int warning,
        int running,
        int healthy,
        int totalTransactions,
        double avgLatency,
        double avgSlaRate
) {
}
